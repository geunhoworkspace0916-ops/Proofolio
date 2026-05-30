import { X } from "lucide-react";
import { getEtherscanTxUrl } from "../../lib/etherscan";
import { Button } from "./Button";

export type TransactionToastStatus =
  | "signing"
  | "submitted"
  | "confirmed"
  | "failed";

export type TransactionToastState = {
  status: TransactionToastStatus;
  title: string;
  description?: string;
  hash?: string;
};

const statusLabel: Record<TransactionToastStatus, string> = {
  signing: "서명 대기",
  submitted: "전송됨",
  confirmed: "확정됨",
  failed: "실패",
};

type TransactionToastProps = {
  toast: TransactionToastState | null;
  onDismiss: () => void;
};

export function TransactionToast({ onDismiss, toast }: TransactionToastProps) {
  if (!toast) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(calc(100vw-2rem),24rem)] rounded-2xl border border-ink-100 bg-paper-100 p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase text-ink-500">
            {statusLabel[toast.status]}
          </div>
          <div className="mt-1 font-semibold text-ink-950">{toast.title}</div>
          {toast.description ? (
            <p className="mt-1 text-sm text-ink-500">{toast.description}</p>
          ) : null}
          {toast.hash ? (
            <a
              href={getEtherscanTxUrl(toast.hash)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-sm font-semibold text-trust-600 hover:text-trust-500"
            >
              Etherscan에서 보기
            </a>
          ) : null}
        </div>
        <Button
          aria-label="토스트 닫기"
          className="size-8 px-0"
          onClick={onDismiss}
          size="sm"
          variant="ghost"
        >
          <X aria-hidden="true" size={16} />
        </Button>
      </div>
    </div>
  );
}
