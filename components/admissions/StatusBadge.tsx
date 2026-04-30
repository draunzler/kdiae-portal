"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { statusMeta } from "./constants";

export function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta[status] ?? statusMeta["Pending"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${meta.color}`}>
      <FontAwesomeIcon icon={meta.icon} className="text-[10px]" />
      {status}
    </span>
  );
}
