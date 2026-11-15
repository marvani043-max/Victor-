import { Ridge } from "./Icons";

export default function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const row = (hidden?: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden}>
      {items.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className="label whitespace-nowrap px-6 text-[12px]">{t}</span>
          <Ridge className="h-2.5 w-10 opacity-50" />
        </span>
      ))}
    </div>
  );
  return (
    <div className={`marquee overflow-hidden ${className}`}>
      <div className="marquee-track flex w-max">
        {row()}
        {row(true)}
        {row(true)}
        {row(true)}
      </div>
    </div>
  );
}
