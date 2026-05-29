import type { HTMLAttributes } from "react";

type BadgeTone = "neutral" | "success" | "warning" | "info";

const toneClassNames: Record<BadgeTone, string> = {
  neutral: "border-ink-100 bg-paper-50 text-ink-700",
  success: "border-valid-600/20 bg-valid-600/10 text-valid-600",
  warning: "border-warn-600/20 bg-warn-600/10 text-warn-600",
  info: "border-trust-600/20 bg-trust-600/10 text-trust-600",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({
  children,
  className = "",
  tone = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
        toneClassNames[tone],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
