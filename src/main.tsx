import { createRoot } from "react-dom/client";
import { logging } from "@/lib/logging";

function renderStartupError(error: unknown) {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack ?? "" : "";

  rootElement.innerHTML = `
    <main class="min-h-screen bg-background text-foreground p-8">
      <section class="mx-auto max-w-2xl rounded-xl border bg-card p-6 shadow-sm">
        <h1 class="text-xl font-semibold">Startup Error</h1>
        <p class="mt-2 text-sm text-muted-foreground">The app failed to load after a refresh.</p>
        <pre class="mt-4 whitespace-pre-wrap rounded-md bg-muted p-3 text-xs text-foreground">${message}${stack ? "\n\n" + stack : ""}</pre>
        <button
          class="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          onclick="window.location.reload()"
        >Reload</button>
      </section>
    </main>
  `;
}

// Capture errors as early as possible.
window.addEventListener("error", (e) => {
  // Avoid infinite loops if our fallback rendering throws.
  try {
    renderStartupError((e as ErrorEvent).error ?? e.message);
  } catch {
    // ignore
  }
});
window.addEventListener("unhandledrejection", (e) => {
  try {
    renderStartupError((e as PromiseRejectionEvent).reason);
  } catch {
    // ignore
  }
});

try {
  logging.init();
} catch (err) {
  console.warn("[logging] init failed; continuing without Sentry:", err);
}

async function start() {
  try {
    const rootElement = document.getElementById("root");
    if (!rootElement) throw new Error("Root element not found");

    const root = createRoot(rootElement);

    // Dynamic import ensures module-eval errors surface in this try/catch.
    const { default: App } = await import("./App");

    root.render(<App />);
  } catch (error) {
    console.error("[startup] failed:", error);
    renderStartupError(error);
  }
}

void start();
