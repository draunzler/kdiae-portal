"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHourglass, faXmark } from "@fortawesome/free-solid-svg-icons";

export function StatusBadge({ status }: { status: string }) {
  if (status === "active") return null;
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
        <FontAwesomeIcon icon={faHourglass} className="text-[8px]" /> Pending
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-500 border border-red-200">
      <FontAwesomeIcon icon={faXmark} className="text-[8px]" /> Rejected
    </span>
  );
}
