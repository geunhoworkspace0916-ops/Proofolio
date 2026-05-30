import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download } from "lucide-react";
import { Button, ButtonLink } from "./Button";
import { Modal } from "./Modal";

type QrCodeModalProps = {
  open: boolean;
  title: string;
  url: string;
  fileName?: string;
  onClose: () => void;
};

export function QrCodeModal({
  fileName = "proofolio-verify-qr.png",
  onClose,
  open,
  title,
  url,
}: QrCodeModalProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !url) {
      setDataUrl(null);
      setError(null);
      return;
    }

    let active = true;

    setDataUrl(null);
    setError(null);

    QRCode.toDataURL(url, {
      margin: 1,
      width: 240,
    })
      .then((nextDataUrl) => {
        if (active) {
          setDataUrl(nextDataUrl);
        }
      })
      .catch(() => {
        if (active) {
          setError("QR 코드를 생성하지 못했습니다.");
        }
      });

    return () => {
      active = false;
    };
  }, [open, url]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopied(false), 2000);

    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setError("브라우저가 클립보드 복사를 허용하지 않았습니다.");
    }
  }

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {error ? (
        <p className="text-sm text-warn-600">{error}</p>
      ) : dataUrl ? (
        <div className="grid justify-items-center gap-3">
          <img
            src={dataUrl}
            alt="증명서 검증 링크 QR 코드"
            className="size-60 rounded-md border border-ink-100 bg-white p-2"
          />
          <p className="break-all text-center text-xs text-ink-500">{url}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => void handleCopy()} size="sm" variant="secondary">
              <Copy aria-hidden="true" size={16} />
              {copied ? "복사됨" : "링크 복사"}
            </Button>
            <ButtonLink href={dataUrl} download={fileName} size="sm" variant="secondary">
              <Download aria-hidden="true" size={16} />
              이미지 저장
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="h-60 rounded-md bg-paper-100" />
      )}
    </Modal>
  );
}
