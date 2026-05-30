import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, Building2, FileKey2 } from "lucide-react";
import { hasContractConfig, hasReadProviderConfig } from "../config/env";
import { useWallet } from "../wallet/useWallet";

const roleLinks = [
  {
    to: "/issue",
    label: "증명서 발급",
    hint: "발급기관 — 보유자에게 발급",
    icon: FileKey2,
  },
  {
    to: "/credentials",
    label: "내 증명서",
    hint: "보유자 — 받은 증명서 보기",
    icon: BadgeCheck,
  },
  {
    to: "/admin",
    label: "기관 관리",
    hint: "관리자 — 발급기관 등록",
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

  const role = isAdmin ? "Admin" : isIssuer ? "Issuer" : null;

  return (
    <div className="space-y-14">
      <Hero
        query={query}
        onQueryChange={setQuery}
        onVerify={handleVerify}
      />

      <RoleGrid />

      <ConnectionCard
        hasReadRPC={hasReadProviderConfig}
        hasContract={hasContractConfig}
        shortAddress={shortAddress}
        role={role}
      />
    </div>
  );
}

function Hero({
  query,
  onQueryChange,
  onVerify,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onVerify: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="space-y-6">
      <h1 className="max-w-3xl text-[36px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink-950 sm:text-[44px]">
        검증 가능한 디지털 증명서.
      </h1>

      <p className="max-w-xl text-[15px] leading-7 text-ink-700">
        발급기관의 온체인 기록으로 증명서 발급 사실과 파일 무결성을 확인합니다.
        PDF가 아니라 발급자의 서명을 믿습니다.
      </p>

      <form onSubmit={onVerify} className="max-w-xl">
        <div className="flex items-center gap-2 rounded-2xl border border-ink-100 bg-paper-100 p-2 pl-4 shadow-[0_1px_2px_rgba(28,22,18,0.04)] focus-within:border-trust-600/40 focus-within:shadow-[0_4px_18px_-8px_rgba(180,83,9,0.25)]">
          <input
            id="credential-query"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="증명서 ID 또는 검증 링크"
            className="flex-1 bg-transparent py-2 text-[15px] text-ink-950 placeholder:text-ink-500 outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-trust-600 px-4 py-2 text-sm font-medium text-white shadow-[0_1px_2px_rgba(28,22,18,0.08)] transition hover:bg-trust-500"
          >
            검증
            <ArrowRight aria-hidden="true" size={15} strokeWidth={2} />
          </button>
        </div>
        <p className="mt-2 pl-1 text-xs text-ink-500">
          예: <span className="font-mono">12</span> 또는{" "}
          <span className="font-mono">/verify/12</span>
        </p>
      </form>
    </section>
  );
}

function RoleGrid() {
  return (
    <section>
      <h2 className="text-sm font-medium text-ink-700">시작하기</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {roleLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="group rounded-2xl border border-ink-100 bg-paper-100 p-5 shadow-[0_1px_2px_rgba(28,22,18,0.04)] transition hover:-translate-y-0.5 hover:border-trust-600/30 hover:shadow-[0_8px_24px_-12px_rgba(180,83,9,0.18)]"
            >
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-trust-600/10 text-trust-600">
                <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-ink-950">
                {item.label}
              </h3>
              <p className="mt-1 text-sm text-ink-700">{item.hint}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-trust-600 group-hover:text-trust-500">
                바로가기
                <ArrowRight aria-hidden="true" size={14} strokeWidth={2} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ConnectionCard({
  hasReadRPC,
  hasContract,
  shortAddress,
  role,
}: {
  hasReadRPC: boolean;
  hasContract: boolean;
  shortAddress: string | null;
  role: "Admin" | "Issuer" | null;
}) {
  return (
    <section>
      <h2 className="text-sm font-medium text-ink-700">연동 상태</h2>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="RPC" value={hasReadRPC ? "설정됨" : "미설정"} ok={hasReadRPC} />
        <Field label="컨트랙트" value={hasContract ? "설정됨" : "미설정"} ok={hasContract} />
        <Field
          label="지갑"
          value={shortAddress ?? "미연결"}
          mono={Boolean(shortAddress)}
        />
        <Field label="역할" value={role ?? "—"} />
      </dl>
    </section>
  );
}

function Field({
  label,
  value,
  ok,
  mono,
}: {
  label: string;
  value: string;
  ok?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-paper-100 px-4 py-3 shadow-[0_1px_2px_rgba(28,22,18,0.04)]">
      <dt className="flex items-center gap-1.5 text-xs text-ink-500">
        {ok !== undefined ? (
          <span
            className={`size-1.5 rounded-full ${ok ? "bg-valid-600" : "bg-warn-600"}`}
            aria-hidden
          />
        ) : null}
        {label}
      </dt>
      <dd
        className={[
          "mt-1 text-ink-950",
          mono ? "font-mono text-[13px]" : "text-sm font-medium",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
