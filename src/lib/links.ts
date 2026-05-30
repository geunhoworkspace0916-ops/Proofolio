export function createVerifyUrl(tokenId: bigint) {
  return new URL(`/verify/${tokenId.toString()}`, window.location.origin).toString();
}

export function createVerifyPath(tokenId: bigint) {
  return `/verify/${tokenId.toString()}`;
}

export function createIssuerProfilePath(issuer: string) {
  return `/issuers/${issuer}`;
}
