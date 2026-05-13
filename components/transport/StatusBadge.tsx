const STATUS_CLS: Record<string, string> = {
  Active:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  Suspended:   "bg-red-50 text-red-700 border-red-200",
  "Off Duty":  "bg-amber-50 text-amber-700 border-amber-200",
  Maintenance: "bg-orange-50 text-orange-700 border-orange-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${STATUS_CLS[status] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
}
