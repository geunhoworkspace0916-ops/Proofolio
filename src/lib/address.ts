import { getAddress, isAddress } from "ethers";

export function normalizeAddress(address: string) {
  return getAddress(address);
}

export function addressesEqual(left: string, right: string) {
  return normalizeAddress(left) === normalizeAddress(right);
}

export function isValidAddress(value: string) {
  return isAddress(value);
}

export function shortenAddress(address: string, prefixLength = 6, suffixLength = 4) {
  const normalized = normalizeAddress(address);

  return `${normalized.slice(0, prefixLength)}...${normalized.slice(-suffixLength)}`;
}
