import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  FileKey2,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button, ButtonLink } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { QrCodeModal } from "../components/ui/QrCodeModal";
import { Select } from "../components/ui/Select";
import { PageHeader } from "../components/layout/PageHeader";
import {
  TransactionToast,
  type TransactionToastState,
} from "../components/ui/Toast";
import { getEtherscanTxUrl } from "../lib/etherscan";
import { calculateFileKeccak256 } from "../lib/fileHash";
import { isValidAddress, normalizeAddress, shortenAddress } from "../lib/address";
import { toUserFacingError } from "../lib/contractErrors";
import {
  canReadProofolio,
  getIssuedCredentialTokenId,
  issueCredential as issueCredentialTx,
  readIssuer,
  type IssuerRecord,
} from "../lib/proofolio";
import { createVerifyUrl } from "../lib/links";
import { useWallet } from "../wallet/useWallet";

const credentialTypes = ["수료", "경력", "프로젝트", "수상"] as const;

type CredentialType = (typeof credentialTypes)[number];

type IssueFormState = {
  holder: string;
  credType: CredentialType | "";
  metaURI: string;
};

type FormErrors = {
  holder?: string;
  credType?: string;
  file?: string;
};

type IssueResult = {
  tokenId: bigint;
  holder: string;
  dataHash: string;
  credType: CredentialType;
  txHash: string;
  verifyUrl: string;
};

const initialFormState: IssueFormState = {
  holder: "",
  credType: "",
  metaURI: "",
};

function isReceiptSuccessful(status: number | null | undefined) {
  return status === undefined || status === null || status === 1;
}

function validateForm(
  form: IssueFormState,
  file: File | null,
  dataHash: string | null,
  hashing: boolean,
) {
  const errors: FormErrors = {};

  if (!form.holder.trim()) {
    errors.holder = "보유자 주소를 입력해주세요.";
  } else if (!isValidAddress(form.holder.trim())) {
    errors.holder = "유효한 Ethereum 주소를 입력해주세요.";
  }

  if (!form.credType) {
    errors.credType = "증명서 종류를 선택해주세요.";
  }

  if (!file) {
    errors.file = "원본 파일을 선택해주세요.";
  } else if (hashing) {
    errors.file = "파일 해시 계산이 끝난 뒤 발급할 수 있습니다.";
  } else if (!dataHash) {
    errors.file = "파일 해시를 계산하지 못했습니다. 파일을 다시 선택해주세요.";
  }

  return errors;
}

export function IssuePage() {
  const {
    address,
    connectWallet,
    isIssuer,
    isSepolia,
    refreshWalletRoles,
    switchToSepolia,
  } = useWallet();
  const [issuer, setIssuer] = useState<IssuerRecord | null>(null);
  const [issuerAddress, setIssuerAddress] = useState<string | null>(null);
  const [issuerLoading, setIssuerLoading] = useState(false);
  const [issuerError, setIssuerError] = useState<string | null>(null);
  const [form, setForm] = useState<IssueFormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dataHash, setDataHash] = useState<string | null>(null);
  const [hashing, setHashing] = useState(false);
  const [hashError, setHashError] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [transactionToast, setTransactionToast] =
    useState<TransactionToastState | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueResult, setIssueResult] = useState<IssueResult | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const hashRequestId = useRef(0);

  const currentIssuer = issuerAddress === address ? issuer : null;
  const hasIssuerAccess = issuerLoading ? isIssuer : Boolean(currentIssuer?.active);
  const canEditForm = Boolean(hasIssuerAccess && isSepolia && !isIssuing);
  const canSubmit = canEditForm && !hashing;

  const issuerLabel = useMemo(() => {
    if (currentIssuer?.name) {
      return currentIssuer.name;
    }

    return address ? shortenAddress(address) : "";
  }, [address, currentIssuer?.name]);

  useEffect(() => {
    if (!address) {
      setIssuer(null);
      setIssuerAddress(null);
      setIssuerError(null);
      setIssuerLoading(false);
      return;
    }

    if (!canReadProofolio()) {
      setIssuer(null);
      setIssuerAddress(null);
      setIssuerError("읽기 전용 RPC와 컨트랙트 주소를 설정해주세요.");
      setIssuerLoading(false);
      return;
    }

    let active = true;

    setIssuerLoading(true);
    setIssuerError(null);

    readIssuer(address)
      .then((record) => {
        if (!active) {
          return;
        }

        setIssuer(record);
        setIssuerAddress(address);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setIssuer(null);
        setIssuerAddress(null);
        setIssuerError(toUserFacingError(error));
      })
      .finally(() => {
        if (active) {
          setIssuerLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [address]);

  useEffect(() => {
    if (!linkCopied) {
      return;
    }

    const timeoutId = window.setTimeout(() => setLinkCopied(false), 2000);

    return () => window.clearTimeout(timeoutId);
  }, [linkCopied]);

  async function handleFileChange(file: File | null) {
    const requestId = hashRequestId.current + 1;
    hashRequestId.current = requestId;

    setSelectedFile(file);
    setDataHash(null);
    setHashError(null);
    setFormErrors((current) => ({ ...current, file: undefined }));

    if (!file) {
      setHashing(false);
      return;
    }

    try {
      setHashing(true);
      const hash = await calculateFileKeccak256(file);

      if (hashRequestId.current === requestId) {
        setDataHash(hash);
      }
    } catch {
      if (hashRequestId.current === requestId) {
        setHashError("파일 해시 계산에 실패했습니다.");
      }
    } finally {
      if (hashRequestId.current === requestId) {
        setHashing(false);
      }
    }
  }

  async function handleIssueCredential(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(form, selectedFile, dataHash, hashing);
    setFormErrors(nextErrors);

    if (
      Object.keys(nextErrors).length > 0 ||
      !dataHash ||
      !form.credType ||
      !isValidAddress(form.holder.trim())
    ) {
      return;
    }

    const normalizedHolder = normalizeAddress(form.holder.trim());

    try {
      setIsIssuing(true);
      setTransactionToast({
        status: "signing",
        title: "증명서 발급",
        description: "MetaMask에서 서명을 확인해주세요.",
      });

      const tx = await issueCredentialTx(
        normalizedHolder,
        dataHash,
        form.credType,
        form.metaURI.trim(),
      );

      setTransactionToast({
        status: "submitted",
        title: "증명서 발급",
        description: "트랜잭션이 전송되었습니다. 확정을 기다리는 중입니다.",
        hash: tx.hash,
      });

      const receipt = await tx.wait();

      if (!isReceiptSuccessful(receipt?.status)) {
        throw new Error("트랜잭션 처리에 실패했습니다.");
      }

      const tokenId = getIssuedCredentialTokenId(receipt);

      if (tokenId === null) {
        throw new Error("발급 완료 이벤트에서 증명서 ID를 확인하지 못했습니다.");
      }

      const result: IssueResult = {
        tokenId,
        holder: normalizedHolder,
        dataHash,
        credType: form.credType,
        txHash: tx.hash,
        verifyUrl: createVerifyUrl(tokenId),
      };

      setIssueResult(result);
      setTransactionToast({
        status: "confirmed",
        title: "증명서 발급",
        description: `증명서 #${tokenId.toString()} 발급이 확정되었습니다.`,
        hash: tx.hash,
      });
      await refreshWalletRoles();
    } catch (error) {
      setTransactionToast({
        status: "failed",
        title: "증명서 발급",
        description: toUserFacingError(error),
      });
    } finally {
      setIsIssuing(false);
    }
  }

  async function handleCopyVerifyLink() {
    if (!issueResult) {
      return;
    }

    try {
      await navigator.clipboard.writeText(issueResult.verifyUrl);
      setLinkCopied(true);
    } catch {
      setTransactionToast({
        status: "failed",
        title: "검증 링크 복사",
        description: "브라우저가 클립보드 복사를 허용하지 않았습니다.",
      });
    }
  }

  function handleNewCredential() {
    setForm(initialFormState);
    setFormErrors({});
    setSelectedFile(null);
    setDataHash(null);
    setHashError(null);
    setHashing(false);
    setIssueResult(null);
    setQrOpen(false);
    setLinkCopied(false);
    setFileInputKey((current) => current + 1);
  }

  if (!address || (!hasIssuerAccess && !issuerLoading)) {
    return (
      <section className="space-y-6">
        <PageHeader eyebrow="Issuer" title="증명서 발급" />
        <Card>
          <CardTitle>발급 권한 없음</CardTitle>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            증명서 발급은 등록된 활성 발급기관 지갑에서만 사용할 수 있습니다.
            관리자에게 발급기관 등록 또는 활성화를 요청해주세요.
          </p>
          {issuerError ? (
            <p className="mt-3 text-sm text-warn-600">{issuerError}</p>
          ) : null}
          {!address ? (
            <Button className="mt-5" onClick={() => void connectWallet()}>
              지갑 연결
            </Button>
          ) : null}
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Issuer" title="증명서 발급">
        {issuerLabel || issuerLoading ? (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-ink-500">
            <span>발급기관</span>
            <Badge tone={issuerLoading ? "neutral" : "success"}>
              {issuerLoading ? "확인 중" : issuerLabel}
            </Badge>
          </div>
        ) : null}
      </PageHeader>

      {!isSepolia ? (
        <Card className="border-warn-600/20 bg-warn-600/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Sepolia 네트워크가 필요합니다</CardTitle>
              <p className="mt-1 text-sm text-ink-500">
                증명서 발급 트랜잭션은 Sepolia에서만 실행할 수 있습니다.
              </p>
            </div>
            <Button onClick={() => void switchToSepolia()} variant="warning">
              Sepolia 전환
            </Button>
          </div>
        </Card>
      ) : null}

      {issueResult ? (
        <IssueCompleteCard
          copied={linkCopied}
          result={issueResult}
          onCopy={() => void handleCopyVerifyLink()}
          onNewCredential={handleNewCredential}
          onOpenQr={() => setQrOpen(true)}
        />
      ) : (
        <Card className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-paper-100 text-trust-600">
              <FileKey2 aria-hidden="true" size={20} />
            </span>
            <div>
              <CardTitle>발급 정보</CardTitle>
              <p className="mt-1 text-sm text-ink-500">
                원본 파일은 업로드하지 않고 브라우저에서 해시만 계산합니다.
              </p>
            </div>
          </div>

          <form onSubmit={(event) => void handleIssueCredential(event)} className="mt-5">
            <fieldset disabled={!canEditForm} className="grid gap-4">
              <Input
                label="보유자 지갑 주소"
                value={form.holder}
                onChange={(event) => {
                  setForm((current) => ({ ...current, holder: event.target.value }));
                  setFormErrors((current) => ({ ...current, holder: undefined }));
                }}
                placeholder="0xHODL...beef"
                error={formErrors.holder}
              />

              <Select
                label="증명서 종류"
                value={form.credType}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    credType: event.target.value as IssueFormState["credType"],
                  }));
                  setFormErrors((current) => ({ ...current, credType: undefined }));
                }}
                error={formErrors.credType}
              >
                <option value="">종류 선택</option>
                {credentialTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>

              <div className="grid gap-1.5">
                <Input
                  key={fileInputKey}
                  label="원본 파일"
                  type="file"
                  onChange={(event) =>
                    void handleFileChange(event.target.files?.[0] ?? null)
                  }
                  error={formErrors.file ?? hashError ?? undefined}
                  helpText="파일은 저장하지 않고 해시 계산에만 사용합니다."
                />
                <FileHashPreview
                  dataHash={dataHash}
                  file={selectedFile}
                  hashing={hashing}
                />
              </div>

              <Input
                label="메타 URI"
                value={form.metaURI}
                onChange={(event) =>
                  setForm((current) => ({ ...current, metaURI: event.target.value }))
                }
                placeholder="ipfs://... 또는 https://..."
                helpText="선택 입력입니다. 개인정보가 들어간 URI는 사용하지 마세요."
              />

              <Button disabled={!canSubmit} type="submit">
                {isIssuing ? "발급 중" : "증명서 발급"}
              </Button>
            </fieldset>
          </form>
        </Card>
      )}

      <QrCodeModal
        fileName={
          issueResult
            ? `proofolio-credential-${issueResult.tokenId.toString()}-qr.png`
            : undefined
        }
        open={qrOpen}
        title={
          issueResult
            ? `증명서 #${issueResult.tokenId.toString()} 검증 QR`
            : "검증 QR"
        }
        url={issueResult?.verifyUrl ?? ""}
        onClose={() => setQrOpen(false)}
      />
      <TransactionToast
        toast={transactionToast}
        onDismiss={() => setTransactionToast(null)}
      />
    </section>
  );
}

function FileHashPreview({
  dataHash,
  file,
  hashing,
}: {
  dataHash: string | null;
  file: File | null;
  hashing: boolean;
}) {
  if (!file) {
    return null;
  }

  return (
    <div className="rounded-md border border-ink-100 bg-paper-50 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-ink-900">{file.name}</span>
        <span className="text-ink-500">{Math.max(1, Math.ceil(file.size / 1024))} KB</span>
        <Badge tone={hashing ? "neutral" : dataHash ? "success" : "warning"}>
          {hashing ? "계산 중" : dataHash ? "계산됨" : "대기"}
        </Badge>
      </div>
      {dataHash ? (
        <p className="mt-2 break-all font-mono text-xs text-ink-700">
          파일 지문: {dataHash}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-ink-500">
        이 해시가 온체인 검증 기준으로 저장됩니다.
      </p>
    </div>
  );
}

function IssueCompleteCard({
  copied,
  onCopy,
  onNewCredential,
  onOpenQr,
  result,
}: {
  copied: boolean;
  onCopy: () => void;
  onNewCredential: () => void;
  onOpenQr: () => void;
  result: IssueResult;
}) {
  return (
    <Card className="max-w-3xl">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-valid-600/10 text-valid-600">
          <CheckCircle2 aria-hidden="true" size={20} />
        </span>
        <div className="min-w-0">
          <CardTitle>증명서가 발급되었습니다</CardTitle>
          <p className="mt-1 text-sm text-ink-500">
            받는 사람 지갑에 소울바운드 증명서가 민팅되었습니다.
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 rounded-md border border-ink-100 bg-paper-50 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ink-500">증명서 ID</dt>
          <dd className="mt-1 font-semibold text-ink-950">#{result.tokenId.toString()}</dd>
        </div>
        <div>
          <dt className="text-ink-500">종류</dt>
          <dd className="mt-1 font-semibold text-ink-950">{result.credType}</dd>
        </div>
        <div>
          <dt className="text-ink-500">받는 사람</dt>
          <dd className="mt-1 font-semibold text-ink-950">
            {shortenAddress(result.holder)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-500">파일 지문</dt>
          <dd className="mt-1 break-all font-mono text-xs text-ink-700">
            {result.dataHash}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={onCopy} variant="secondary">
          <Copy aria-hidden="true" size={16} />
          {copied ? "복사됨" : "검증 링크 복사"}
        </Button>
        <Button onClick={onOpenQr} variant="secondary">
          <QrCode aria-hidden="true" size={16} />
          QR 보기
        </Button>
        <ButtonLink
          href={getEtherscanTxUrl(result.txHash)}
          target="_blank"
          rel="noreferrer"
          variant="secondary"
        >
          <ExternalLink aria-hidden="true" size={16} />
          Etherscan
        </ButtonLink>
        <Button className="sm:ml-auto" onClick={onNewCredential}>
          <RefreshCw aria-hidden="true" size={16} />
          새 증명서 발급
        </Button>
      </div>
    </Card>
  );
}
