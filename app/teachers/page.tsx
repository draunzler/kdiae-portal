"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faPlus, faEye, faPenToSquare, faTrash, faXmark, faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

// ── Data ─────────────────────────────────────────────────────────────────────

const TEACHERS = [
  { id: "T001", name: "Mrs. Priya Ghosh",       subject: "Mathematics",       class: "Class 5 & 6",  salary: 42000, workload: 28, status: "Active",   phone: "98310-11111", email: "priya.ghosh@kdiae.edu.in",       joined: "Jun 2019" },
  { id: "T002", name: "Mr. Sanjay Banerjee",    subject: "English",           class: "Class 3 & 4",  salary: 38000, workload: 24, status: "Active",   phone: "98310-22222", email: "sanjay.banerjee@kdiae.edu.in",   joined: "Mar 2017" },
  { id: "T003", name: "Mrs. Rekha Das",         subject: "Science",           class: "Class 5",      salary: 35000, workload: 22, status: "Active",   phone: "98310-33333", email: "rekha.das@kdiae.edu.in",         joined: "Jul 2020" },
  { id: "T004", name: "Mr. Amit Roy",           subject: "Social Studies",    class: "Class 4 & 6",  salary: 33000, workload: 20, status: "On Leave", phone: "98310-44444", email: "amit.roy@kdiae.edu.in",          joined: "Jan 2018" },
  { id: "T005", name: "Mrs. Sunita Mukherjee",  subject: "Bengali",           class: "Class 1–4",    salary: 32000, workload: 26, status: "Active",   phone: "98310-55555", email: "sunita.mukherjee@kdiae.edu.in",  joined: "Aug 2016" },
  { id: "T006", name: "Mr. Debasish Pal",       subject: "Physical Education",class: "All Classes",  salary: 30000, workload: 30, status: "Active",   phone: "98310-66666", email: "debasish.pal@kdiae.edu.in",      joined: "Apr 2021" },
  { id: "T007", name: "Mrs. Kavita Sharma",     subject: "Sanskrit",          class: "Class 5 & 6",  salary: 31000, workload: 18, status: "Active",   phone: "98310-77777", email: "kavita.sharma@kdiae.edu.in",     joined: "Nov 2019" },
  { id: "T008", name: "Mr. Subhash Dey",        subject: "Computer Science",  class: "Class 3–6",    salary: 36000, workload: 20, status: "Inactive", phone: "98310-88888", email: "subhash.dey@kdiae.edu.in",       joined: "Feb 2022" },
];

const statusCls: Record<string, string> = {
  Active:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  "On Leave":"bg-amber-50 text-amber-700 border-amber-200",
  Inactive:  "bg-red-50 text-red-700 border-red-200",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selected, setSelected] = useState<typeof TEACHERS[0] | null>(null);

  const filtered = TEACHERS.filter((t) => {
    const ms = t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase());
    const mst = filterStatus === "All" || t.status === filterStatus;
    return ms && mst;
  });

  const totalPayroll = TEACHERS.filter((t) => t.status === "Active").reduce((a, t) => a + t.salary, 0);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Teachers" description="Manage teaching staff and assignments" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-6">

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Teachers",       value: TEACHERS.length },
                { label: "Active",               value: TEACHERS.filter((t) => t.status === "Active").length },
                { label: "On Leave / Inactive",  value: TEACHERS.filter((t) => t.status !== "Active").length },
                { label: "Monthly Payroll",      value: `₹${(totalPayroll / 100000).toFixed(2)}L` },
              ].map((st) => (
                <Card key={st.label} className="shadow-none border-slate-200">
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold text-slate-900">{st.value}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5">{st.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Table card */}
            <Card className="shadow-none border-slate-200">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[14px] font-semibold">All Teachers</CardTitle>
                  <Button size="sm" className="bg-[#007BFF] hover:bg-[#0069d9] text-white text-[13px] h-8 gap-1.5">
                    <FontAwesomeIcon icon={faPlus} className="text-[12px]" />
                    Add Teacher
                  </Button>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="relative flex-1 max-w-[260px]">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]" />
                    <Input
                      placeholder="Search by name or subject…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 bg-slate-50 border-slate-200 text-[13px] h-8"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px] bg-slate-50 border-slate-200 text-[13px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      {["ID", "Name", "Subject", "Class", "Salary", "Workload", "Status", "Actions"].map((h) => (
                        <TableHead
                          key={h}
                          className={`text-[11px] font-semibold uppercase text-slate-500 ${h === "ID" ? "pl-6" : ""} ${h === "Actions" ? "pr-6" : ""}`}
                        >
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t) => (
                      <TableRow key={t.id} className="hover:bg-slate-50 border-slate-100">
                        <TableCell className="text-[12px] text-slate-400 font-mono pl-6">{t.id}</TableCell>
                        <TableCell className="text-[13px] font-medium text-slate-900">{t.name}</TableCell>
                        <TableCell className="text-[13px] text-slate-600">{t.subject}</TableCell>
                        <TableCell className="text-[13px] text-slate-600">{t.class}</TableCell>
                        <TableCell className="text-[13px] text-slate-700 font-medium">₹{t.salary.toLocaleString()}</TableCell>
                        <TableCell className="text-[13px] text-slate-600">{t.workload} periods</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${statusCls[t.status]}`}>
                            {t.status}
                          </span>
                        </TableCell>
                        <TableCell className="pr-6">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[#007BFF]" onClick={() => setSelected(t)}>
                              <FontAwesomeIcon icon={faEye} className="text-[12px]" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[#007BFF]">
                              <FontAwesomeIcon icon={faPenToSquare} className="text-[12px]" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600">
                              <FontAwesomeIcon icon={faTrash} className="text-[12px]" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

          </div>
        </main>
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
          onClick={() => setSelected(null)}
        >
          <Card className="w-[460px] shadow-xl border-slate-200" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#007BFF] flex items-center justify-center">
                    <FontAwesomeIcon icon={faGraduationCap} className="text-white text-[14px]" />
                  </div>
                  <div>
                    <CardTitle className="text-[15px]">{selected.name}</CardTitle>
                    <p className="text-[12px] text-slate-500">{selected.id} · {selected.subject}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(null)}>
                  <FontAwesomeIcon icon={faXmark} className="text-[13px]" />
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 grid grid-cols-2 gap-3">
              {[
                ["Class",    selected.class],
                ["Salary",   `₹${selected.salary.toLocaleString()}`],
                ["Workload", `${selected.workload} periods/wk`],
                ["Status",   selected.status],
                ["Phone",    selected.phone],
                ["Email",    selected.email],
                ["Joined",   selected.joined],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">{label}</p>
                  <p className="text-[13px] text-slate-800 mt-0.5">{val}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
