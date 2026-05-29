import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { appEnv } from "../config/env";
import {
  SEPOLIA_BLOCK_EXPLORER_URL,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_CHAIN_ID_HEX,
  SEPOLIA_CURRENCY_SYMBOL,
  SEPOLIA_NETWORK_NAME,
} from "../config/networks";
import { normalizeAddress, shortenAddress } from "../lib/address";
import { canReadProofolio, getBrowserProvider, readWalletRoles } from "../lib/proofolio";
import type { Eip1193Provider } from "../types/ethereum";
import {
  WalletContext,
  type WalletContextValue,
  type WalletStatus,
} from "./wallet-context";

function getEthereum() {
  return typeof window === "undefined" ? undefined : window.ethereum;
}

function parseChainId(chainId: string | number) {
  if (typeof chainId === "number") {
    return chainId;
  }

  return Number.parseInt(chainId, chainId.startsWith("0x") ? 16 : 10);
}

function readableWalletError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "지갑 요청 처리에 실패했습니다.";
}

async function requestWalletSnapshot(ethereum: Eip1193Provider) {
  const [accounts, chainId] = await Promise.all([
    ethereum.request<string[]>({ method: "eth_accounts" }),
    ethereum.request<string>({ method: "eth_chainId" }),
  ]);

  return {
    account: accounts[0] ? normalizeAddress(accounts[0]) : null,
    chainId: parseChainId(chainId),
  };
}

export function WalletProvider({ children }: PropsWithChildren) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isIssuer, setIsIssuer] = useState(false);
  const [status, setStatus] = useState<WalletStatus>("idle");

  const isSepolia = chainId === SEPOLIA_CHAIN_ID;

  const resetRoles = useCallback(() => {
    setIsAdmin(false);
    setIsIssuer(false);
  }, []);

  const refreshWalletRoles = useCallback(async () => {
    if (!address || !canReadProofolio()) {
      resetRoles();
      return;
    }

    try {
      const roles = await readWalletRoles(address);
      setIsAdmin(roles.isAdmin);
      setIsIssuer(roles.isIssuer);
    } catch (caughtError) {
      resetRoles();
      setError(readableWalletError(caughtError));
    }
  }, [address, resetRoles]);

  const connectWallet = useCallback(async () => {
    const ethereum = getEthereum();

    if (!ethereum) {
      setStatus("unavailable");
      setError("MetaMask 지갑을 찾을 수 없습니다.");
      return;
    }

    try {
      setStatus("connecting");
      setError(null);

      const accounts = await ethereum.request<string[]>({
        method: "eth_requestAccounts",
      });
      const nextChainId = await ethereum.request<string>({ method: "eth_chainId" });
      const nextAddress = accounts[0] ? normalizeAddress(accounts[0]) : null;

      setAddress(nextAddress);
      setChainId(parseChainId(nextChainId));
      setStatus(nextAddress ? "connected" : "idle");

      if (nextAddress) {
        await getBrowserProvider(ethereum).getSigner();
      }
    } catch (caughtError) {
      setStatus("error");
      setError(readableWalletError(caughtError));
    }
  }, []);

  const switchToSepolia = useCallback(async () => {
    const ethereum = getEthereum();

    if (!ethereum) {
      setStatus("unavailable");
      setError("MetaMask 지갑을 찾을 수 없습니다.");
      return;
    }

    try {
      setError(null);
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    } catch (caughtError) {
      const maybeError = caughtError as { code?: number };

      if (maybeError.code === 4902) {
        if (!appEnv.sepoliaRpcUrl) {
          setError("Sepolia 네트워크 추가를 위해 VITE_SEPOLIA_RPC_URL이 필요합니다.");
          return;
        }

        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              blockExplorerUrls: [SEPOLIA_BLOCK_EXPLORER_URL],
              chainId: SEPOLIA_CHAIN_ID_HEX,
              chainName: SEPOLIA_NETWORK_NAME,
              nativeCurrency: {
                decimals: 18,
                name: SEPOLIA_CURRENCY_SYMBOL,
                symbol: SEPOLIA_CURRENCY_SYMBOL,
              },
              rpcUrls: [appEnv.sepoliaRpcUrl],
            },
          ],
        });
        return;
      }

      setError(readableWalletError(caughtError));
    }
  }, []);

  useEffect(() => {
    const ethereum = getEthereum();

    setHasMetaMask(Boolean(ethereum?.isMetaMask ?? ethereum));

    if (!ethereum) {
      return;
    }

    let mounted = true;

    requestWalletSnapshot(ethereum)
      .then((snapshot) => {
        if (!mounted) {
          return;
        }

        setAddress(snapshot.account);
        setChainId(snapshot.chainId);
        setStatus(snapshot.account ? "connected" : "idle");
      })
      .catch((caughtError) => {
        if (!mounted) {
          return;
        }

        setStatus("error");
        setError(readableWalletError(caughtError));
      });

    const handleAccountsChanged = (accounts: string[]) => {
      const nextAddress = accounts[0] ? normalizeAddress(accounts[0]) : null;

      setAddress(nextAddress);
      setStatus(nextAddress ? "connected" : "idle");
      setError(null);

      if (!nextAddress) {
        resetRoles();
      }
    };

    const handleChainChanged = (nextChainId: string) => {
      setChainId(parseChainId(nextChainId));
      setError(null);
    };

    ethereum.on?.("accountsChanged", handleAccountsChanged);
    ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      mounted = false;
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [resetRoles]);

  useEffect(() => {
    void refreshWalletRoles();
  }, [refreshWalletRoles]);

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      chainId,
      connectWallet,
      error,
      hasMetaMask,
      isAdmin,
      isIssuer,
      isSepolia,
      refreshWalletRoles,
      shortAddress: address ? shortenAddress(address) : null,
      status,
      switchToSepolia,
    }),
    [
      address,
      chainId,
      connectWallet,
      error,
      hasMetaMask,
      isAdmin,
      isIssuer,
      isSepolia,
      refreshWalletRoles,
      status,
      switchToSepolia,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
