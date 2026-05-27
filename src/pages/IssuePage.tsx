import { FileKey2 } from "lucide-react";

export function IssuePage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-trust-600">Issuer</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink-950">
          증명서 발급
        </h1>
      </div>

      <form className="max-w-3xl rounded-lg border border-ink-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-paper-100 text-trust-600">
            <FileKey2 aria-hidden="true" size={20} />
          </span>
          <h2 className="font-semibold text-ink-950">발급 정보</h2>
        </div>

        <fieldset disabled className="mt-5 grid gap-4">
          <input
            className="min-h-11 rounded-md border border-ink-100 bg-paper-50 px-3"
            placeholder="보유자 지갑 주소"
          />
          <select className="min-h-11 rounded-md border border-ink-100 bg-paper-50 px-3">
            <option>수료증</option>
            <option>경력</option>
            <option>프로젝트</option>
            <option>수상</option>
          </select>
          <input
            className="min-h-11 rounded-md border border-ink-100 bg-paper-50 px-3"
            placeholder="메타 URI"
          />
          <button className="min-h-11 rounded-md bg-ink-950 px-4 font-semibold text-white">
            발급
          </button>
        </fieldset>
      </form>
    </section>
  );
}
