import type { HTMLAttributes } from "react";

export function Card({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "rounded-2xl border border-ink-100 bg-paper-100 p-6 shadow-[0_1px_2px_rgba(28,22,18,0.04)]",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={["font-semibold text-ink-950", className].join(" ")} {...props}>
      {children}
    </h2>
  );
}
