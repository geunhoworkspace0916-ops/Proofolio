import type { InterfaceAbi } from "ethers";

export const proofolioAbi = [
  "function owner() view returns (address)",
  "function issuers(address issuer) view returns (string name, string metaURI, bool active, uint256 registeredAt)",
  "function verify(uint256 tokenId) view returns (address issuer, string issuerName, bool issuerActive, address holder, bytes32 dataHash, string credType, uint256 issuedAt, bool revoked)",
  "function credentialsOf(address holder) view returns (uint256[] tokenIds)",
  "function isValid(uint256 tokenId) view returns (bool)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalCredentials() view returns (uint256)",
  "function registerIssuer(address issuer, string name, string metaURI)",
  "function setIssuerActive(address issuer, bool active)",
  "function issueCredential(address holder, bytes32 dataHash, string credType, string metaURI) returns (uint256 tokenId)",
  "function revokeCredential(uint256 tokenId)",
  "event IssuerRegistered(address indexed issuer, string name)",
  "event IssuerStatusChanged(address indexed issuer, bool active)",
  "event CredentialIssued(uint256 indexed tokenId, address indexed issuer, address indexed holder, bytes32 dataHash, string credType)",
  "event CredentialRevoked(uint256 indexed tokenId, address indexed issuer)",
] as const satisfies InterfaceAbi;
