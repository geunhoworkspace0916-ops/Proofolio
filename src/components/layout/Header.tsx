import { NavLink } from "react-router-dom";
import { ShieldCheck, Wallet } from "lucide-react";
import { SEPOLIA_CHAIN_ID } from "../../config/networks";
import { useWallet } from "../../wallet/useWallet";

const navItems = [
  { to: "/", label: "홈" },
  { to: "/verify", label: "검증" },
  { to: "/issue", label: "발급" },
  { to: "/credentials", label: "내 증명서" },
  { to: "/admin", label: "기관 관리" },
];

export function Header() {
  const {
    address,
    connectWallet,
    error,
    hasMetaMask,
    isAdmin,
    isIssuer,
    isSepolia,
    shortAddress,
    status,
    switchToSepolia,
  } = useWallet();

  const networkLabel = !address
    ? "지갑 미연결"
    : isSepolia
      ? "Sepolia"
      : "다른 네트워크";
  const dotClass = !address
    ? "bg-ink-500"
    : isSepolia
      ? "bg-valid-600"
      : "bg-warn-600";

  return (
    <header className="border-b border-ink-100 bg-paper-50/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <NavLink
          to="/"
          className="flex items-center gap-2 text-base font-semibold tracking-tight text-ink-950"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-trust-600 text-white">
            <ShieldCheck aria-hidden="true" size={16} strokeWidth={2} />
          </span>
          Proofolio
        </NavLink>

        <nav className="-mx-2 flex flex-wrap items-center gap-0.5 text-sm text-ink-700">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "rounded-lg px-3 py-1.5 transition hover:bg-paper-100 hover:text-ink-950",
                  isActive ? "bg-paper-100 text-ink-950 shadow-[0_1px_2px_rgba(11,18,32,0.04)]" : "",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-paper-100 px-2.5 py-1 text-xs text-ink-700">
            <span className={`size-1.5 rounded-full ${dotClass}`} aria-hidden />
            {networkLabel}
          </span>

          {address && !isSepolia ? (
            <button
              type="button"
              onClick={() => void switchToSepolia()}
              className="rounded-full border border-warn-600/40 bg-paper-100 px-3 py-1 text-xs font-medium text-warn-600 transition hover:bg-warn-600/10"
            >
              Sepolia 전환
            </button>
          ) : null}

          {isAdmin ? <RoleTag label="Admin" /> : null}
          {isIssuer ? <RoleTag label="Issuer" /> : null}

          {address ? (
            <span className="rounded-full border border-ink-100 bg-paper-100 px-2.5 py-1 font-mono text-xs text-ink-700">
              {shortAddress}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void connectWallet()}
              className="inline-flex items-center gap-1.5 rounded-full bg-trust-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-[0_1px_2px_rgba(11,18,32,0.08)] transition hover:bg-trust-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={status === "connecting"}
              title={
                hasMetaMask
                  ? `Sepolia Chain ID: ${SEPOLIA_CHAIN_ID}`
                  : "MetaMask 지갑을 찾을 수 없습니다."
              }
            >
              <Wallet aria-hidden="true" size={14} strokeWidth={2} />
              {status === "connecting" ? "연결 중" : "지갑 연결"}
            </button>
          )}
        </div>

        {error ? (
          <p className="basis-full text-xs text-warn-600">{error}</p>
        ) : null}
      </div>
    </header>
  );
}

function RoleTag({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-trust-600/30 bg-trust-600/8 px-2.5 py-1 text-xs font-medium text-trust-600">
      {label}
    </span>
  );
}
