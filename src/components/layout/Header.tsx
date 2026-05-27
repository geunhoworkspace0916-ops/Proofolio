import { NavLink } from "react-router-dom";
import { ShieldCheck, Wallet } from "lucide-react";
import { SEPOLIA_CHAIN_ID } from "../../config/networks";

const navItems = [
  { to: "/", label: "홈" },
  { to: "/verify", label: "검증" },
  { to: "/issue", label: "발급" },
  { to: "/credentials", label: "내 증명서" },
  { to: "/admin", label: "기관 관리" },
];

export function Header() {
  return (
    <header className="border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="grid size-9 place-items-center rounded-md bg-ink-950 text-white">
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
          <span className="rounded-md border border-valid-600/20 bg-valid-600/10 px-3 py-1.5 text-sm font-medium text-valid-600">
            Sepolia {SEPOLIA_CHAIN_ID}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-ink-950 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-70"
            disabled
            title="지갑 연결은 이후 단계에서 활성화됩니다."
          >
            <Wallet aria-hidden="true" size={16} />
            지갑 연결
          </button>
        </div>
      </div>
    </header>
  );
}
