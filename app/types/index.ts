// Core TypeScript interfaces for Shehuby Dashboard

export type NetworkId = 'testnet' | 'shelbynet';

export interface NetworkConfig {
  name: string;
  shelbyRpc: string;
  aptosFullnode: string;
  aptosIndexer: string;
  explorerBase: string;
  aptosExplorer: string;
}

export type BlobCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'data'
  | 'code'
  | 'archive'
  | 'ai-model'
  | 'unknown';

export interface BlobClassification {
  category: BlobCategory;
  confidence: 'high' | 'low';
  method: string;
}

export interface BlobMetadata {
  name: string;
  size: number;
  merkleRoot: string;
  owner: string;
  uploadTimestamp: number;
  expiryTimestamp: number;
  encoding: string;
  chunkSize: number;
  transactionVersion: number;
  txHash: string;
  storageCost: number; // ShelbyUSD
  gasFee: number; // APT
  classification?: BlobClassification;
}

export type BlobStatus = 'active' | 'expiring-soon' | 'expired' | 'pending';

export interface WalletProfile {
  address: string;
  network: NetworkId;
  shelbyUsdBalance: number;
  aptBalance: number;
  totalBlobs: number;
  totalStorageBytes: number;
  totalShelbyUsdSpent: number;
  totalAptSpent: number;
  firstActiveDate: number | null;
  storageScore: number;
}

export interface CostDataPoint {
  date: string; // YYYY-MM-DD
  shelbyUsd: number;
  apt: number;
}

export interface WalletData {
  profile: WalletProfile;
  blobs: BlobMetadata[];
  costHistory: CostDataPoint[];
}
