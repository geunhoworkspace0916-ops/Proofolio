import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Copy, ExternalLink, QrCode } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { QrCodeModal } from "../components/ui/QrCodeModal";
import { getCredentialStatus } from "../lib/credentialStatus";
import { formatUnixTimestamp } from "../lib/date";
import {
  createIssuerProfilePath,
  createVerifyPath,
  createVerifyUrl,
} from "../lib/links";
import { shortenAddress } from "../lib/address";
import type { HolderCredential } from "../lib/proofolio";
import { useHolderCredentials } from "../hooks/useHolderCredentials";
import { useWallet } from "../wallet/useWallet";

function statusLabel(credential: HolderCredential) {
  const status = getCredentialStatus(credential);

  if (credential.revoked) {
    return `❌ ${status.label}`;
  }
  if (!credential.issuerActive) {
    return `⚠️ ${status.label}`;
  }

  return `✅ ${status.label}`;
}

export function MyCredentialsPage() {
  const { address, connectWallet } = useWallet();
  const credentialsState = useHolderCredentials(address);
  const [qrCredential, setQrCredential] = useState<HolderCredential | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<bigint | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    if (copiedTokenId === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopiedTokenId(null), 2000);

    return () => window.clearTimeout(timeoutId);
  }, [copiedTokenId]);

  async function handleCopyVerifyLink(credential: HolderCredential) {
    try {
      await navigator.clipboard.writeText(createVerifyUrl(credential.tokenId));
      setCopiedTokenId(credential.tokenId);
      setCopyError(null);
    } catch {
      setCopyError("브라우저가 클립보드 복사를 허용하지 않았습니다.");
    }
  }

  if (!address) {
    return (
      <section className="space-y-6">
        <PageHeader count={0} />
        <Card>
          <CardTitle>지갑 연결 필요</CardTitle>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            연결된 지갑이 보유한 증명서를 조회합니다.
          </p>
          <Button className="mt-5" onClick={() => void connectWallet()}>
            지갑 연결
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader count={credentialsState.credentials.length} />

      {credentialsState.status === "loading" ? <CredentialSkeletons /> : null}

      {credentialsState.status === "error" ? (
        <Card className="border-warn-600/20 bg-warn-600/5">
          <CardTitle>조회 실패</CardTitle>
          <p className="mt-2 text-sm text-warn-600">{credentialsState.error}</p>
        </Card>
      ) : null}

      {copyError ? (
        <Card className="border-warn-600/20 bg-warn-600/5">
          <p className="text-sm text-warn-600">{copyError}</p>
        </Card>
      ) : null}

      {credentialsState.status === "success" &&
      credentialsState.credentials.length === 0 ? (
        <Card>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-paper-100 text-valid-600">
              <BadgeCheck aria-hidden="true" size={20} />
            </span>
            <div>
              <CardTitle>아직 받은 증명서가 없습니다</CardTitle>
              <p className="mt-1 text-sm text-ink-500">
                발급기관이 이 지갑 주소로 증명서를 발급하면 여기에 표시됩니다.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {credentialsState.credentials.length > 0 ? (
        <div className="grid gap-4">
          {credentialsState.credentials.map((credential) => (
            <CredentialCard
              copied={copiedTokenId === credential.tokenId}
              credential={credential}
              key={credential.tokenId.toString()}
              onCopy={() => void handleCopyVerifyLink(credential)}
              onOpenQr={() => setQrCredential(credential)}
            />
          ))}
        </div>
      ) : null}

      <QrCodeModal
        fileName={
          qrCredential
            ? `proofolio-credential-${qrCredential.tokenId.toString()}-qr.png`
            : undefined
        }
        open={Boolean(qrCredential)}
        title={
          qrCredential
            ? `증명서 #${qrCredential.tokenId.toString()} 검증 QR`
            : "검증 QR"
        }
        url={qrCredential ? createVerifyUrl(qrCredential.tokenId) : ""}
        onClose={() => setQrCredential(null)}
      />
    </section>
  );
}

function PageHeader({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-trust-600">Holder</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink-950">
          내 증명서
        </h1>
      </div>
      <p className="text-sm font-semibold text-ink-500">보유 {count}건</p>
    </div>
  );
}

function CredentialSkeletons() {
  return (
    <div className="grid gap-4">
      {[0, 1].map((item) => (
        <Card key={item}>
          <div className="h-5 w-1/3 rounded-md bg-paper-100" />
          <div className="mt-4 h-4 w-2/3 rounded-md bg-paper-100" />
          <div className="mt-3 h-4 w-1/2 rounded-md bg-paper-100" />
        </Card>
      ))}
    </div>
  );
}

function CredentialCard({
  copied,
  credential,
  onCopy,
  onOpenQr,
}: {
  copied: boolean;
  credential: HolderCredential;
  onCopy: () => void;
  onOpenQr: () => void;
}) {
  const status = getCredentialStatus(credential);
  const verifyPath = createVerifyPath(credential.tokenId);
  const verifyUrl = createVerifyUrl(credential.tokenId);

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>증명서 #{credential.tokenId.toString()}</CardTitle>
            <Badge tone="info">{credential.credType}</Badge>
          </div>
          <p className="mt-2 text-sm text-ink-500">
            발급일 {formatUnixTimestamp(credential.issuedAt)}
          </p>
        </div>
        <Badge tone={status.tone}>{statusLabel(credential)}</Badge>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ink-500">발급기관</dt>
          <dd className="mt-1 font-medium text-ink-950">
            {credential.issuerName || "이름 없음"}
          </dd>
        </div>
        <div>
          <dt className="text-ink-500">발급기관 주소</dt>
          <dd className="mt-1 font-medium text-ink-950">
            {shortenAddress(credential.issuer)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 rounded-md border border-ink-100 bg-paper-50 p-3 text-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to={verifyPath}
            className="break-all font-medium text-trust-600 hover:text-trust-500"
          >
            {verifyUrl}
          </Link>
          <Link
            to={createIssuerProfilePath(credential.issuer)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-ink-700 hover:text-ink-950"
          >
            기관 프로필
            <ExternalLink aria-hidden="true" size={15} />
          </Link>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={onCopy} variant="secondary">
          <Copy aria-hidden="true" size={16} />
          {copied ? "복사됨" : "검증 링크 복사"}
        </Button>
        <Button onClick={onOpenQr} variant="secondary">
          <QrCode aria-hidden="true" size={16} />
          QR 보기
        </Button>
      </div>
    </Card>
  );
}
