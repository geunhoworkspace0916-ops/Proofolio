import { createContext } from "react";

export type WalletStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "unavailable"
  | "error";

export type WalletContextValue = {
  address: string | null;
  chainId: number | null;
  error: string | null;
  hasMetaMask: boolean;
  isAdmin: boolean;
  isIssuer: boolean;
  isSepolia: boolean;
  shortAddress: string | null;
  status: WalletStatus;
  connectWallet: () => Promise<void>;
  refreshWalletRoles: () => Promise<void>;
  switchToSepolia: () => Promise<void>;
};

export const WalletContext = createContext<WalletContextValue | null>(null);
