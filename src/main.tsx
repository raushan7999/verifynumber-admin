import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./lib/auth";
import Shell from "./components/Shell";
import Login from "./pages/Login";
import Devices from "./pages/Devices";
import Enrollment from "./pages/Enrollment";
import Messages from "./pages/Messages";

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold text-brand-300">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-white">Page not found</h1>
      <Link to="/" className="mt-6 text-sm text-brand-300 hover:text-brand-200">
        Back to devices
      </Link>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Shell />}>
            <Route index element={<Devices />} />
            <Route path="enrollment" element={<Enrollment />} />
            <Route path="messages" element={<Messages />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
