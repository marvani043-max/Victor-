import type { DetailedHTMLProps, HTMLAttributes } from "react";

type CustomEl = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "ps-spin": CustomEl & { front?: string; back?: string; label?: string; word?: string; "no-autoplay"?: string };
      "ps-showcase": CustomEl;
      "ps-fit": CustomEl;
      "ps-petals": CustomEl & { snow?: string };
    }
  }
}
