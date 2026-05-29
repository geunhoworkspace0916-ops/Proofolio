import { X } from "lucide-react";
import type { PropsWithChildren } from "react";
import { Button } from "./Button";

type ModalProps = PropsWithChildren<{
  open: boolean;
  title: string;
  onClose: () => void;
}>;

export function Modal({ children, onClose, open, title }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink-950/40 px-4 py-6">
      <div
        className="w-full max-w-sm rounded-lg border border-ink-100 bg-white p-5 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="modal-title" className="font-semibold text-ink-950">
            {title}
          </h2>
          <Button
            aria-label="모달 닫기"
            className="size-8 px-0"
            onClick={onClose}
            size="sm"
            variant="ghost"
          >
            <X aria-hidden="true" size={16} />
          </Button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
