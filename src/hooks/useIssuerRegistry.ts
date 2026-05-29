import { useCallback, useEffect, useState } from "react";
import {
  canReadProofolio,
  readIssuerSummaries,
  type IssuerSummary,
} from "../lib/proofolio";

type IssuerRegistryState = {
  error: string | null;
  issuers: IssuerSummary[];
  loading: boolean;
};

function readableRegistryError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "발급기관 목록을 불러오지 못했습니다.";
}

export function useIssuerRegistry(enabled: boolean) {
  const [state, setState] = useState<IssuerRegistryState>({
    error: null,
    issuers: [],
    loading: false,
  });

  const refresh = useCallback(async () => {
    if (!enabled) {
      setState({ error: null, issuers: [], loading: false });
      return;
    }

    if (!canReadProofolio()) {
      setState({
        error: "읽기 전용 RPC와 컨트랙트 주소를 설정해주세요.",
        issuers: [],
        loading: false,
      });
      return;
    }

    setState((current) => ({ ...current, error: null, loading: true }));

    try {
      const issuers = await readIssuerSummaries();
      setState({ error: null, issuers, loading: false });
    } catch (error) {
      setState({
        error: readableRegistryError(error),
        issuers: [],
        loading: false,
      });
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
