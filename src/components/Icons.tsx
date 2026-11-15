export const Arrow = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
    <path d="M1 8h13M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
export const ArrowUpRight = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
    <path d="M4 12L12 4M5 4h7v7" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
export const Instagram = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
  </svg>
);
export const Plus = ({ className = "h-3 w-3" }: { className?: string }) => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className}>
    <path d="M6 0v12M0 6h12" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);
/** Simple ridge line used as a divider motif: the "peak". */
export const Ridge = ({ className = "h-3 w-24" }: { className?: string }) => (
  <svg viewBox="0 0 96 12" fill="none" aria-hidden="true" className={className} preserveAspectRatio="none">
    <path d="M0 11 L18 6 L27 9 L44 1 L58 8 L66 5 L80 10 L96 7" stroke="currentColor" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
  </svg>
);
