import type { PropsWithChildren } from "react";
import { Header } from "./Header";

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-paper-50 text-ink-950">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
