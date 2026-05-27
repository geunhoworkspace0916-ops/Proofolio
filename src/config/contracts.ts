import { SEPOLIA_CHAIN_ID } from "./networks";
import { contractAddresses } from "../contracts/addresses";
import { proofolioAbi } from "../contracts/proofolioAbi";

export const proofolioContractConfig = {
  chainId: SEPOLIA_CHAIN_ID,
  address: contractAddresses.sepolia,
  abi: proofolioAbi,
} as const;
