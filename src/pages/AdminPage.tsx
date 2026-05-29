import { FormEvent, useMemo, useState } from "react";
import { Building2, RefreshCw } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import {
  TransactionToast,
  type TransactionToastState,
} from "../components/ui/Toast";
import { useIssuerRegistry } from "../hooks/useIssuerRegistry";
import { isValidAddress, normalizeAddress, shortenAddress } from "../lib/address";
import { toUserFacingError } from "../lib/contractErrors";
import {
  registerIssuer as registerIssuerTx,
  setIssuerActive as setIssuerActiveTx,
} from "../lib/proofolio";
import { useWallet } from "../wallet/useWallet";

type FormErrors = {
  issuer?: string;
  name?: string;
};

type IssuerFormState = {
  issuer: string;
  name: string;
  metaURI: string;
};

const initialFormState: IssuerFormState = {
  issuer: "",
  name: "",
  metaURI: "",
};

function validateForm(form: IssuerFormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.issuer.trim()) {
    errors.issuer = "발급기관 주소를 입력해주세요.";
  } else if (!isValidAddress(form.issuer.trim())) {
    errors.issuer = "유효한 Ethereum 주소를 입력해주세요.";
  }

  if (!form.name.trim()) {
    errors.name = "기관 이름을 입력해주세요.";
  }

  return errors;
}

function isReceiptSuccessful(status: number | null | undefined) {
  return status === undefined || status === null || status === 1;
}

export function AdminPage() {
  const {
    address,
    connectWallet,
    isAdmin,
    isSepolia,
    refreshWalletRoles,
    switchToSepolia,
  } = useWallet();
  const [form, setForm] = useState<IssuerFormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [transactionToast, setTransactionToast] =
    useState<TransactionToastState | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const registry = useIssuerRegistry(Boolean(isAdmin));

  const registeredAddresses = useMemo(
    () => new Set(registry.issuers.map((issuer) => normalizeAddress(issuer.address))),
    [registry.issuers],
  );

  const canSubmitTransaction = Boolean(isAdmin && isSepolia && !busyAction);

  async function runTransaction(
    actionId: string,
    title: string,
    submit: () => Promise<{ hash: string; wait: () => Promise<{ status?: number | null } | null> }>,
  ) {
    try {
      setBusyAction(actionId);
      setTransactionToast({
        status: "signing",
        title,
        description: "MetaMask에서 서명을 확인해주세요.",
      });

      const tx = await submit();

      setTransactionToast({
        status: "submitted",
        title,
        description: "트랜잭션이 전송되었습니다. 확정을 기다리는 중입니다.",
        hash: tx.hash,
      });

      const receipt = await tx.wait();

      if (!isReceiptSuccessful(receipt?.status)) {
        throw new Error("트랜잭션 처리에 실패했습니다.");
      }

      setTransactionToast({
        status: "confirmed",
        title,
        description: "트랜잭션이 확정되었습니다.",
        hash: tx.hash,
      });
      await registry.refresh();
      await refreshWalletRoles();
      return true;
    } catch (error) {
      setTransactionToast({
        status: "failed",
        title,
        description: toUserFacingError(error),
      });
      return false;
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRegisterIssuer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(form);
    const normalizedIssuer = isValidAddress(form.issuer.trim())
      ? normalizeAddress(form.issuer.trim())
      : null;

    if (normalizedIssuer && registeredAddresses.has(normalizedIssuer)) {
      nextErrors.issuer = "이미 등록된 발급기관 주소입니다.";
    }

    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !normalizedIssuer) {
      return;
    }

    const confirmed = await runTransaction("register", "발급기관 등록", async () =>
      registerIssuerTx(normalizedIssuer, form.name.trim(), form.metaURI.trim()),
    );

    if (confirmed) {
      setForm(initialFormState);
    }
  }

  async function handleIssuerStatus(addressToUpdate: string, active: boolean) {
    await runTransaction(
      `${active ? "activate" : "deactivate"}-${addressToUpdate}`,
      active ? "발급기관 활성화" : "발급기관 비활성화",
      async () => setIssuerActiveTx(addressToUpdate, active),
    );
  }

  if (!address || !isAdmin) {
    return (
      <section className="space-y-6">
        <PageHeader />
        <Card>
          <CardTitle>관리자만 접근 가능</CardTitle>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            발급기관 등록과 활성 상태 관리는 컨트랙트 owner 지갑에서만 사용할 수 있습니다.
          </p>
          {!address ? (
            <Button className="mt-5" onClick={() => void connectWallet()}>
              지갑 연결
            </Button>
          ) : null}
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader />

      {!isSepolia ? (
        <Card className="border-warn-600/20 bg-warn-600/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Sepolia 네트워크가 필요합니다</CardTitle>
              <p className="mt-1 text-sm text-ink-500">
                등록과 상태 변경 트랜잭션은 Sepolia에서만 실행할 수 있습니다.
              </p>
            </div>
            <Button onClick={() => void switchToSepolia()} variant="warning">
              Sepolia 전환
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-paper-100 text-trust-600">
              <Building2 aria-hidden="true" size={20} />
            </span>
            <CardTitle>새 발급기관 등록</CardTitle>
          </div>

          <form onSubmit={(event) => void handleRegisterIssuer(event)} className="mt-5">
            <fieldset disabled={!canSubmitTransaction} className="grid gap-4">
              <Input
                label="발급기관 지갑 주소"
                value={form.issuer}
                onChange={(event) => {
                  setForm((current) => ({ ...current, issuer: event.target.value }));
                  setFormErrors((current) => ({ ...current, issuer: undefined }));
                }}
                placeholder="0xABCD...1234"
                error={formErrors.issuer}
              />
              <Input
                label="이름"
                value={form.name}
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }));
                  setFormErrors((current) => ({ ...current, name: undefined }));
                }}
                placeholder="코드스쿨 부트캠프"
                error={formErrors.name}
              />
              <Input
                label="소개/프로필 URI"
                value={form.metaURI}
                onChange={(event) =>
                  setForm((current) => ({ ...current, metaURI: event.target.value }))
                }
                placeholder="https://codeschool.example"
                helpText="선택 입력입니다."
              />
              <Button disabled={!canSubmitTransaction} type="submit">
                발급기관 등록
              </Button>
            </fieldset>
          </form>

          <p className="mt-4 text-sm text-ink-500">
            등록하면 이 주소가 증명서를 발급할 수 있게 됩니다.
          </p>
        </Card>

        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>등록된 발급기관</CardTitle>
              <p className="mt-1 text-sm text-ink-500">
                총 {registry.issuers.length}곳
              </p>
            </div>
            <Button
              onClick={() => void registry.refresh()}
              size="sm"
              variant="secondary"
              disabled={registry.loading}
            >
              <RefreshCw aria-hidden="true" size={16} />
              새로고침
            </Button>
          </div>

          <IssuerList
            busyAction={busyAction}
            canSubmitTransaction={canSubmitTransaction}
            error={registry.error}
            issuers={registry.issuers}
            loading={registry.loading}
            onStatusChange={handleIssuerStatus}
          />
        </Card>
      </div>

      <TransactionToast
        toast={transactionToast}
        onDismiss={() => setTransactionToast(null)}
      />
    </section>
  );
}

function PageHeader() {
  return (
    <div>
      <p className="text-sm font-semibold text-trust-600">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink-950">
        발급기관 관리
      </h1>
      <p className="mt-2 text-sm text-ink-500">Admin 전용</p>
    </div>
  );
}

type IssuerListProps = {
  busyAction: string | null;
  canSubmitTransaction: boolean;
  error: string | null;
  issuers: Array<{
    active: boolean;
    address: string;
    issuedCount: number;
    name: string;
  }>;
  loading: boolean;
  onStatusChange: (address: string, active: boolean) => Promise<void>;
};

function IssuerList({
  busyAction,
  canSubmitTransaction,
  error,
  issuers,
  loading,
  onStatusChange,
}: IssuerListProps) {
  if (loading) {
    return (
      <div className="mt-5 grid gap-2">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-12 rounded-md bg-paper-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-5 rounded-md border border-warn-600/20 bg-warn-600/5 p-4 text-sm text-warn-600">
        {error}
      </div>
    );
  }

  if (issuers.length === 0) {
    return (
      <div className="mt-5 rounded-md border border-dashed border-ink-100 bg-paper-50 p-6 text-sm text-ink-500">
        아직 등록된 발급기관이 없습니다.
      </div>
    );
  }

  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[38rem] text-left text-sm">
        <thead className="border-b border-ink-100 text-xs font-semibold text-ink-500">
          <tr>
            <th className="pb-3 pr-4">이름</th>
            <th className="pb-3 pr-4">주소</th>
            <th className="pb-3 pr-4">상태</th>
            <th className="pb-3 pr-4">발급 수</th>
            <th className="pb-3">관리</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {issuers.map((issuer) => {
            const nextActive = !issuer.active;
            const actionId = `${nextActive ? "activate" : "deactivate"}-${issuer.address}`;

            return (
              <tr key={issuer.address}>
                <td className="py-3 pr-4 font-medium text-ink-950">
                  {issuer.name || "이름 없음"}
                </td>
                <td className="py-3 pr-4 text-ink-700">
                  {shortenAddress(issuer.address)}
                </td>
                <td className="py-3 pr-4">
                  <Badge tone={issuer.active ? "success" : "neutral"}>
                    {issuer.active ? "활성" : "비활성"}
                  </Badge>
                </td>
                <td className="py-3 pr-4 text-ink-700">{issuer.issuedCount}</td>
                <td className="py-3">
                  <Button
                    disabled={!canSubmitTransaction || busyAction === actionId}
                    onClick={() => void onStatusChange(issuer.address, nextActive)}
                    size="sm"
                    variant={issuer.active ? "warning" : "secondary"}
                  >
                    {issuer.active ? "비활성화" : "활성화"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
