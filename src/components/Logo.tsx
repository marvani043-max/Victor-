import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="Peak Side — home" className={`group flex items-center gap-1 ${className}`}>
      <span aria-hidden="true" className="mask-pks block h-8 w-11 transition-transform duration-500 ease-out group-hover:-rotate-6" />
      <span className="display text-[22px] leading-none tracking-[0.01em]">Peak Side</span>
    </Link>
  );
}
