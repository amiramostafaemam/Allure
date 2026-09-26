import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App.jsx";
import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/react";
import { BrowserRouter } from "react-router";
import SentryErrorFallback from "./components/SentryErrorFallback.jsx";
import SentryUserSync from "./components/SentryUserSync.jsx";
import CartSignOutSync from "./components/CartSignOutSync.jsx";

const queryClient = new QueryClient();

const apiBase = import.meta.env.VITE_API_URL ?? "";
const tracePropagationTargets =
  apiBase.length > 0
    ? [apiBase]
    : typeof window !== "undefined"
      ? [window.location.origin]
      : [];

const isProduction = import.meta.env.MODE === "production";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  sendDefaultPii: false,
  integrations: [
    Sentry.browserTracingIntegration(),
    // Masking stays on: session replays would otherwise record every
    // keystroke (order chat, admin forms, etc.) verbatim.
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: isProduction ? 0.2 : 1.0,
  tracePropagationTargets: tracePropagationTargets,
  replaysSessionSampleRate: isProduction ? 0.05 : 0,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider>
      <SentryUserSync />
      <CartSignOutSync />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Sentry.ErrorBoundary fallback={<SentryErrorFallback />}>
            <App />
          </Sentry.ErrorBoundary>
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>,
);
