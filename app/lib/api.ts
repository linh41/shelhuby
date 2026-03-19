// API module for Aptos Indexer (GraphQL) + Fullnode REST — fetches balances and blob data
import { type NetworkId, type BlobMetadata, type CostDataPoint } from '@/app/types';
import { NETWORKS, SHELBY_USD_ASSET, APT_ASSET } from './networks';

const APT_DECIMALS = 8;
const SHELBY_USD_DECIMALS = 6;

function toDecimal(raw: number | string, decimals: number): number {
  return Number(raw) / Math.pow(10, decimals);
}

async function queryIndexer<T>(
  network: NetworkId,
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const url = NETWORKS[network].aptosIndexer;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Indexer request failed: ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0]?.message ?? 'GraphQL error');
  return json.data as T;
}

// ── Balances ─────────────────────────────────────────────────────────────────

const BALANCES_QUERY = `
query GetBalances($addr: String!) {
  current_fungible_asset_balances(where: { owner_address: { _eq: $addr } }) {
    asset_type
    amount
    metadata { name symbol decimals }
  }
}`;

interface RawBalance {
  asset_type: string;
  amount: number;
  metadata?: { name: string; symbol: string; decimals: number } | null;
}

export async function fetchWalletBalances(
  address: string,
  network: NetworkId
): Promise<{ aptBalance: number; shelbyUsdBalance: number }> {
  try {
    const data = await queryIndexer<{ current_fungible_asset_balances: RawBalance[] }>(
      network, BALANCES_QUERY, { addr: address }
    );
    const balances = data?.current_fungible_asset_balances ?? [];
    let aptBalance = 0;
    let shelbyUsdBalance = 0;
    for (const b of balances) {
      const assetType = b.asset_type?.toLowerCase() ?? '';
      if (assetType === APT_ASSET.toLowerCase() || assetType.includes('aptos_coin')) {
        aptBalance = toDecimal(b.amount ?? 0, b.metadata?.decimals ?? APT_DECIMALS);
      } else if (assetType === SHELBY_USD_ASSET.toLowerCase()) {
        shelbyUsdBalance = toDecimal(b.amount ?? 0, b.metadata?.decimals ?? SHELBY_USD_DECIMALS);
      }
    }
    return { aptBalance, shelbyUsdBalance };
  } catch {
    return { aptBalance: 0, shelbyUsdBalance: 0 };
  }
}

// ── Blob Transactions ────────────────────────────────────────────────────────
// Strategy: find blob upload TXs via GraphQL, then fetch full payload via REST

const BLOB_TX_QUERY = `
query GetBlobTransactions($addr: String!) {
  account_transactions(
    where: {
      account_address: { _eq: $addr }
      user_transaction: {
        entry_function_id_str: { _like: "%register_multiple_blobs%" }
      }
    }
    order_by: { transaction_version: desc }
    limit: 200
  ) {
    transaction_version
    user_transaction {
      entry_function_id_str
      timestamp
      gas_unit_price
    }
  }
}`;

interface RawBlobTx {
  transaction_version: number;
  user_transaction?: {
    entry_function_id_str: string;
    timestamp: string;
    gas_unit_price: number;
  } | null;
}

// Fetch full TX details from Aptos REST API to get payload arguments
interface TxPayload {
  arguments: unknown[];
}

interface FullTxResponse {
  version: string;
  gas_used: string;
  gas_unit_price: string;
  timestamp: string;
  payload: TxPayload;
  events: Array<{ type: string; data: Record<string, unknown> }>;
}

async function fetchTxDetails(version: number, network: NetworkId): Promise<FullTxResponse | null> {
  try {
    const url = `${NETWORKS[network].aptosFullnode}/transactions/by_version/${version}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json() as FullTxResponse;
  } catch {
    return null;
  }
}

// Parse register_multiple_blobs payload.
// Supported layouts (Shelby protocol versions):
//   v1 (5 args): names[], expiry, merkleRoots[], encodingParams[], sizes[]
//   v2 (6 args): names[], expiry, merkleRoots[], encodingParams[], sizes[], extra
// We detect the layout by inspecting arg types rather than assuming fixed positions.
function parseBlobsFromPayload(
  tx: FullTxResponse,
  address: string
): BlobMetadata[] {
  const args = tx.payload?.arguments;
  if (!Array.isArray(args) || args.length < 4) return [];

  // Find the names array: first arg that is a string[]
  // The Aptos REST API serializes Move string[] as a JS string[] directly.
  let names: string[] = [];
  let expiryMicro = 0;
  let merkleRoots: string[] = [];
  let sizes: string[] = [];

  // Standard layout: args[0]=names, args[1]=expiry, args[2]=merkleRoots, args[3]=encodings, args[4]=sizes
  // args[0][0] may be undefined for empty array — treat any string[] (including empty) as standard layout
  if (Array.isArray(args[0]) && (args[0].length === 0 || typeof args[0][0] === 'string')) {
    names = args[0] as string[];
    expiryMicro = Number(args[1]);
    merkleRoots = Array.isArray(args[2]) ? (args[2] as string[]) : [];
    // args[3] = encodingParams (skip)
    sizes = Array.isArray(args[4]) ? (args[4] as string[]) : [];
  } else if (typeof args[0] === 'string' && args[0].startsWith('0x')) {
    // Alternate layout: single blob where args[0]=name, args[1]=expiry, args[2]=merkleRoot, args[3]=size
    // (some older register_blob calls)
    names = [args[0] as string];
    expiryMicro = Number(args[1]);
    merkleRoots = [args[2] as string ?? ''];
    sizes = [String(args[args.length - 1] ?? '0')];
  }

  if (names.length === 0) return [];

  // REST API returns timestamp in microseconds as a numeric string
  const uploadTsUs = Number(tx.timestamp);
  // Convert microseconds → Unix seconds
  const uploadTs = uploadTsUs > 1e12 ? Math.floor(uploadTsUs / 1e6) : uploadTsUs;

  // Expiry: on-chain value is microseconds; convert → seconds for consistency
  const expiryTs = expiryMicro > 1e12 ? Math.floor(expiryMicro / 1e6) : expiryMicro;

  const gasUsed = Number(tx.gas_used ?? 0);
  const gasPrice = Number(tx.gas_unit_price ?? 0);
  const totalGas = toDecimal(gasUsed * gasPrice, APT_DECIMALS);

  // Extract storage cost from Withdraw events (ShelbyUSD)
  let storageCost = 0;
  for (const evt of tx.events ?? []) {
    if (evt.type === '0x1::fungible_asset::Withdraw' && evt.data?.amount) {
      storageCost += toDecimal(Number(evt.data.amount), SHELBY_USD_DECIMALS);
    }
  }
  const perBlobCost = names.length > 0 ? storageCost / names.length : 0;
  const perBlobGas = names.length > 0 ? totalGas / names.length : 0;

  return names.map((name, i) => ({
    name,
    size: Number(sizes[i] ?? 0),
    merkleRoot: (merkleRoots[i] as string) ?? '',
    owner: address,
    uploadTimestamp: uploadTs,
    expiryTimestamp: expiryTs,
    encoding: 'clay',
    chunkSize: 1048576, // 1 MB default
    transactionVersion: Number(tx.version),
    txHash: '',
    storageCost: perBlobCost,
    gasFee: perBlobGas,
  }));
}

export async function fetchBlobEvents(
  address: string,
  network: NetworkId
): Promise<BlobMetadata[]> {
  // Step 1: Get blob transaction versions via GraphQL — let errors propagate
  const data = await queryIndexer<{ account_transactions: RawBlobTx[] }>(
    network, BLOB_TX_QUERY, { addr: address }
  );
  const txVersions = (data?.account_transactions ?? [])
    .map(t => t.transaction_version);

  if (txVersions.length === 0) return [];

  // Step 2: Fetch full TX payloads in parallel (batch of 10 at a time)
  // Individual TX fetches are best-effort — don't fail the whole batch if one 404s
  const blobs: BlobMetadata[] = [];
  const batchSize = 10;
  for (let i = 0; i < txVersions.length; i += batchSize) {
    const batch = txVersions.slice(i, i + batchSize);
    const txDetails = await Promise.all(
      batch.map(v => fetchTxDetails(v, network))
    );
    for (const tx of txDetails) {
      if (tx) blobs.push(...parseBlobsFromPayload(tx, address));
    }
  }
  return blobs;
}

// ── Cost History Aggregation ────────────────────────────────────────────────

export function buildCostHistory(blobs: BlobMetadata[]): CostDataPoint[] {
  const map = new Map<string, { shelbyUsd: number; apt: number }>();
  for (const blob of blobs) {
    if (!blob.uploadTimestamp) continue;
    const date = new Date(blob.uploadTimestamp * 1000).toISOString().slice(0, 10);
    const existing = map.get(date) ?? { shelbyUsd: 0, apt: 0 };
    map.set(date, {
      shelbyUsd: existing.shelbyUsd + blob.storageCost,
      apt: existing.apt + blob.gasFee,
    });
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, costs]) => ({ date, ...costs }));
}
