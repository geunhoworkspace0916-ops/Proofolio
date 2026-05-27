import { Navigate, Route, Routes } from "react-router-dom";
import { AdminPage } from "../pages/AdminPage";
import { HomePage } from "../pages/HomePage";
import { IssuePage } from "../pages/IssuePage";
import { IssuerProfilePage } from "../pages/IssuerProfilePage";
import { MyCredentialsPage } from "../pages/MyCredentialsPage";
import { VerifyPage } from "../pages/VerifyPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/verify/:tokenId" element={<VerifyPage />} />
      <Route path="/issue" element={<IssuePage />} />
      <Route path="/credentials" element={<MyCredentialsPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/issuers/:issuerAddress" element={<IssuerProfilePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
