"use client";
import { motion } from "framer-motion";

type Props = {
  delay?: number;
  y?: number;
  as?: "div" | "li";
  className?: string;
  children: React.ReactNode;
};

export default function Reveal({ delay = 0, y = 28, as = "div", className, children }: Props) {
  const M = as === "li" ? motion.li : motion.div;
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </M>
  );
}
