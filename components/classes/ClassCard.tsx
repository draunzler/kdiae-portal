"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChalkboardTeacher, faPencil, faTrash, faXmark, faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type Class } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";

export function ClassCard({ cls, onEdit, onDelete, onApprove, onReject, isAdmin }: {
  cls: Class; onEdit: (c: Class) => void; onDelete: (id: string) => void;
  onApprove: (id: string) => void; onReject: (id: string) => void; isAdmin: boolean;
}) {
  const isPending = cls.status === "pending";
  return (
    <Card className={`shadow-none border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-150 ${isPending ? "border-amber-200 bg-amber-50/30" : ""}`}>
      <CardContent className="p-4 md:p-0">
        <div className="flex flex-col md:flex-row md:items-stretch">
          <div className="flex flex-col justify-center md:px-5 md:py-4 md:min-w-[170px] md:border-r md:border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[15px] font-bold text-slate-900">{cls.name}</p>
              <StatusBadge status={cls.status} />
            </div>
            {cls.class_code && <p className="text-[10px] font-mono text-slate-400 mt-0.5">{cls.class_code}</p>}
            {isPending && cls.submitted_by && <p className="text-[10px] text-slate-400 mt-0.5">by {cls.submitted_by}</p>}
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <FontAwesomeIcon icon={faChalkboardTeacher} className="text-[10px]" />
              {cls.teacher || "—"}
            </p>
          </div>

          <div className="md:flex-1 md:px-5 md:py-4 flex flex-col justify-center gap-2.5 mt-3 md:mt-0">
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase w-14 shrink-0 mt-0.5">Sections</span>
              <div className="flex gap-1 flex-wrap items-center">
                {cls.sections.map((s) => (
                  <span key={s} className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold bg-[#007BFF]/10 text-[#007BFF]">{s}</span>
                ))}
                <span className="text-[11px] text-slate-400 ml-1">{cls.sections.length} section{cls.sections.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase w-14 shrink-0 mt-0.5">Subjects</span>
              <div className="flex flex-wrap gap-1">
                {cls.subjects.map((sub) => (
                  <span key={sub} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-slate-50 text-slate-600 border-slate-200">{sub}</span>
                ))}
                {cls.subjects.length === 0 && <span className="text-[11px] text-slate-400 italic">None assigned</span>}
              </div>
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center md:px-5 md:py-4 md:border-l md:border-slate-100 gap-3 shrink-0 mt-3 pt-3 border-t border-slate-100 md:mt-0 md:pt-0 md:border-t-0">
            <div className="text-left md:text-right">
              <p className="text-[18px] font-bold text-slate-900 leading-none">{cls.student_count}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">students</p>
            </div>
            <div className="flex items-center gap-1">
              {isAdmin && isPending && (
                <>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-green-600 hover:bg-green-50" title="Approve" onClick={() => onApprove(cls.id)}>
                    <FontAwesomeIcon icon={faCircleCheck} className="text-[11px]" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50" title="Reject" onClick={() => onReject(cls.id)}>
                    <FontAwesomeIcon icon={faXmark} className="text-[11px]" />
                  </Button>
                </>
              )}
              {(isAdmin || !isPending) && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[#007BFF] hover:bg-blue-50" onClick={() => onEdit(cls)}>
                  <FontAwesomeIcon icon={faPencil} className="text-[11px]" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => onDelete(cls.id)}>
                <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
