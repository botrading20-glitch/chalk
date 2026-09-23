import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';

// Hash routing keeps the app working from any static host path (GitHub Pages)
// and from the installed home-screen app without server rewrites.

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

const getHash = () => window.location.hash.slice(1) || '/';

export interface Route {
  path: string;
  segments: string[];
  query: URLSearchParams;
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash);
  const [path, search = ''] = hash.split('?');
  return { path, segments: path.split('/').filter(Boolean), query: new URLSearchParams(search) };
}

// Each in-app history entry records its depth so "back" never leaves the app.
const depth = (): number => history.state?.depth ?? 0;

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (opts.replace) {
    history.replaceState({ depth: depth() }, '', `#${to}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    const next = depth() + 1;
    window.location.hash = to;
    history.replaceState({ depth: next }, '');
  }
  window.scrollTo(0, 0);
}

/** Goes back inside the app, or to `fallback` when the page was opened directly. */
export function goBack(fallback: string) {
  if (depth() > 0) history.back();
  else navigate(fallback, { replace: true });
}

export function Link({ to, onClick, ...rest }: { to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={`#${to}`}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    />
  );
}
