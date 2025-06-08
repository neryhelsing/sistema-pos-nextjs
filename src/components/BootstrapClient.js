"use client"; // 🚨 Este archivo sí es cliente

import { useEffect } from "react";

export default function BootstrapClient() {
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return null; // No renderiza nada
}
