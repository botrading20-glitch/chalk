import { BRAND_MARK_PATHS, BRAND_NAME } from '../lib/brand';

export function Brand() {
  return (
    <span className="brand">
      <svg className="brand-mark" viewBox="0 0 90 100" width="30" height="34" aria-hidden="true" focusable="false">
        {BRAND_MARK_PATHS.map((d) => <path key={d} d={d} fill="currentColor" />)}
      </svg>
      <span className="brand-name">{BRAND_NAME}</span>
    </span>
  );
}
