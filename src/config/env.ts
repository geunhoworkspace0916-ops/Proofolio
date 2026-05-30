import { contractAddresses } from "../contracts/addresses";

const deployBlockRaw = import.meta.env.VITE_CONTRACT_DEPLOY_BLOCK;
const parsedDeployBlock = deployBlockRaw
  ? Number.parseInt(deployBlockRaw, 10)
  : Number.NaN;

export const appEnv = {
  sepoliaRpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL ?? "",
  contractAddress: contractAddresses.sepolia,
  /**
   * Block number where the Proofolio contract was deployed.
   * When set, used as the start block for `eth_getLogs` lookups
   * so we don't scan the chain from genesis (public RPCs cap
   * the range at ~50k blocks per request). Optional.
   */
  contractDeployBlock: Number.isFinite(parsedDeployBlock)
    ? parsedDeployBlock
    : null,
  etherscanBaseUrl:
    import.meta.env.VITE_ETHERSCAN_BASE_URL ?? "https://sepolia.etherscan.io",
} as const;

export const hasReadProviderConfig = appEnv.sepoliaRpcUrl.length > 0;
export const hasContractConfig = appEnv.contractAddress.length > 0;
