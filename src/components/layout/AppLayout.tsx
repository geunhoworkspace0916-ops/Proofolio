import type { PropsWithChildren } from "react";
import { Header } from "./Header";

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-paper-50 text-ink-950">
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
