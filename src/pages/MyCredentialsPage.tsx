import { BadgeCheck } from "lucide-react";

export function MyCredentialsPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-trust-600">Holder</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink-950">
          내 증명서
        </h1>
      </div>

      <div className="rounded-lg border border-ink-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-paper-100 text-valid-600">
            <BadgeCheck aria-hidden="true" size={20} />
          </span>
          <div>
            <h2 className="font-semibold text-ink-950">보유 목록</h2>
            <p className="mt-1 text-sm text-ink-500">지갑 연결 대기</p>
          </div>
        </div>
      </div>
    </section>
  );
}
