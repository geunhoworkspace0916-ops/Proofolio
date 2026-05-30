import { appEnv } from "../config/env";

function etherscanBaseUrl() {
  return appEnv.etherscanBaseUrl.replace(/\/$/, "");
}

export function getEtherscanTxUrl(hash: string) {
  return `${etherscanBaseUrl()}/tx/${hash}`;
}

export function getEtherscanTokenUrl(contractAddress: string, tokenId: bigint) {
  return `${etherscanBaseUrl()}/token/${contractAddress}?a=${tokenId.toString()}`;
}
