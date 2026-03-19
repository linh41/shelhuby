// Network configuration for Shelby Protocol (Testnet + Shelbynet)
import { type NetworkId, type NetworkConfig } from '@/app/types';

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  testnet: {
    name: 'Testnet',
    shelbyRpc: 'https://api.testnet.shelby.xyz/shelby',
    aptosFullnode: 'https://api.testnet.aptoslabs.com/v1',
    aptosIndexer: 'https://api.testnet.aptoslabs.com/v1/graphql',
    explorerBase: 'https://explorer.shelby.xyz/testnet',
    aptosExplorer: 'https://explorer.aptoslabs.com/?network=testnet',
  },
  shelbynet: {
    name: 'Shelbynet',
    shelbyRpc: 'https://api.shelbynet.shelby.xyz/shelby',
    aptosFullnode: 'https://api.shelbynet.shelby.xyz/v1',
    aptosIndexer: 'https://api.shelbynet.shelby.xyz/v1/graphql',
    explorerBase: 'https://explorer.shelby.xyz/shelbynet',
    aptosExplorer: 'https://explorer.aptoslabs.com/?network=shelbynet',
  },
};

export const SHELBY_CONTRACT =
  '0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a';
export const SHELBY_USD_ASSET =
  '0x1b18363a9f1fe5e6ebf247daba5cc1c18052bb232efdc4c50f556053922d98e1';
export const APT_ASSET = '0x1::aptos_coin::AptosCoin';
