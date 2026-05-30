import { Link, useParams } from "react-router-dom";
import { Building2, ExternalLink } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { ButtonLink } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { PageHeader } from "../components/layout/PageHeader";
import { formatUnixDate } from "../lib/date";
import { shortenAddress } from "../lib/address";
import { useIssuerProfile } from "../hooks/useIssuerProfile";

export function IssuerProfilePage() {
  const { issuerAddress } = useParams();
  const profileState = useIssuerProfile(issuerAddress);

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="Issuer Profile" title="발급기관 프로필" />

      {profileState.status === "loading" ? (
        <Card>
          <div className="h-6 w-1/2 rounded-md bg-paper-100" />
          <div className="mt-4 h-4 w-2/3 rounded-md bg-paper-100" />
          <div className="mt-3 h-4 w-1/3 rounded-md bg-paper-100" />
        </Card>
      ) : null}

      {profileState.status === "error" ? (
        <Card className="border-warn-600/20 bg-warn-600/5">
          <CardTitle>프로필을 찾을 수 없습니다</CardTitle>
          <p className="mt-2 text-sm text-warn-600">{profileState.error}</p>
        </Card>
      ) : null}

      {profileState.status === "success" ? (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-md bg-paper-100 text-trust-600">
                <Building2 aria-hidden="true" size={24} />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-xl">
                  {profileState.profile.name || "이름 없음"}
                </CardTitle>
                <p className="mt-1 font-mono text-sm text-ink-500">
                  {shortenAddress(profileState.profile.address)}
                </p>
              </div>
            </div>
            <Badge tone={profileState.profile.active ? "success" : "neutral"}>
              {profileState.profile.active ? "Active" : "Inactive"}
            </Badge>
          </div>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-500">주소</dt>
              <dd className="mt-1 break-all font-medium text-ink-950">
                {profileState.profile.address}
              </dd>
            </div>
            <div>
              <dt className="text-ink-500">등록일</dt>
              <dd className="mt-1 font-medium text-ink-950">
                {formatUnixDate(profileState.profile.registeredAt)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-500">발급한 증명서</dt>
              <dd className="mt-1 font-medium text-ink-950">
                {profileState.profile.issuedCount}건
              </dd>
            </div>
            <div>
              <dt className="text-ink-500">활성 여부</dt>
              <dd className="mt-1 font-medium text-ink-950">
                {profileState.profile.active ? "활성" : "비활성"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 rounded-md border border-ink-100 bg-paper-50 p-4">
            <div className="text-sm font-semibold text-ink-900">소개</div>
            {profileState.profile.metaURI ? (
              isValidExternalUri(profileState.profile.metaURI) ? (
                <ButtonLink
                  className="mt-3"
                  href={profileState.profile.metaURI}
                  target="_blank"
                  rel="noreferrer"
                  size="sm"
                  variant="secondary"
                >
                  <ExternalLink aria-hidden="true" size={16} />
                  프로필 URI 열기
                </ButtonLink>
              ) : (
                <p className="mt-2 break-all text-sm text-ink-700">
                  {profileState.profile.metaURI}
                </p>
              )
            ) : (
              <p className="mt-2 text-sm text-ink-500">
                등록된 소개 URI가 없습니다.
              </p>
            )}
          </div>

          <div className="mt-5">
            <Link
              to="/credentials"
              className="text-sm font-semibold text-trust-600 hover:text-trust-500"
            >
              내 증명서 목록으로 돌아가기
            </Link>
          </div>
        </Card>
      ) : null}
    </section>
  );
}

function isValidExternalUri(value: string) {
  return /^https?:\/\//u.test(value) || value.startsWith("ipfs://");
}
