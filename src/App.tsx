import { AppLayout } from "./components/layout/AppLayout";
import { AppRouter } from "./routes/AppRouter";
import { WalletProvider } from "./wallet/WalletProvider";

export default function App() {
  return (
    <WalletProvider>
      <AppLayout>
        <AppRouter />
      </AppLayout>
    </WalletProvider>
  );
}
