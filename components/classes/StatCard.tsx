"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ icon, label, value }: { icon: IconDefinition; label: string; value: number | string }) {
  return (
    <Card className="shadow-none border-slate-200">
      <CardContent className="p-4 md:p-5 flex items-center gap-3 md:gap-4">
        <div className="w-9 h-9 rounded-lg bg-[#007BFF]/10 flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={icon} className="text-[14px] text-[#007BFF]" />
        </div>
        <div>
          <p className="text-lg md:text-xl font-bold text-slate-900 leading-none">{value}</p>
          <p className="text-[12px] text-slate-500 mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
