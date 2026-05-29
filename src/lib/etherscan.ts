import { appEnv } from "../config/env";

function etherscanBaseUrl() {
  return appEnv.etherscanBaseUrl.replace(/\/$/, "");
}

export function getEtherscanTxUrl(hash: string) {
  return `${etherscanBaseUrl()}/tx/${hash}`;
}
