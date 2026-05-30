import { useEffect, useMemo, useState } from "react";
import { isValidAddress } from "../lib/address";
import {
  canReadProofolio,
  readIssuerProfile,
  type IssuerSummary,
} from "../lib/proofolio";

type IssuerProfileState =
  | { status: "loading"; profile: null; error: null }
  | { status: "success"; profile: IssuerSummary; error: null }
  | { status: "error"; profile: null; error: string };

function readableError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "발급기관 프로필 조회에 실패했습니다.";
}

export function useIssuerProfile(issuerAddress: string | undefined) {
  const normalizedInput = useMemo(
    () => issuerAddress?.trim() ?? "",
    [issuerAddress],
  );
  const [state, setState] = useState<IssuerProfileState>({
    status: "loading",
    profile: null,
    error: null,
  });

  useEffect(() => {
    if (!normalizedInput || !isValidAddress(normalizedInput)) {
      setState({
        status: "error",
        profile: null,
        error: "유효한 발급기관 주소가 아닙니다.",
      });
      return;
    }

    if (!canReadProofolio()) {
      setState({
        status: "error",
        profile: null,
        error: "읽기 전용 RPC와 컨트랙트 주소를 설정해주세요.",
      });
      return;
    }

    let active = true;

    setState({ status: "loading", profile: null, error: null });

    readIssuerProfile(normalizedInput)
      .then((profile) => {
        if (!active) {
          return;
        }

        if (profile.registeredAt === 0n) {
          setState({
            status: "error",
            profile: null,
            error: "등록된 발급기관을 찾을 수 없습니다.",
          });
          return;
        }

        setState({ status: "success", profile, error: null });
      })
      .catch((error) => {
        if (active) {
          setState({
            status: "error",
            profile: null,
            error: readableError(error),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [normalizedInput]);

  return state;
}
