import { useId, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  helpText?: string;
  label: string;
};

export function Input({
  className = "",
  error,
  helpText,
  id,
  label,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-ink-900">
        {label}
      </label>
      <input
        id={inputId}
        className={[
          "min-h-11 rounded-md border bg-paper-50 px-3 text-ink-950 placeholder:text-ink-500 disabled:cursor-not-allowed disabled:opacity-70",
          error ? "border-warn-600" : "border-ink-100",
          className,
        ].join(" ")}
        aria-invalid={Boolean(error)}
        aria-describedby={error || helpText ? `${inputId}-description` : undefined}
        {...props}
      />
      {error || helpText ? (
        <p
          id={`${inputId}-description`}
          className={`text-xs ${error ? "text-warn-600" : "text-ink-500"}`}
        >
          {error ?? helpText}
        </p>
      ) : null}
    </div>
  );
}
