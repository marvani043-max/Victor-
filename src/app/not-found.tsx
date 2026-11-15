import Link from "next/link";
import { Arrow } from "@/components/Icons";

export default function NotFound() {
  return (
    <div className="wrap flex min-h-[70vh] flex-col justify-center py-24">
      <p className="label text-granite">404 — Off trail</p>
      <h1 className="display mt-4 text-[20vw] sm:text-[10rem]">Wrong turn.</h1>
      <p className="mt-4 max-w-md text-[17px] text-ink/75">This page doesn&apos;t exist, or it moved. The shop is still right where you left it.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/shop/" className="btn-ink">
          Back to the shop <Arrow />
        </Link>
        <Link href="/" className="btn-line">
          Home
        </Link>
      </div>
    </div>
  );
}
