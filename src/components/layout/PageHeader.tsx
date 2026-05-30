import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  /** 헤더 하단에 보조 콘텐츠 (예: 상태 뱃지, 메타 정보) */
  children?: ReactNode;
};

/**
 * 내부(유틸리티) 페이지용 헤더.
 * 마케팅 랜딩(홈) 헤드라인보다 작고 차분한 위계를 갖는다.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: PageHeaderProps) {
  return (
    <div className="space-y-2">
      {eyebrow ? (
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-trust-600">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.015em] text-ink-950 sm:text-[28px]">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-sm leading-6 text-ink-500">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
