import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@aba/design-system";
import "./app.css";
import { App } from "./App";
import { AuthProvider } from "./lib/auth";
import { ToastProvider } from "@aba/design-system";

const theme = localStorage.getItem("aba.theme");
if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
if ("serviceWorker" in navigator && import.meta.env.PROD) navigator.serviceWorker.register("/sw.js");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider><App /></AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
