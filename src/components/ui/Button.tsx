import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "warning" | "ghost";
type ButtonSize = "sm" | "md";

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "bg-trust-600 text-white shadow-[0_4px_18px_-6px_rgba(124,92,255,0.55)] hover:bg-trust-500",
  secondary:
    "border border-ink-100 bg-paper-100 text-ink-900 hover:bg-paper-100/70 hover:text-ink-950",
  warning:
    "border border-warn-600/30 bg-paper-100 text-warn-600 hover:bg-warn-600/10",
  ghost: "text-ink-700 hover:bg-paper-100 hover:text-ink-950",
};

const sizeClassNames: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
};

function buttonClassName({
  className = "",
  size,
  variant,
}: {
  className?: string;
  size: ButtonSize;
  variant: ButtonVariant;
}) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
    variantClassNames[variant],
    sizeClassNames[size],
    className,
  ].join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  children,
  className = "",
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ className, size, variant })}
      {...props}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({
  children,
  className = "",
  size = "md",
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <a
      className={buttonClassName({ className, size, variant })}
      {...props}
    >
      {children}
    </a>
  );
}
