import { useEffect, useMemo, useState } from "react";
import {
  canReadProofolio,
  readCredentialIssuedTransactionHash,
  readCredentialValidity,
  readCredentialVerification,
  type CredentialVerificationDetails,
} from "../lib/proofolio";
import { getContractErrorName } from "../lib/contractErrors";

type VerificationState =
  | { status: "idle"; data: null; isValid: null; error: null }
  | { status: "loading"; data: null; isValid: null; error: null }
  | {
      status: "success";
      data: CredentialVerificationDetails;
      isValid: boolean;
      error: null;
    }
  | { status: "not_found"; data: null; isValid: null; error: string }
  | { status: "error"; data: null; isValid: null; error: string };

function parseTokenId(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  return BigInt(value);
}

function readableVerificationError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "증명서 조회에 실패했습니다.";
}

function isCredentialNotFound(error: unknown) {
  const errorName = getContractErrorName(error);

  return (
    errorName === "CredentialNotFound" ||
    (error instanceof Error && error.message.includes("CredentialNotFound"))
  );
}

export function useCredentialVerification(tokenIdParam: string | undefined) {
  const tokenId = useMemo(() => parseTokenId(tokenIdParam), [tokenIdParam]);
  const [state, setState] = useState<VerificationState>({
    status: "idle",
    data: null,
    isValid: null,
    error: null,
  });

  useEffect(() => {
    if (!tokenIdParam) {
      setState({ status: "idle", data: null, isValid: null, error: null });
      return;
    }

    if (tokenId === null) {
      setState({
        status: "error",
        data: null,
        isValid: null,
        error: "증명서 ID는 숫자여야 합니다.",
      });
      return;
    }

    if (!canReadProofolio()) {
      setState({
        status: "error",
        data: null,
        isValid: null,
        error: "읽기 전용 RPC와 컨트랙트 주소를 설정해주세요.",
      });
      return;
    }

    let active = true;

    setState({ status: "loading", data: null, isValid: null, error: null });

    Promise.all([
      readCredentialVerification(tokenId),
      readCredentialValidity(tokenId),
      readCredentialIssuedTransactionHash(tokenId).catch(() => null),
    ])
      .then(([data, isValid, issuedTxHash]) => {
        if (!active) {
          return;
        }

        setState({
          status: "success",
          data: { ...data, issuedTxHash },
          isValid,
          error: null,
        });
      })
      .catch((caughtError) => {
        if (!active) {
          return;
        }

        if (isCredentialNotFound(caughtError)) {
          setState({
            status: "not_found",
            data: null,
            isValid: null,
            error: `해당 ID(#${tokenId.toString()})의 증명서를 찾을 수 없습니다.`,
          });
          return;
        }

        setState({
          status: "error",
          data: null,
          isValid: null,
          error: readableVerificationError(caughtError),
        });
      });

    return () => {
      active = false;
    };
  }, [tokenId, tokenIdParam]);

  return state;
}
