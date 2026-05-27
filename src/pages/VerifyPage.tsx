import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function VerifyPage() {
  const navigate = useNavigate();
  const { tokenId } = useParams();
  const [query, setQuery] = useState("");

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
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-md bg-paper-100 text-trust-600">
              <ShieldCheck aria-hidden="true" size={24} />
            </span>
            <div>
              <h2 className="font-semibold text-ink-950">
                컨트랙트 조회 준비
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                읽기 전용 RPC와 ABI 연결 대기
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
