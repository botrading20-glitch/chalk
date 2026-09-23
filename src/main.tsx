import '@fontsource-variable/big-shoulders-display';
import '@fontsource-variable/archivo';
import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { ensureLibrary, requestPersistentStorage } from './db';
import { DataProvider } from './lib/data';

registerSW({ immediate: true });

async function boot() {
  await ensureLibrary();
  void requestPersistentStorage();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <DataProvider>
        <App />
      </DataProvider>
    </StrictMode>,
  );
}

boot().catch((e) => {
  document.getElementById('root')!.textContent = `Chalk couldn't start: ${(e as Error).message}`;
});
