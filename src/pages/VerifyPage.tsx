import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileSearch,
  SearchX,
  Upload,
  XCircle,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button, ButtonLink } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { PageHeader } from "../components/layout/PageHeader";
import { appEnv } from "../config/env";
import { shortenAddress } from "../lib/address";
import { formatUnixTimestamp } from "../lib/date";
import { getEtherscanTokenUrl, getEtherscanTxUrl } from "../lib/etherscan";
import { calculateFileKeccak256 } from "../lib/fileHash";
import { createIssuerProfilePath } from "../lib/links";
import type { CredentialVerificationDetails } from "../lib/proofolio";
import { useCredentialVerification } from "../hooks/useCredentialVerification";

type FileComparisonState =
  | { status: "idle"; fileName: null; uploadedHash: null; error: null }
  | { status: "hashing"; fileName: string; uploadedHash: null; error: null }
  | { status: "matched"; fileName: string; uploadedHash: string; error: null }
  | { status: "mismatched"; fileName: string; uploadedHash: string; error: null }
  | { status: "error"; fileName: string | null; uploadedHash: null; error: string };

const initialFileComparison: FileComparisonState = {
  status: "idle",
  fileName: null,
  uploadedHash: null,
  error: null,
};

function parseTokenId(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  return BigInt(value);
}

function extractTokenQuery(value: string) {
  return value.match(/(\d+)\/?$/)?.[1] ?? value.trim();
}

function hashesEqual(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}

function getStatusView(
  data: CredentialVerificationDetails,
  comparison: FileComparisonState,
) {
  if (data.revoked) {
    return {
      icon: XCircle,
      title: "❌ 취소된 증명서",
      description:
        "발급 기록은 남아 있으나 발급기관이 이 증명서를 취소했습니다.",
      className: "border-warn-600/20 bg-warn-600/5 text-warn-600",
      badgeTone: "warning" as const,
      badgeLabel: "취소됨",
    };
  }

  if (comparison.status === "mismatched") {
    return {
      icon: XCircle,
      title: "❌ 해시 불일치 — 위변조 의심",
      description:
        "제출된 파일이 발급 당시 원본 바이트와 다릅니다. 발급 기록 자체와 파일 무결성은 별도로 판단해야 합니다.",
      className: "border-warn-600/20 bg-warn-600/5 text-warn-600",
      badgeTone: "warning" as const,
      badgeLabel: "해시 불일치",
    };
  }

  if (!data.issuerActive) {
    return {
      icon: AlertTriangle,
      title: "⚠️ 발급기관 비활성",
      description:
        "발급 사실은 온체인에 남아 있지만, 발급기관이 현재 비활성 상태입니다.",
      className: "border-warn-600/20 bg-warn-600/5 text-warn-600",
      badgeTone: "warning" as const,
      badgeLabel: "기관 비활성",
    };
  }

  if (comparison.status === "matched") {
    return {
      icon: CheckCircle2,
      title: "✅ 유효 + 원본 일치",
      description: "온체인 발급 기록과 업로드한 원본 파일 해시가 일치합니다.",
      className: "border-valid-600/20 bg-valid-600/10 text-valid-600",
      badgeTone: "success" as const,
      badgeLabel: "유효",
    };
  }

  return {
    icon: CheckCircle2,
    title: "✅ 유효한 증명서",
    description:
      "등록된 활성 발급기관이 발급했고 취소되지 않았습니다. 원본 파일을 올리면 해시까지 대조합니다.",
    className: "border-valid-600/20 bg-valid-600/10 text-valid-600",
    badgeTone: "success" as const,
    badgeLabel: "유효",
  };
}

export function VerifyPage() {
  const navigate = useNavigate();
  const { tokenId } = useParams();
  const [query, setQuery] = useState("");
  const [fileComparison, setFileComparison] =
    useState<FileComparisonState>(initialFileComparison);
  const hashRequestId = useRef(0);
  const verification = useCredentialVerification(tokenId);
  const parsedTokenId = parseTokenId(tokenId);

  useEffect(() => {
    setFileComparison(initialFileComparison);
    hashRequestId.current += 1;
  }, [tokenId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTokenId = extractTokenQuery(query);

    if (nextTokenId) {
      navigate(`/verify/${nextTokenId}`);
    }
  }

  async function handleFileChange(file: File | null) {
    const requestId = hashRequestId.current + 1;
    hashRequestId.current = requestId;

    if (!file) {
      setFileComparison(initialFileComparison);
      return;
    }

    if (verification.status !== "success") {
      setFileComparison({
        status: "error",
        fileName: file.name,
        uploadedHash: null,
        error: "증명서 조회가 끝난 뒤 파일을 대조할 수 있습니다.",
      });
      return;
    }

    setFileComparison({
      status: "hashing",
      fileName: file.name,
      uploadedHash: null,
      error: null,
    });

    try {
      const uploadedHash = await calculateFileKeccak256(file);

      if (hashRequestId.current !== requestId) {
        return;
      }

      setFileComparison({
        status: hashesEqual(uploadedHash, verification.data.dataHash)
          ? "matched"
          : "mismatched",
        fileName: file.name,
        uploadedHash,
        error: null,
      });
    } catch {
      if (hashRequestId.current === requestId) {
        setFileComparison({
          status: "error",
          fileName: file.name,
          uploadedHash: null,
          error: "파일 해시 계산에 실패했습니다.",
        });
      }
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Verifier"
        title={`증명서 검증${tokenId ? ` #${tokenId}` : ""}`}
        description="지갑 없이 Sepolia 읽기 전용 RPC로 조회합니다."
      />

      {!tokenId ? (
        <LookupForm
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleSubmit}
        />
      ) : null}

      {tokenId ? (
        <VerificationContent
          comparison={fileComparison}
          onFileChange={handleFileChange}
          parsedTokenId={parsedTokenId}
          state={verification}
        />
      ) : null}
    </section>
  );
}

function LookupForm({
  onQueryChange,
  onSubmit,
  query,
}: {
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  query: string;
}) {
  return (
    <Card>
      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="증명서 ID 또는 검증 링크"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="예: 12 또는 /verify/12"
            />
          </div>
          <Button type="submit">
            조회
            <ArrowRight aria-hidden="true" size={17} />
          </Button>
        </div>
      </form>
    </Card>
  );
}

function VerificationContent({
  comparison,
  onFileChange,
  parsedTokenId,
  state,
}: {
  comparison: FileComparisonState;
  onFileChange: (file: File | null) => Promise<void>;
  parsedTokenId: bigint | null;
  state: ReturnType<typeof useCredentialVerification>;
}) {
  if (state.status === "loading") {
    return (
      <Card>
        <div className="h-5 w-1/3 rounded-md bg-paper-100" />
        <div className="mt-4 h-4 w-2/3 rounded-md bg-paper-100" />
        <div className="mt-3 h-4 w-1/2 rounded-md bg-paper-100" />
      </Card>
    );
  }

  if (state.status === "not_found") {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <span className="grid size-12 place-items-center rounded-md bg-paper-100 text-ink-500">
            <SearchX aria-hidden="true" size={24} />
          </span>
          <div>
            <CardTitle>🔍 해당 ID 없음</CardTitle>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              {state.error} ID 또는 검증 링크를 확인해주세요.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <Card className="border-warn-600/20 bg-warn-600/5">
        <CardTitle>조회 실패</CardTitle>
        <p className="mt-2 text-sm text-warn-600">{state.error}</p>
      </Card>
    );
  }

  if (state.status !== "success" || parsedTokenId === null) {
    return null;
  }

  return (
    <div className="space-y-5">
      <StatusBanner comparison={comparison} data={state.data} />
      <CredentialDetails
        data={state.data}
        isValid={state.isValid}
        tokenId={parsedTokenId}
      />
      <FileComparisonCard
        comparison={comparison}
        dataHash={state.data.dataHash}
        onFileChange={onFileChange}
      />
    </div>
  );
}

function StatusBanner({
  comparison,
  data,
}: {
  comparison: FileComparisonState;
  data: CredentialVerificationDetails;
}) {
  const status = getStatusView(data, comparison);
  const Icon = status.icon;

  return (
    <Card className={status.className}>
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-md bg-current/10">
          <Icon aria-hidden="true" size={24} />
        </span>
        <div>
          <CardTitle>{status.title}</CardTitle>
          <p className="mt-2 text-sm leading-6">{status.description}</p>
        </div>
      </div>
    </Card>
  );
}

function CredentialDetails({
  data,
  isValid,
  tokenId,
}: {
  data: CredentialVerificationDetails;
  isValid: boolean;
  tokenId: bigint;
}) {
  const status = getStatusView(data, initialFileComparison);
  const etherscanUrl = data.issuedTxHash
    ? getEtherscanTxUrl(data.issuedTxHash)
    : getEtherscanTokenUrl(appEnv.contractAddress, tokenId);

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-paper-100 text-trust-600">
            <FileSearch aria-hidden="true" size={24} />
          </span>
          <div>
            <CardTitle>온체인 발급 기록</CardTitle>
            <p className="mt-1 text-sm text-ink-500">
              Proofolio 컨트랙트 조회 결과입니다.
            </p>
          </div>
        </div>
        <Badge tone={status.badgeTone}>{isValid ? "유효" : status.badgeLabel}</Badge>
      </div>

      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <InfoItem label="종류" value={data.credType} />
        <InfoItem label="발급일" value={formatUnixTimestamp(data.issuedAt)} />
        <div>
          <dt className="text-ink-500">발급기관</dt>
          <dd className="mt-1 font-medium text-ink-950">
            <span>{data.issuerName || "이름 없음"}</span>
            <Badge className="ml-2" tone={data.issuerActive ? "success" : "neutral"}>
              {data.issuerActive ? "활성" : "비활성"}
            </Badge>
            <Link
              to={createIssuerProfilePath(data.issuer)}
              className="ml-2 inline-flex items-center gap-1 text-trust-600 hover:text-trust-500"
            >
              기관 프로필
              <ExternalLink aria-hidden="true" size={14} />
            </Link>
          </dd>
        </div>
        <InfoItem label="발급기관 주소" value={shortenAddress(data.issuer)} />
        <InfoItem label="보유자" value={shortenAddress(data.holder)} />
        <InfoItem label="취소 여부" value={data.revoked ? "취소됨" : "취소되지 않음"} />
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <ButtonLink
          href={etherscanUrl}
          target="_blank"
          rel="noreferrer"
          variant="secondary"
        >
          <ExternalLink aria-hidden="true" size={16} />
          Etherscan에서 보기
        </ButtonLink>
      </div>
    </Card>
  );
}

function FileComparisonCard({
  comparison,
  dataHash,
  onFileChange,
}: {
  comparison: FileComparisonState;
  dataHash: string;
  onFileChange: (file: File | null) => Promise<void>;
}) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-paper-100 text-trust-600">
          <Upload aria-hidden="true" size={20} />
        </span>
        <div>
          <CardTitle>원본 파일 대조</CardTitle>
          <p className="mt-1 text-sm text-ink-500">
            파일은 업로드하지 않고 브라우저에서 해시만 계산합니다.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <Input
          label="원본 파일"
          type="file"
          onChange={(event) => void onFileChange(event.target.files?.[0] ?? null)}
          helpText="발급 당시 원본과 정확히 같은 바이트여야 해시가 일치합니다."
        />
      </div>

      <ComparisonResult comparison={comparison} dataHash={dataHash} />
    </Card>
  );
}

function ComparisonResult({
  comparison,
  dataHash,
}: {
  comparison: FileComparisonState;
  dataHash: string;
}) {
  if (comparison.status === "idle") {
    return (
      <div className="mt-4 rounded-md border border-ink-100 bg-paper-50 p-3 text-xs text-ink-500">
        <div className="font-semibold text-ink-700">온체인 해시</div>
        <div className="mt-1 break-all font-mono">{dataHash}</div>
      </div>
    );
  }

  if (comparison.status === "hashing") {
    return (
      <div className="mt-4 rounded-md border border-ink-100 bg-paper-50 p-3 text-sm text-ink-500">
        {comparison.fileName} 해시 계산 중
      </div>
    );
  }

  if (comparison.status === "error") {
    return (
      <div className="mt-4 rounded-md border border-warn-600/20 bg-warn-600/5 p-3 text-sm text-warn-600">
        {comparison.error}
      </div>
    );
  }

  const matched = comparison.status === "matched";

  return (
    <div
      className={[
        "mt-4 rounded-md border p-4",
        matched
          ? "border-valid-600/20 bg-valid-600/10"
          : "border-warn-600/20 bg-warn-600/5",
      ].join(" ")}
    >
      <div
        className={[
          "text-sm font-semibold",
          matched ? "text-valid-600" : "text-warn-600",
        ].join(" ")}
      >
        {matched
          ? "✅ 원본 일치"
          : "❌ 해시 불일치 — 위변조 의심"}
      </div>
      <p className="mt-1 text-sm text-ink-500">
        {comparison.fileName}
      </p>
      <div className="mt-3 grid gap-2 text-xs">
        <HashLine label="온체인 해시" value={dataHash} />
        <HashLine label="업로드 해시" value={comparison.uploadedHash} />
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-500">{label}</dt>
      <dd className="mt-1 font-medium text-ink-950">{value}</dd>
    </div>
  );
}

function HashLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-semibold text-ink-700">{label}</div>
      <div className="mt-1 break-all font-mono text-ink-500">{value}</div>
    </div>
  );
}
