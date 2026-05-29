export function getContractErrorName(error: unknown) {
  const candidate = error as {
    errorName?: string;
    info?: { errorName?: string };
    revert?: { name?: string };
  };

  return candidate.errorName ?? candidate.info?.errorName ?? candidate.revert?.name;
}

export function toUserFacingError(error: unknown) {
  const maybeError = error as {
    code?: number;
    info?: { error?: { code?: number }; errorName?: string };
  };

  if (maybeError.code === 4001 || maybeError.info?.error?.code === 4001) {
    return "MetaMask 서명이 거절되었습니다.";
  }

  const errorName = getContractErrorName(error);

  if (errorName === "IssuerAlreadyRegistered") {
    return "이미 등록된 발급기관 주소입니다.";
  }
  if (errorName === "OwnableUnauthorizedAccount") {
    return "관리자만 실행할 수 있는 기능입니다.";
  }
  if (errorName === "InvalidIssuerAddress") {
    return "발급기관 주소를 확인해주세요.";
  }
  if (errorName === "IssuerNameRequired") {
    return "기관 이름을 입력해주세요.";
  }
  if (errorName === "IssuerNotRegistered" || errorName === "IssuerNotActive") {
    return "등록된 활성 발급기관만 실행할 수 있습니다.";
  }
  if (errorName === "HolderRequired") {
    return "보유자 주소를 확인해주세요.";
  }
  if (errorName === "DataHashRequired") {
    return "원본 파일 해시를 확인해주세요.";
  }
  if (errorName === "CredentialTypeRequired") {
    return "증명서 종류를 선택해주세요.";
  }
  if (error instanceof Error) {
    return error.message;
  }

  return "요청 처리에 실패했습니다.";
}
