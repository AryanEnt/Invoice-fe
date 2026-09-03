import { Suspense } from "react";
import { ReportsPage } from "@/features/reports/reports-page";

export default function ReportsRoute() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading reports…</p>}>
      <ReportsPage />
    </Suspense>
  );
}
