"use client";

import { usePathname } from "next/navigation";

export function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  const label = parts
    .slice(0, 2)
    .map((p) => p.replace(/-/g, " "))
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" / ");

  return (
    <div className="text-sm text-muted-foreground" aria-label="Breadcrumbs">
      {label || "Home"}
    </div>
  );
}

