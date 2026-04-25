"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ── Data ─────────────────────────────────────────────────────────────────────

const CLASSES = [
  { id: "C001", name: "Nursery", sections: ["A", "B"],       students: 45, teacher: "Mrs. Mita Saha",        subjects: ["English", "Bengali", "Math", "Drawing"] },
  { id: "C002", name: "Class 1", sections: ["A", "B", "C"], students: 68, teacher: "Mrs. Poulami Roy",       subjects: ["English", "Bengali", "Math", "EVS", "Drawing"] },
  { id: "C003", name: "Class 2", sections: ["A", "B", "C"], students: 72, teacher: "Mr. Ratan Das",          subjects: ["English", "Bengali", "Math", "EVS", "Drawing"] },
  { id: "C004", name: "Class 3", sections: ["A", "B", "C"], students: 65, teacher: "Mrs. Sudha Pal",         subjects: ["English", "Bengali", "Math", "Science", "Social", "Drawing"] },
  { id: "C005", name: "Class 4", sections: ["A", "B", "C"], students: 58, teacher: "Mr. Subir Bose",         subjects: ["English", "Bengali", "Math", "Science", "Social", "Sanskrit"] },
  { id: "C006", name: "Class 5", sections: ["A", "B"],       students: 54, teacher: "Mrs. Priya Ghosh",       subjects: ["English", "Bengali", "Math", "Science", "Social", "Sanskrit", "Computer"] },
  { id: "C007", name: "Class 6", sections: ["A", "B"],       students: 49, teacher: "Mr. Sanjay Banerjee",   subjects: ["English", "Bengali", "Math", "Science", "Social", "Sanskrit", "Computer"] },
];

const SUBJECT_COLORS: Record<string, string> = {
  English:  "bg-blue-50 text-blue-700 border-blue-200",
  Bengali:  "bg-orange-50 text-orange-700 border-orange-200",
  Math:     "bg-violet-50 text-violet-700 border-violet-200",
  EVS:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  Science:  "bg-cyan-50 text-cyan-700 border-cyan-200",
  Social:   "bg-amber-50 text-amber-700 border-amber-200",
  Drawing:  "bg-pink-50 text-pink-700 border-pink-200",
  Sanskrit: "bg-red-50 text-red-700 border-red-200",
  Computer: "bg-slate-100 text-slate-700 border-slate-200",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ClassesPage() {
  const totalSections = CLASSES.reduce((a, c) => a + c.sections.length, 0);
  const totalStudents = CLASSES.reduce((a, c) => a + c.students, 0);
  const allSubjects   = Array.from(new Set(CLASSES.flatMap((c) => c.subjects)));

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Classes & Subjects" description="Manage class groups, sections, and subject assignments" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-6">

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Classes",    value: CLASSES.length },
                { label: "Total Sections",   value: totalSections },
                { label: "Total Students",   value: totalStudents },
                { label: "Subjects Offered", value: allSubjects.length },
              ].map((st) => (
                <Card key={st.label} className="shadow-none border-slate-200">
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold text-slate-900">{st.value}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5">{st.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Header row */}
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-slate-800">All Classes</h2>
              <Button size="sm" className="bg-[#007BFF] hover:bg-[#0069d9] text-white text-[13px] h-8 gap-1.5">
                <FontAwesomeIcon icon={faPlus} className="text-[12px]" />
                Add Class
              </Button>
            </div>

            {/* Class cards grid */}
            <div className="grid grid-cols-3 gap-4">
              {CLASSES.map((cls) => (
                <Card key={cls.id} className="shadow-none border-slate-200 hover:border-[#007BFF]/40 hover:shadow-sm transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-[15px]">{cls.name}</CardTitle>
                        <CardDescription className="text-[12px] mt-0.5">{cls.teacher}</CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-[18px] font-bold text-slate-900">{cls.students}</p>
                        <p className="text-[11px] text-slate-400">students</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Sections */}
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-[11px] text-slate-500 font-medium">Sections:</span>
                      {cls.sections.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#007BFF] text-white text-[10px] font-bold"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    {/* Subject badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {cls.subjects.map((sub) => (
                        <span
                          key={sub}
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${SUBJECT_COLORS[sub] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
