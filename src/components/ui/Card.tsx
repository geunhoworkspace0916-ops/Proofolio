import type { HTMLAttributes } from "react";

export function Card({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "rounded-lg border border-ink-100 bg-white p-5 shadow-sm",
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
