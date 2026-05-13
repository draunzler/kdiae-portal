"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { type TransportStudent } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";

interface Props {
  students: TransportStudent[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (s: TransportStudent) => void;
  onDelete: (s: TransportStudent) => void;
}

export function StudentsTab({ students, loading, onAdd, onEdit, onDelete }: Props) {
  return (
    <Card className="shadow-none border-slate-200">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[14px] font-semibold">Students Using Transport</CardTitle>
          <Button
            size="sm"
            className="bg-[#007BFF] hover:bg-[#0069d9] text-white text-[13px] h-8 gap-1.5"
            onClick={onAdd}
          >
            <FontAwesomeIcon icon={faPlus} className="text-[12px]" />
            Add Student
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        {loading ? (
          <div className="px-6 pb-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={`student-skel-${i}`} className="h-10 w-full" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="p-6 text-[12px] text-slate-500">No students assigned to transport</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                {["Student", "Class", "Status", ""].map((h) => (
                  <TableHead
                    key={h}
                    className={`text-[11px] font-semibold uppercase text-slate-500 ${h === "Student" ? "pl-6" : ""} ${h === "" ? "pr-4" : ""}`}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id} className="hover:bg-slate-50 border-slate-100">
                  <TableCell className="text-[13px] font-medium text-slate-900 pl-6">{s.name}</TableCell>
                  <TableCell className="text-[13px] text-slate-600">{s.class_name}</TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-[#007BFF] hover:bg-blue-50"
                        onClick={() => onEdit(s)}
                      >
                        <FontAwesomeIcon icon={faPencil} className="text-[11px]" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50"
                        onClick={() => onDelete(s)}
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
