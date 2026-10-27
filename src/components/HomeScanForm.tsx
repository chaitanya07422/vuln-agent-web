"use client";

import { useSearchParams } from "next/navigation";
import { ScanForm } from "@/components/ScanForm";

export function HomeScanForm() {
  const params = useSearchParams();
  const initialUrl = (params.get("url") || "").trim();
  return <ScanForm initialUrl={initialUrl} key={initialUrl || "blank"} />;
}
