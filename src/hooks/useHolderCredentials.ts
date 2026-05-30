import { useEffect, useState } from "react";
import {
  canReadProofolio,
  readHolderCredentials,
  type HolderCredential,
} from "../lib/proofolio";

type HolderCredentialsState =
  | { status: "idle"; credentials: HolderCredential[]; error: null }
  | { status: "loading"; credentials: HolderCredential[]; error: null }
  | { status: "success"; credentials: HolderCredential[]; error: null }
  | { status: "error"; credentials: HolderCredential[]; error: string };

function readableError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "증명서 목록 조회에 실패했습니다.";
}

export function useHolderCredentials(holder: string | null) {
  const [state, setState] = useState<HolderCredentialsState>({
    status: "idle",
    credentials: [],
    error: null,
  });

  useEffect(() => {
    if (!holder) {
      setState({ status: "idle", credentials: [], error: null });
      return;
    }

    if (!canReadProofolio()) {
      setState({
        status: "error",
        credentials: [],
        error: "읽기 전용 RPC와 컨트랙트 주소를 설정해주세요.",
      });
      return;
    }

    let active = true;

    setState({ status: "loading", credentials: [], error: null });

    readHolderCredentials(holder)
      .then((credentials) => {
        if (active) {
          setState({ status: "success", credentials, error: null });
        }
      })
      .catch((error) => {
        if (active) {
          setState({
            status: "error",
            credentials: [],
            error: readableError(error),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [holder]);

  return state;
}
