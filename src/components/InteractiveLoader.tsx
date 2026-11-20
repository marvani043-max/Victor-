"use client";
import { useEffect } from "react";

/** Registers the framework-free custom elements in src/interactive on the client. */
export default function InteractiveLoader() {
  useEffect(() => {
    import("@/interactive");
  }, []);
  return null;
}
