"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TaxCsvRow {
  date: string;
  direction: string;
  contracts: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  fees: number;
}

function toCsv(rows: TaxCsvRow[]): string {
  const header = ["Date", "Direction", "Contracts", "Entry", "Exit", "P&L", "Fees"];
  const lines = rows.map((r) =>
    [r.date, r.direction, r.contracts, r.entryPrice, r.exitPrice, r.pnl.toFixed(2), r.fees.toFixed(2)].join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

export function CsvExportButton({ rows, filename }: { rows: TaxCsvRow[]; filename: string }) {
  const handleExport = () => {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={rows.length === 0}>
      <Download className="size-4" />
      Export CSV
    </Button>
  );
}
