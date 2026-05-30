import type { CredentialVerification } from "./proofolio";

export type CredentialStatus = {
  label: string;
  tone: "success" | "warning" | "neutral";
};

export function getCredentialStatus(credential: CredentialVerification): CredentialStatus {
  if (credential.revoked) {
    return { label: "취소", tone: "warning" };
  }

  if (!credential.issuerActive) {
    return { label: "발급기관 비활성", tone: "warning" };
  }

  return { label: "유효", tone: "success" };
}
