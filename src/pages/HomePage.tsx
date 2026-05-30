import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, Building2, FileKey2 } from "lucide-react";
import { hasContractConfig, hasReadProviderConfig } from "../config/env";
import { useWallet } from "../wallet/useWallet";

const roleLinks = [
  {
    to: "/issue",
    title: "증명서 발급",
    body: "등록된 발급기관용 화면",
    icon: FileKey2,
  },
  {
    to: "/credentials",
    title: "내 증명서",
    body: "보유자가 받은 증명서 목록",
    icon: BadgeCheck,
  },
  {
    to: "/admin",
    title: "기관 관리",
    body: "관리자용 발급기관 레지스트리",
    icon: Building2,
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { isAdmin, isIssuer, shortAddress } = useWallet();
  const [query, setQuery] = useState("");

  function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const tokenId = query.match(/\d+$/)?.[0] ?? query.trim();

    if (tokenId) {
      navigate(`/verify/${tokenId}`);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
      <section className="space-y-6">
        <div className="space-y-4">
          <span className="inline-flex rounded-md border border-trust-600/20 bg-trust-600/10 px-3 py-1 text-sm font-semibold text-trust-600">
            Ethereum Sepolia
          </span>
          <div className="space-y-3">
            <h1 className="max-w-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-trust-500 bg-clip-text text-4xl font-semibold leading-tight tracking-normal text-transparent sm:text-5xl">
              검증 가능한 디지털 증명서
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-ink-700">
              발급기관의 온체인 기록으로 증명서 발급 사실과 파일 무결성을 확인합니다.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleVerify}
          className="rounded-lg border border-ink-100 bg-paper-100 p-4 shadow-sm"
        >
          <label
            htmlFor="credential-query"
            className="text-sm font-semibold text-ink-900"
          >
            증명서 ID 또는 검증 링크
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="credential-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 12 또는 /verify/12"
              className="min-h-11 flex-1 rounded-md border border-ink-100 bg-paper-50 px-3 text-ink-950 placeholder:text-ink-500"
            />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-trust-600 px-4 font-semibold text-white shadow-sm transition hover:bg-trust-500"
            >
              검증
              <ArrowRight aria-hidden="true" size={17} />
            </button>
          </div>
        </form>
      </section>

      <aside className="grid gap-4">
        <div className="rounded-lg border border-ink-100 bg-paper-100 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-ink-900">연동 상태</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-500">RPC</dt>
              <dd className="font-medium text-ink-900">
                {hasReadProviderConfig ? "설정됨" : "미설정"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-500">컨트랙트 주소</dt>
              <dd className="font-medium text-ink-900">
                {hasContractConfig ? "설정됨" : "미설정"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-500">지갑</dt>
              <dd className="font-medium text-ink-900">
                {shortAddress ?? "미연결"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-500">역할</dt>
              <dd className="font-medium text-ink-900">
                {isAdmin ? "Admin" : isIssuer ? "Issuer" : "일반/미확인"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="grid gap-3">
          {roleLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className="group rounded-lg border border-ink-100 bg-paper-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-trust-600/30 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 place-items-center rounded-md bg-paper-100 text-trust-600">
                    <Icon aria-hidden="true" size={20} />
                  </span>
                  <div>
                    <h2 className="font-semibold text-ink-950">{item.title}</h2>
                    <p className="mt-1 text-sm text-ink-500">{item.body}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
