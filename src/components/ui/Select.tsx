import { useId, type SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  helpText?: string;
  label: string;
};

export function Select({
  children,
  className = "",
  error,
  helpText,
  id,
  label,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={selectId} className="text-sm font-semibold text-ink-900">
        {label}
      </label>
      <select
        id={selectId}
        className={[
          "min-h-11 rounded-md border bg-paper-50 px-3 text-ink-950 disabled:cursor-not-allowed disabled:opacity-70",
          error ? "border-warn-600" : "border-ink-100",
          className,
        ].join(" ")}
        aria-invalid={Boolean(error)}
        aria-describedby={error || helpText ? `${selectId}-description` : undefined}
        {...props}
      >
        {children}
      </select>
      {error || helpText ? (
        <p
          id={`${selectId}-description`}
          className={`text-xs ${error ? "text-warn-600" : "text-ink-500"}`}
        >
          {error ?? helpText}
        </p>
      ) : null}
    </div>
  );
}
