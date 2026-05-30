import { NavLink } from "react-router-dom";
import { AlertTriangle, ShieldCheck, Wallet } from "lucide-react";
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
    ? "Wallet Not Connected"
    : isSepolia
      ? "Sepolia Connected"
      : "Wrong Network";
  const networkClassName = isSepolia
    ? "border-valid-600/20 bg-valid-600/10 text-valid-600"
    : "border-warn-600/20 bg-warn-600/10 text-warn-600";

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100/70 bg-paper-100/75 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="grid size-9 place-items-center rounded-lg bg-trust-600 text-white shadow-[0_0_24px_-6px_rgba(124,92,255,0.6)]">
            <ShieldCheck aria-hidden="true" size={20} />
          </span>
          Proofolio
        </NavLink>

        <nav className="flex flex-wrap items-center gap-1 text-sm font-medium text-ink-700">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-md px-3 py-2 transition hover:bg-paper-100 hover:text-ink-950",
                  isActive ? "bg-paper-100 text-ink-950" : "",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${networkClassName}`}
          >
            {networkLabel}
          </span>
          {address && !isSepolia ? (
            <button
              type="button"
              onClick={() => void switchToSepolia()}
              className="inline-flex items-center gap-2 rounded-md border border-warn-600/30 bg-paper-100 px-3 py-2 text-sm font-semibold text-warn-600 transition hover:bg-warn-600/10"
            >
              <AlertTriangle aria-hidden="true" size={16} />
              Sepolia 전환
            </button>
          ) : null}
          {isAdmin ? (
            <span className="rounded-md border border-trust-600/20 bg-trust-600/10 px-2.5 py-1.5 text-sm font-semibold text-trust-600">
              Admin
            </span>
          ) : null}
          {isIssuer ? (
            <span className="rounded-md border border-valid-600/20 bg-valid-600/10 px-2.5 py-1.5 text-sm font-semibold text-valid-600">
              Issuer
            </span>
          ) : null}
          {address ? (
            <span className="rounded-md border border-ink-100 bg-paper-50 px-3 py-1.5 text-sm font-medium text-ink-700">
              {shortAddress}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void connectWallet()}
              className="inline-flex items-center gap-2 rounded-md bg-trust-600 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_4px_18px_-6px_rgba(124,92,255,0.6)] transition hover:bg-trust-500 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={status === "connecting"}
              title={
                hasMetaMask
                  ? `Sepolia Chain ID: ${SEPOLIA_CHAIN_ID}`
                  : "MetaMask 지갑을 찾을 수 없습니다."
              }
            >
              <Wallet aria-hidden="true" size={16} />
              {status === "connecting" ? "연결 중" : "지갑 연결"}
            </button>
          )}
          {error ? (
            <span className="basis-full text-xs font-medium text-warn-600 lg:basis-auto">
              {error}
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
