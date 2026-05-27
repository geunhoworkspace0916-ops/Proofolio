import { contractAddresses } from "../contracts/addresses";

export const appEnv = {
  sepoliaRpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL ?? "",
  contractAddress: contractAddresses.sepolia,
  etherscanBaseUrl:
    import.meta.env.VITE_ETHERSCAN_BASE_URL ?? "https://sepolia.etherscan.io",
} as const;

export const hasReadProviderConfig = appEnv.sepoliaRpcUrl.length > 0;
export const hasContractConfig = appEnv.contractAddress.length > 0;
