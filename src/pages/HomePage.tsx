import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { hasContractConfig, hasReadProviderConfig } from "../config/env";
import { useWallet } from "../wallet/useWallet";

const roleLinks = [
  {
    to: "/issue",
    label: "증명서 발급",
    hint: "발급기관 — 보유자에게 발급",
  },
  {
    to: "/credentials",
    label: "내 증명서",
    hint: "보유자 — 받은 증명서 목록",
  },
  {
    to: "/admin",
    label: "기관 관리",
    hint: "관리자 — 발급기관 레지스트리",
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
    <div className="space-y-20">
      <Hero
        query={query}
        onQueryChange={setQuery}
        onVerify={handleVerify}
      />

      <QuickLinks />

      <ConnectionStrip
        hasReadRPC={hasReadProviderConfig}
        hasContract={hasContractConfig}
        shortAddress={shortAddress}
        role={isAdmin ? "Admin" : isIssuer ? "Issuer" : null}
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
    <section>
      <Eyebrow>Verifiable Credentials · Ethereum Sepolia</Eyebrow>

      <h1 className="mt-5 max-w-3xl text-[40px] font-semibold leading-[1.08] tracking-[-0.02em] text-ink-950 sm:text-[56px]">
        검증 가능한 디지털 증명서.
      </h1>

      <p className="mt-5 max-w-xl text-[15px] leading-7 text-ink-700">
        발급기관의 온체인 기록으로 증명서 발급 사실과 파일 무결성을 확인합니다.
        PDF가 아니라 발급자의 서명을 믿습니다.
      </p>

      <form onSubmit={onVerify} className="mt-10 max-w-xl">
        <label
          htmlFor="credential-query"
          className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-500"
        >
          증명서 검증
        </label>
        <div className="mt-2 flex items-center gap-3 border-b border-ink-100 pb-2 focus-within:border-ink-950">
          <input
            id="credential-query"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="증명서 ID 또는 검증 링크"
            className="flex-1 bg-transparent py-1 text-[15px] text-ink-950 placeholder:text-ink-500 outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 text-sm font-medium text-ink-950 transition hover:opacity-70"
          >
            검증
            <ArrowRight aria-hidden="true" size={14} strokeWidth={2} />
          </button>
        </div>
      </form>
    </section>
  );
}

function QuickLinks() {
  return (
    <section>
      <Eyebrow>시작하기</Eyebrow>
      <ul className="mt-4 divide-y divide-ink-100 border-y border-ink-100">
        {roleLinks.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="group flex items-center justify-between py-5 transition"
            >
              <div>
                <div className="text-[15px] font-medium text-ink-950 transition group-hover:translate-x-0.5">
                  {item.label}
                </div>
                <div className="mt-0.5 text-sm text-ink-500">{item.hint}</div>
              </div>
              <ArrowUpRight
                aria-hidden="true"
                size={16}
                strokeWidth={1.75}
                className="text-ink-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink-950"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ConnectionStrip({
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
    <section className="border-t border-ink-100 pt-6">
      <Eyebrow>연동 상태</Eyebrow>
      <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4 text-sm sm:grid-cols-4">
        <Field label="RPC" value={hasReadRPC ? "설정됨" : "미설정"} />
        <Field label="컨트랙트" value={hasContract ? "설정됨" : "미설정"} />
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-500">
      {children}
    </p>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-ink-500">{label}</dt>
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
