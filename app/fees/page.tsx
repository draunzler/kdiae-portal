"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

// ── Data ─────────────────────────────────────────────────────────────────────

const FEE_STRUCTURES = [
  { class: "Nursery – Class 2", tuition: 8000,  uniform: 3500, books: 4000, transport: 4000, total: 19500 },
  { class: "Class 3 – Class 4", tuition: 9000,  uniform: 3500, books: 4500, transport: 4000, total: 21000 },
  { class: "Class 5",           tuition: 10000, uniform: 4000, books: 5000, transport: 4500, total: 23500 },
  { class: "Class 6",           tuition: 11000, uniform: 4000, books: 5500, transport: 5000, total: 27000 },
];

const PAYMENTS = [
  { id: "P001", student: "Priya Chatterjee", class: "Class 5", amount: 23500, date: "Apr 3, 2025",  method: "UPI",  status: "Paid",    receipt: "REC-001" },
  { id: "P002", student: "Arjun Mukherjee",  class: "Class 6", amount: 27000, date: "Apr 5, 2025",  method: "NEFT", status: "Paid",    receipt: "REC-002" },
  { id: "P003", student: "Sneha Banerjee",   class: "Class 4", amount: 10500, date: "Apr 7, 2025",  method: "Cash", status: "Partial", receipt: "REC-003" },
  { id: "P004", student: "Rohan Das",        class: "Class 3", amount: 0,     date: "—",            method: "—",    status: "Unpaid",  receipt: "—"       },
  { id: "P005", student: "Tanya Roy",        class: "Class 5", amount: 23500, date: "Apr 2, 2025",  method: "UPI",  status: "Paid",    receipt: "REC-004" },
  { id: "P006", student: "Akash Ghosh",      class: "Class 2", amount: 19500, date: "Apr 8, 2025",  method: "Cash", status: "Paid",    receipt: "REC-005" },
  { id: "P007", student: "Ritika Sengupta",  class: "Class 6", amount: 13500, date: "Apr 10, 2025", method: "UPI",  status: "Partial", receipt: "REC-006" },
  { id: "P008", student: "Ananya Pal",       class: "Class 4", amount: 0,     date: "—",            method: "—",    status: "Unpaid",  receipt: "—"       },
];

const monthlyRevenue = [
  { month: "Sep", collected: 120000, expected: 155000 },
  { month: "Oct", collected: 110000, expected: 155000 },
  { month: "Nov", collected: 135000, expected: 155000 },
  { month: "Dec", collected: 65000,  expected: 155000 },
  { month: "Jan", collected: 140000, expected: 155000 },
  { month: "Feb", collected: 148000, expected: 155000 },
  { month: "Mar", collected: 155000, expected: 155000 },
  { month: "Apr", collected: 128000, expected: 155000 },
];

const revenueConfig: ChartConfig = {
  expected:  { label: "Target",    color: "#e2e8f0" },
  collected: { label: "Collected", color: "#007BFF" },
};

const statusCls: Record<string, string> = {
  Paid:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  Partial: "bg-amber-50 text-amber-700 border-amber-200",
  Unpaid:  "bg-red-50 text-red-700 border-red-200",
};

const methodCls: Record<string, string> = {
  UPI:  "bg-violet-50 text-violet-700 border-violet-200",
  NEFT: "bg-blue-50 text-blue-700 border-blue-200",
  Cash: "bg-slate-100 text-slate-700 border-slate-200",
  "—":  "bg-slate-50 text-slate-400 border-slate-100",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FeesPage() {
  const [tab, setTab] = useState("payments");

  const paid    = PAYMENTS.filter((p) => p.status === "Paid");
  const partial = PAYMENTS.filter((p) => p.status === "Partial");
  const unpaid  = PAYMENTS.filter((p) => p.status === "Unpaid");
  const totalCollected = PAYMENTS.reduce((a, p) => a + p.amount, 0);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Fees & Finance" description="Fee collection, structures, and revenue overview" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-6">

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Collected", value: `₹${(totalCollected / 1000).toFixed(1)}K` },
                { label: "Fully Paid",      value: paid.length },
                { label: "Partial",         value: partial.length },
                { label: "Overdue",         value: unpaid.length },
              ].map((st) => (
                <Card key={st.label} className="shadow-none border-slate-200">
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold text-slate-900">{st.value}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5">{st.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabs */}
            <Tabs value={tab} onValueChange={setTab}>
              <div className="flex items-center justify-between">
                <TabsList className="bg-slate-100 h-8">
                  <TabsTrigger value="payments"  className="text-[12px] h-6">Payments</TabsTrigger>
                  <TabsTrigger value="structure" className="text-[12px] h-6">Fee Structure</TabsTrigger>
                  <TabsTrigger value="revenue"   className="text-[12px] h-6">Revenue</TabsTrigger>
                </TabsList>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-[13px] border-slate-200 text-slate-600 hover:text-slate-900">
                  <FontAwesomeIcon icon={faDownload} className="text-[12px]" />
                  Export
                </Button>
              </div>

              {/* Payments tab */}
              <TabsContent value="payments" className="mt-4">
                <Card className="shadow-none border-slate-200 pt-0">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          {["ID", "Student", "Class", "Amount", "Date", "Method", "Status", "Receipt"].map((h) => (
                            <TableHead
                              key={h}
                              className={`text-[11px] font-semibold uppercase text-slate-500 ${h === "ID" ? "pl-6" : ""} ${h === "Receipt" ? "pr-6" : ""}`}
                            >
                              {h}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {PAYMENTS.map((p) => (
                          <TableRow key={p.id} className="hover:bg-slate-50 border-slate-100">
                            <TableCell className="text-[12px] text-slate-400 font-mono pl-6">{p.id}</TableCell>
                            <TableCell className="text-[13px] font-medium text-slate-900">{p.student}</TableCell>
                            <TableCell className="text-[13px] text-slate-600">{p.class}</TableCell>
                            <TableCell className="text-[13px] font-medium text-slate-700">
                              {p.amount > 0 ? `₹${p.amount.toLocaleString()}` : "—"}
                            </TableCell>
                            <TableCell className="text-[13px] text-slate-500">{p.date}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${methodCls[p.method]}`}>
                                {p.method}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${statusCls[p.status]}`}>
                                {p.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-[12px] text-slate-500 font-mono pr-6">{p.receipt}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Fee Structure tab */}
              <TabsContent value="structure" className="mt-4">
                <Card className="shadow-none border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[14px] font-semibold">Annual Fee Structure 2024–25</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          {["Class Group", "Tuition", "Uniform", "Books", "Transport", "Total"].map((h) => (
                            <TableHead
                              key={h}
                              className={`text-[11px] font-semibold uppercase text-slate-500 ${h === "Class Group" ? "pl-6" : ""} ${h === "Total" ? "pr-6" : ""}`}
                            >
                              {h}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {FEE_STRUCTURES.map((f) => (
                          <TableRow key={f.class} className="hover:bg-slate-50 border-slate-100">
                            <TableCell className="text-[13px] font-medium text-slate-900 pl-6">{f.class}</TableCell>
                            <TableCell className="text-[13px] text-slate-600">₹{f.tuition.toLocaleString()}</TableCell>
                            <TableCell className="text-[13px] text-slate-600">₹{f.uniform.toLocaleString()}</TableCell>
                            <TableCell className="text-[13px] text-slate-600">₹{f.books.toLocaleString()}</TableCell>
                            <TableCell className="text-[13px] text-slate-600">₹{f.transport.toLocaleString()}</TableCell>
                            <TableCell className="text-[13px] font-bold text-[#007BFF] pr-6">₹{f.total.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Revenue tab */}
              <TabsContent value="revenue" className="mt-4">
                <Card className="shadow-none border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[14px] font-semibold">Monthly Revenue vs Target</CardTitle>
                    <CardDescription className="text-[12px]">Fee collection performance this session</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={revenueConfig} className="h-[280px] w-full">
                      <BarChart data={monthlyRevenue} margin={{ left: 0, right: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickMargin={8} />
                        <YAxis tickFormatter={(v) => `₹${v / 1000}K`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(v) => [`₹${Number(v).toLocaleString()}`]}
                            />
                          }
                        />
                        <Bar dataKey="expected"  name="Target"    fill="var(--color-expected)"  radius={[3, 3, 0, 0]} />
                        <Bar dataKey="collected" name="Collected" fill="var(--color-collected)" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

          </div>
        </main>
      </div>
    </div>
  );
}
