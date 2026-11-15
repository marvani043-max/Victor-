import { Plus } from "./Icons";

export default function Accordion({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="group border-b border-ink/15" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 [&::-webkit-details-marker]:hidden">
        <span className="label text-[12px]">{title}</span>
        <Plus className="h-3 w-3 transition-transform duration-300 group-open:rotate-45" />
      </summary>
      <div className="pb-5 text-[15px] leading-relaxed text-ink/80">{children}</div>
    </details>
  );
}
