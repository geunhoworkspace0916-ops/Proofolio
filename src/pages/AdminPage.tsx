import { Building2 } from "lucide-react";

export function AdminPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-trust-600">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink-950">
          발급기관 관리
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <form className="rounded-lg border border-ink-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-paper-100 text-trust-600">
              <Building2 aria-hidden="true" size={20} />
            </span>
            <h2 className="font-semibold text-ink-950">새 발급기관</h2>
          </div>
          <fieldset disabled className="mt-5 grid gap-4">
            <input
              className="min-h-11 rounded-md border border-ink-100 bg-paper-50 px-3"
              placeholder="발급기관 지갑 주소"
            />
            <input
              className="min-h-11 rounded-md border border-ink-100 bg-paper-50 px-3"
              placeholder="기관 이름"
            />
            <input
              className="min-h-11 rounded-md border border-ink-100 bg-paper-50 px-3"
              placeholder="소개/프로필 URI"
            />
            <button className="min-h-11 rounded-md bg-ink-950 px-4 font-semibold text-white">
              등록
            </button>
          </fieldset>
        </form>

        <div className="rounded-lg border border-ink-100 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-ink-950">등록된 발급기관</h2>
          <div className="mt-5 rounded-md border border-dashed border-ink-100 bg-paper-50 p-6 text-sm text-ink-500">
            목록 데이터 대기
          </div>
        </div>
      </div>
    </section>
  );
}
