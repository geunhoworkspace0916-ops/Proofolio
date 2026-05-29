export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";
export const SEPOLIA_NETWORK_NAME = "Ethereum Sepolia";
export const SEPOLIA_CURRENCY_SYMBOL = "ETH";
export const SEPOLIA_BLOCK_EXPLORER_URL = "https://sepolia.etherscan.io";

export const ETHERSCAN_BASE_URL =
  import.meta.env.VITE_ETHERSCAN_BASE_URL ?? SEPOLIA_BLOCK_EXPLORER_URL;
