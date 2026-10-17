import { BRAND_MARK_PATHS, BRAND_NAME } from '../lib/brand';

export function BrandMark({ width = 30, height = 34, className = 'brand-mark' }: { width?: number; height?: number; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 90 100" width={width} height={height} aria-hidden="true" focusable="false">
      {BRAND_MARK_PATHS.map((d) => <path key={d} d={d} fill="currentColor" />)}
    </svg>
  );
}

export function Brand() {
  return (
    <span className="brand">
      <BrandMark />
      <span className="brand-name">{BRAND_NAME}</span>
    </span>
  );
}
