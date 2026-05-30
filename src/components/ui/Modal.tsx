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
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 backdrop-blur-sm px-4 py-6">
      <div
        className="w-full max-w-sm rounded-2xl border border-ink-100 bg-paper-100 p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
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
