import { useParams } from "react-router-dom";
import { Building2 } from "lucide-react";

export function IssuerProfilePage() {
  const { issuerAddress } = useParams();

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-trust-600">Issuer Profile</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink-950">
          발급기관 프로필
        </h1>
      </div>

      <div className="rounded-lg border border-ink-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-md bg-paper-100 text-trust-600">
            <Building2 aria-hidden="true" size={24} />
          </span>
          <div>
            <h2 className="font-semibold text-ink-950">
              {issuerAddress ?? "주소 미지정"}
            </h2>
            <p className="mt-1 text-sm text-ink-500">프로필 데이터 대기</p>
          </div>
        </div>
      </div>
    </section>
  );
}
