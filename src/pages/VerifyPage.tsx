import { FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import { shortenAddress } from "../lib/address";
import { useCredentialVerification } from "../hooks/useCredentialVerification";
import { formatUnixTimestamp } from "../lib/date";
import { createIssuerProfilePath } from "../lib/links";

export function VerifyPage() {
  const navigate = useNavigate();
  const { tokenId } = useParams();
  const [query, setQuery] = useState("");
  const verification = useCredentialVerification(tokenId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTokenId = query.match(/\d+$/)?.[0] ?? query.trim();

    if (nextTokenId) {
      navigate(`/verify/${nextTokenId}`);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-trust-600">Verifier</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink-950">
          증명서 검증{tokenId ? ` #${tokenId}` : ""}
        </h1>
      </div>

      {!tokenId ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-ink-100 bg-white p-5 shadow-sm"
        >
          <label
            htmlFor="verify-query"
            className="text-sm font-semibold text-ink-900"
          >
            증명서 ID 또는 검증 링크
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="verify-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 12 또는 /verify/12"
              className="min-h-11 flex-1 rounded-md border border-ink-100 bg-paper-50 px-3"
            />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-trust-600 px-4 font-semibold text-white"
            >
              조회
              <ArrowRight aria-hidden="true" size={17} />
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg border border-ink-100 bg-white p-6 shadow-sm">
          {verification.status === "loading" ? (
            <div className="text-sm font-medium text-ink-500">
              읽기 전용 RPC로 조회 중
            </div>
          ) : null}

          {verification.status === "error" ? (
            <div className="text-sm font-medium text-warn-600">
              {verification.error}
            </div>
          ) : null}

          {verification.status === "success" ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-md bg-paper-100 text-trust-600">
                  <ShieldCheck aria-hidden="true" size={24} />
                </span>
                <div>
                  <h2 className="font-semibold text-ink-950">
                    {verification.isValid ? "유효한 증명서" : "주의가 필요한 증명서"}
                  </h2>
                  <p className="mt-1 text-sm text-ink-500">
                    지갑 없이 Sepolia 읽기 전용 RPC로 조회됨
                  </p>
                </div>
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-ink-500">종류</dt>
                  <dd className="mt-1 font-medium text-ink-950">
                    {verification.data.credType}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-500">발급일</dt>
                  <dd className="mt-1 font-medium text-ink-950">
                    {formatUnixTimestamp(verification.data.issuedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-500">발급기관</dt>
                  <dd className="mt-1 font-medium text-ink-950">
                    {verification.data.issuerName || "이름 없음"}
                    {verification.data.issuerActive ? " · Active" : " · Inactive"}
                    <Link
                      to={createIssuerProfilePath(verification.data.issuer)}
                      className="ml-2 inline-flex items-center gap-1 text-trust-600 hover:text-trust-500"
                    >
                      기관 프로필
                      <ExternalLink aria-hidden="true" size={14} />
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-500">발급기관 주소</dt>
                  <dd className="mt-1 font-medium text-ink-950">
                    {shortenAddress(verification.data.issuer)}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-500">보유자</dt>
                  <dd className="mt-1 font-medium text-ink-950">
                    {shortenAddress(verification.data.holder)}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-500">상태</dt>
                  <dd className="mt-1 font-medium text-ink-950">
                    {verification.data.revoked ? "취소됨" : "취소되지 않음"}
                  </dd>
                </div>
              </dl>

              <div className="rounded-md bg-paper-50 p-3 text-xs text-ink-500">
                <div className="font-semibold text-ink-700">dataHash</div>
                <div className="mt-1 break-all">{verification.data.dataHash}</div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
