import manifest from "@/data/image-manifest.json";

type Entry = { w: number; h: number; kind: string; widths: number[]; color: string };
const M = manifest as Record<string, Entry>;

export const imageMeta = (name: string) => M[name];
export const imageSrc = (name: string, target = 960) => {
  const e = M[name];
  if (!e) return "";
  const w = e.widths.find((x) => x >= target) ?? e.widths[e.widths.length - 1];
  return `/images/${name}-${w}.webp`;
};

type Props = {
  name: string;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
  /** When true, a studio cut-out is blended onto its tinted background. */
  blend?: boolean;
  style?: React.CSSProperties;
};

export default function Img({ name, alt, sizes = "100vw", className = "", priority, blend = true, style }: Props) {
  const e = M[name];
  if (!e) {
    if (process.env.NODE_ENV !== "production") console.warn("Missing image", name);
    return null;
  }
  const srcSet = e.widths.map((w) => `/images/${name}-${w}.webp ${w}w`).join(", ");
  const studio = e.kind === "studio" && blend;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc(name)}
      srcSet={srcSet}
      sizes={sizes}
      width={e.w}
      height={e.h}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : undefined}
      className={`${studio ? "studio " : ""}${className}`}
      style={style}
    />
  );
}
