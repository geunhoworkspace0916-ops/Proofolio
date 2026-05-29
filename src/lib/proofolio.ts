import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  type ContractRunner,
  type Signer,
} from "ethers";
import { appEnv } from "../config/env";
import { proofolioContractConfig } from "../config/contracts";
import { SEPOLIA_CHAIN_ID } from "../config/networks";
import { addressesEqual, isValidAddress, normalizeAddress } from "./address";
import type { Eip1193Provider } from "../types/ethereum";

export type IssuerRecord = {
  name: string;
  metaURI: string;
  active: boolean;
  registeredAt: bigint;
};

export type CredentialVerification = {
  issuer: string;
  issuerName: string;
  issuerActive: boolean;
  holder: string;
  dataHash: string;
  credType: string;
  issuedAt: bigint;
  revoked: boolean;
};

export type WalletRoles = {
  isAdmin: boolean;
  isIssuer: boolean;
};

type IssuerTuple = readonly [string, string, boolean, bigint] & {
  name: string;
  metaURI: string;
  active: boolean;
  registeredAt: bigint;
};

type VerificationTuple = readonly [
  string,
  string,
  boolean,
  string,
  string,
  string,
  bigint,
  boolean,
] & {
  issuer: string;
  issuerName: string;
  issuerActive: boolean;
  holder: string;
  dataHash: string;
  credType: string;
  issuedAt: bigint;
  revoked: boolean;
};

let cachedReadProvider: JsonRpcProvider | null = null;

export function canReadProofolio() {
  return (
    appEnv.sepoliaRpcUrl.length > 0 &&
    appEnv.contractAddress.length > 0 &&
    isValidAddress(appEnv.contractAddress)
  );
}

export function getReadProvider() {
  if (!appEnv.sepoliaRpcUrl) {
    throw new Error("VITE_SEPOLIA_RPC_URL is required for read-only access.");
  }

  cachedReadProvider ??= new JsonRpcProvider(
    appEnv.sepoliaRpcUrl,
    SEPOLIA_CHAIN_ID,
    { staticNetwork: true },
  );

  return cachedReadProvider;
}

export function getBrowserProvider(ethereum: Eip1193Provider) {
  return new BrowserProvider(ethereum);
}

export function getProofolioContract(runner: ContractRunner) {
  if (!appEnv.contractAddress) {
    throw new Error("VITE_CONTRACT_ADDRESS is required.");
  }
  if (!isValidAddress(appEnv.contractAddress)) {
    throw new Error("VITE_CONTRACT_ADDRESS must be a valid Ethereum address.");
  }

  return new Contract(
    proofolioContractConfig.address,
    proofolioContractConfig.abi,
    runner,
  );
}

export function getReadProofolioContract() {
  return getProofolioContract(getReadProvider());
}

export function getWriteProofolioContract(signer: Signer) {
  return getProofolioContract(signer);
}

export async function readOwner() {
  const owner = (await getReadProofolioContract().owner()) as string;

  return normalizeAddress(owner);
}

export async function readIssuer(address: string): Promise<IssuerRecord> {
  const issuer = (await getReadProofolioContract().issuers(
    normalizeAddress(address),
  )) as IssuerTuple;

  return {
    name: issuer.name,
    metaURI: issuer.metaURI,
    active: issuer.active,
    registeredAt: issuer.registeredAt,
  };
}

export async function readWalletRoles(address: string): Promise<WalletRoles> {
  if (!canReadProofolio()) {
    return { isAdmin: false, isIssuer: false };
  }

  const [owner, issuer] = await Promise.all([
    readOwner(),
    readIssuer(address),
  ]);

  return {
    isAdmin: addressesEqual(owner, address),
    isIssuer: issuer.active,
  };
}

export async function readCredentialVerification(
  tokenId: bigint,
): Promise<CredentialVerification> {
  const verification = (await getReadProofolioContract().verify(
    tokenId,
  )) as VerificationTuple;

  return {
    issuer: normalizeAddress(verification.issuer),
    issuerName: verification.issuerName,
    issuerActive: verification.issuerActive,
    holder: normalizeAddress(verification.holder),
    dataHash: verification.dataHash,
    credType: verification.credType,
    issuedAt: verification.issuedAt,
    revoked: verification.revoked,
  };
}

export async function readCredentialValidity(tokenId: bigint) {
  return (await getReadProofolioContract().isValid(tokenId)) as boolean;
}

export async function readCredentialIds(holder: string) {
  return (await getReadProofolioContract().credentialsOf(
    normalizeAddress(holder),
  )) as bigint[];
}
