import '@fontsource-variable/big-shoulders-display';
import '@fontsource-variable/archivo';
import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { toast } from './components/dialogs';
import { ErrorBoundary, RecoveryScreen } from './components/ErrorBoundary';
import { ensureLibrary, requestPersistentStorage } from './db';
import { DataProvider } from './lib/data';
import { startAutoSync } from './lib/sync';

registerSW({ immediate: true });

// Async click handlers rarely catch their own errors (a full disk, a broken
// database). Say so instead of failing silently.
let lastError = '';
window.addEventListener('unhandledrejection', (e) => {
  const reason = e.reason as { name?: string; message?: string } | undefined;
  if (reason?.name === 'AbortError') return;
  const message = reason?.message ?? String(e.reason);
  if (message === lastError) return;
  lastError = message;
  setTimeout(() => (lastError = ''), 4000);
  toast(`Something went wrong: ${message}`);
});

const root = createRoot(document.getElementById('root')!);

async function boot() {
  await ensureLibrary();
  void requestPersistentStorage();
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <DataProvider>
          <App />
        </DataProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
  void startAutoSync();
}

boot().catch((e) => {
  console.error("Setward couldn't start", e);
  root.render(<RecoveryScreen error={e} />);
});
