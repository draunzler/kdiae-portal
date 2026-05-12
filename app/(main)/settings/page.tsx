"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFloppyDisk, faShield, faBell, faGlobe, faLock,
  faUsers, faGraduationCap, faBuilding, faPlus, faPencil,
  faTrash, faSpinner, faCheck, faKey, faEye, faEyeSlash,
  faCheckCircle, faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  usersApi, settingsApi,
  type AppUser, type SchoolSettings, type AcademicSettings, type RoleEntry,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// ── RBAC permission matrix ────────────────────────────────────────────────────

const PERM_KEYS = ["students", "admissions", "classes", "fees", "exams", "attendance", "transport", "reports", "announcements", "settings"];

const ROLES_DEFAULTS: RoleEntry[] = [
  {
    role: "Admin",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    perms: { students: true, admissions: true, classes: true, fees: true, exams: true, attendance: true, transport: true, reports: true, announcements: true, settings: true },
  },
  {
    role: "Teacher",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    perms: { students: true, admissions: true, classes: true, fees: false, exams: true, attendance: true, transport: false, reports: false, announcements: true, settings: false },
  },
  {
    role: "Finance",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    perms: { students: true, admissions: false, classes: false, fees: true, exams: false, attendance: false, transport: true, reports: true, announcements: false, settings: false },
  },
];

const NOTIF_SETTINGS = [
  { key: "fee_due",       label: "Fee Due Reminders",           desc: "Send automatic reminders when fees are due."            },
  { key: "attendance",    label: "Daily Attendance Alerts",     desc: "Notify when a student is marked absent."                },
  { key: "exam_schedule", label: "Exam Schedule Notifications", desc: "Alert when exams are scheduled."                        },
  { key: "announcements", label: "Announcement Broadcasts",     desc: "Push announcements to portal users instantly."          },
  { key: "results",       label: "Results Published Alerts",    desc: "Notify when exam results are published."                },
  { key: "transport",     label: "Transport Delay Alerts",      desc: "Inform of any bus delays or route changes."             },
];

const ROLE_OPTIONS = ["admin", "teacher", "finance"] as const;

// ── Role badge ────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  admin:   "bg-blue-50 text-blue-700 border-blue-200",
  teacher: "bg-amber-50 text-amber-700 border-amber-200",
  finance: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge
      variant="outline"
      className={`capitalize text-[11px] font-semibold ${ROLE_COLORS[role] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}
    >
      {role}
    </Badge>
  );
}

// ── SaveStatus ────────────────────────────────────────────────────────────────

function SaveStatus({ status }: { status: "idle" | "saving" | "saved" | "error"; error?: string }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-slate-500">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[11px]" /> Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-emerald-600">
        <FontAwesomeIcon icon={faCheckCircle} className="text-[11px]" /> Saved
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-red-600">
        <FontAwesomeIcon icon={faExclamationTriangle} className="text-[11px]" /> Failed to save
      </span>
    );
  }
  return null;
}

// ── User Dialog ───────────────────────────────────────────────────────────────

interface UserFormState {
  name: string;
  email: string;
  role: string;
  password: string;
  is_active: boolean;
}

const BLANK_USER: UserFormState = { name: "", email: "", role: "teacher", password: "", is_active: true };

function UserDialog({
  open, onClose, initial, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: AppUser | null;
  onSaved: (u: AppUser) => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<UserFormState>({ ...BLANK_USER });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { name: initial.name, email: initial.email, role: initial.role, password: "", is_active: initial.is_active }
        : { ...BLANK_USER });
      setError("");
      setShowPw(false);
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!isEdit && !form.email.trim()) { setError("Email is required."); return; }
    if (!isEdit && !form.password) { setError("Password is required."); return; }
    setSaving(true); setError("");
    try {
      let saved: AppUser;
      if (isEdit) {
        const patch: Partial<{ name: string; role: string; password: string; is_active: boolean }> = {
          name: form.name, role: form.role, is_active: form.is_active,
        };
        if (form.password) patch.password = form.password;
        saved = await usersApi.update(initial!.id, patch);
      } else {
        saved = await usersApi.create({ name: form.name, email: form.email, role: form.role, password: form.password });
      }
      onSaved(saved);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!max-w-md w-[calc(100vw-1.5rem)] sm:w-full flex flex-col overflow-hidden p-0">
        <div className="px-6 pt-6 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold">{isEdit ? "Edit User" : "Add New User"}</DialogTitle>
          </DialogHeader>
        </div>
        <Separator />
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Full Name</label>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Anita Sen" className="h-8 text-[13px] bg-white border-slate-200" />
          </div>
          {!isEdit && (
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Email</label>
              <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="e.g. teacher@kdiae.in" type="email" className="h-8 text-[13px] bg-white border-slate-200" />
            </div>
          )}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1.5">Role</label>
            <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
              <SelectTrigger className="h-9 text-[13px] bg-white border-slate-200 capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize text-[13px]">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">
              {isEdit ? "New Password (leave blank to keep current)" : "Password"}
            </label>
            <div className="relative">
              <Input value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                type={showPw ? "text" : "password"} placeholder={isEdit ? "Leave blank to keep" : "Min. 8 characters"}
                className="h-8 text-[13px] bg-white border-slate-200 pr-9" />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} className="text-[12px]" />
              </button>
            </div>
          </div>
          {isEdit && (
            <div className="flex items-center gap-3">
              <Checkbox
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: !!v }))}
                className="data-[state=checked]:bg-[#007BFF] data-[state=checked]:border-[#007BFF]"
              />
              <label htmlFor="is_active" className="text-[13px] text-slate-700 cursor-pointer select-none">
                Account Active
              </label>
            </div>
          )}
        </div>
        <div className="p-4 pt-0 shrink-0 border-t border-slate-100">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5 mb-3">{error}</p>}
          <DialogFooter className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[13px]" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button size="sm" className="h-8 text-[13px] bg-[#007BFF] hover:bg-[#0069d9] text-white" onClick={handleSave} disabled={saving}>
              {saving
                ? <><FontAwesomeIcon icon={faSpinner} className="mr-1.5 animate-spin" />Saving…</>
                : <><FontAwesomeIcon icon={isEdit ? faCheck : faPlus} className="mr-1.5 text-[11px]" />{isEdit ? "Save Changes" : "Create User"}</>}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user: me } = useAuth();
  const isAdmin = me?.role === "admin";

  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    fee_due: true, attendance: true, exam_schedule: true, announcements: false, results: true, transport: false,
  });

  // ── School tab state ──
  const SCHOOL_BLANK: SchoolSettings = {
    school_name: "", address: "", phone: "", email: "", website: "", school_type: "", motto: "",
  };
  const [school, setSchool]               = useState<SchoolSettings>(SCHOOL_BLANK);
  const [schoolLoaded, setSchoolLoaded]   = useState(false);
  const [schoolStatus, setSchoolStatus]   = useState<"idle" | "saving" | "saved" | "error">("idle");

  const loadSchool = async () => {
    if (schoolLoaded) return;
    try {
      const data = await settingsApi.getSchool();
      setSchool(data);
      setSchoolLoaded(true);
    } catch { /* silently fall back to defaults */ }
  };

  const saveSchool = async () => {
    setSchoolStatus("saving");
    try {
      const updated = await settingsApi.updateSchool(school);
      setSchool(updated);
      setSchoolStatus("saved");
      setTimeout(() => setSchoolStatus("idle"), 3000);
    } catch {
      setSchoolStatus("error");
      setTimeout(() => setSchoolStatus("idle"), 4000);
    }
  };

  // ── Academic tab state ──
  const ACADEMIC_BLANK: AcademicSettings = {
    academic_year: "", current_term: "", term_start_date: "", term_end_date: "", next_session_start: "",
  };
  const [academic, setAcademic]               = useState<AcademicSettings>(ACADEMIC_BLANK);
  const [academicLoaded, setAcademicLoaded]   = useState(false);
  const [academicStatus, setAcademicStatus]   = useState<"idle" | "saving" | "saved" | "error">("idle");

  const loadAcademic = async () => {
    if (academicLoaded) return;
    try {
      const data = await settingsApi.getAcademic();
      setAcademic(data);
      setAcademicLoaded(true);
    } catch { /* silently fall back to defaults */ }
  };

  const saveAcademic = async () => {
    setAcademicStatus("saving");
    try {
      const updated = await settingsApi.updateAcademic(academic);
      setAcademic(updated);
      setAcademicStatus("saved");
      setTimeout(() => setAcademicStatus("idle"), 3000);
    } catch {
      setAcademicStatus("error");
      setTimeout(() => setAcademicStatus("idle"), 4000);
    }
  };

  // Load school settings eagerly on mount
  useEffect(() => { loadSchool(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Roles tab state ──
  const [rolesMatrix, setRolesMatrix]         = useState<RoleEntry[]>(ROLES_DEFAULTS);
  const [rolesLoaded, setRolesLoaded]         = useState(false);
  const [rolesStatus, setRolesStatus]         = useState<"idle" | "saving" | "saved" | "error">("idle");

  const loadRoles = async () => {
    if (rolesLoaded) return;
    try {
      const data = await settingsApi.getRoles();
      if (data.roles?.length) setRolesMatrix(data.roles);
      setRolesLoaded(true);
    } catch { /* fall back to defaults */ }
  };

  const saveRoles = async () => {
    setRolesStatus("saving");
    try {
      const data = await settingsApi.updateRoles({ roles: rolesMatrix });
      if (data.roles?.length) setRolesMatrix(data.roles);
      setRolesStatus("saved");
      setTimeout(() => setRolesStatus("idle"), 3000);
    } catch {
      setRolesStatus("error");
      setTimeout(() => setRolesStatus("idle"), 4000);
    }
  };

  const togglePerm = (roleIdx: number, perm: string) => {
    setRolesMatrix((prev) =>
      prev.map((r, i) =>
        i === roleIdx
          ? { ...r, perms: { ...r.perms, [perm]: !r.perms[perm] } }
          : r
      )
    );
  };

  // ── Users tab state ──
  const [users, setUsers]               = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showDialog, setShowDialog]     = useState(false);
  const [editTarget, setEditTarget]     = useState<AppUser | null>(null);

  const loadUsers = async () => {
    setUsersLoading(true);
    try { setUsers(await usersApi.list()); } finally { setUsersLoading(false); }
  };

  const handleDelete = async (u: AppUser) => {
    if (!confirm(`Delete user "${u.name}" (${u.email})? This cannot be undone.`)) return;
    await usersApi.delete(u.id);
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
  };

  const handleSaved = (saved: AppUser) => {
    setUsers((prev) => {
      const idx = prev.findIndex((x) => x.id === saved.id);
      return idx >= 0 ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev];
    });
  };

  return (
    <>
      <Tabs
        defaultValue="school"
        onValueChange={(v) => {
          if (v === "academic") loadAcademic();
          if (v === "roles") loadRoles();
          if (v === "users" && users.length === 0) loadUsers();
        }}
      >
        <TabsList className="bg-slate-100 h-8 p-0.5 flex-wrap gap-y-1">
          {[
            { v: "school",        label: "School"        },
            { v: "academic",      label: "Academic"      },
            { v: "roles",         label: "Roles"         },
            ...(isAdmin ? [{ v: "users", label: "Users" }] : []),
            { v: "notifications", label: "Notifications" },
            { v: "portal",        label: "Portal"        },
            { v: "security",      label: "Security"      },
          ].map((t) => (
            <TabsTrigger key={t.v} value={t.v}
              className="text-[12px] h-7 data-[state=active]:bg-white data-[state=active]:text-[#212529] data-[state=active]:shadow-none">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── School ── */}
        <TabsContent value="school" className="mt-4">
          <Card className="shadow-none border-slate-200 max-w-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faBuilding} className="text-[#007BFF] text-[13px]" />
                <CardTitle className="text-[14px]">School Information</CardTitle>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 grid grid-cols-2 gap-4">
              {[
                { label: "School Name",  key: "school_name" as const,  full: true },
                { label: "Address",      key: "address" as const,      full: true },
                { label: "Phone",        key: "phone" as const },
                { label: "Email",        key: "email" as const },
                { label: "Website",      key: "website" as const },
                { label: "School Type",  key: "school_type" as const },
                { label: "Motto",        key: "motto" as const,        full: true },
              ].map((f) => (
                <div key={f.key} className={f.full ? "col-span-2" : ""}>
                  <label className="text-[12px] font-medium text-slate-600 mb-1 block">{f.label}</label>
                  {!schoolLoaded ? (
                    <Skeleton className="h-8 w-full rounded" />
                  ) : (
                    <Input
                      value={school[f.key]}
                      onChange={(e) => setSchool((p) => ({ ...p, [f.key]: e.target.value }))}
                      className="bg-slate-50 border-slate-200 text-[13px] h-8"
                    />
                  )}
                </div>
              ))}
              <div className="col-span-2 flex items-center justify-end gap-3 pt-2">
                <SaveStatus status={schoolStatus} />
                <Button
                  size="sm"
                  className="bg-[#007BFF] hover:bg-[#0069d9] text-white h-8 text-[13px] gap-1.5"
                  onClick={saveSchool}
                  disabled={schoolStatus === "saving"}
                >
                  {schoolStatus === "saving"
                    ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin text-[11px]" /> Saving…</>
                    : <><FontAwesomeIcon icon={faFloppyDisk} className="text-[11px]" /> Save Changes</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Academic ── */}
        <TabsContent value="academic" className="mt-4">
          <Card className="shadow-none border-slate-200 max-w-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faGraduationCap} className="text-[#007BFF] text-[13px]" />
                <CardTitle className="text-[14px]">Academic Session</CardTitle>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 grid grid-cols-2 gap-4">
              {[
                { label: "Academic Year",      key: "academic_year" as const },
                { label: "Current Term",       key: "current_term" as const },
                { label: "Term Start Date",    key: "term_start_date" as const },
                { label: "Term End Date",      key: "term_end_date" as const },
                { label: "Next Session Start", key: "next_session_start" as const, full: true },
              ].map((f) => (
                <div key={f.key} className={(f as { key: string; full?: boolean }).full ? "col-span-2" : ""}>
                  <label className="text-[12px] font-medium text-slate-600 mb-1 block">{f.label}</label>
                  {!academicLoaded ? (
                    <Skeleton className="h-8 w-full rounded" />
                  ) : (
                    <Input
                      value={academic[f.key]}
                      onChange={(e) => setAcademic((p) => ({ ...p, [f.key]: e.target.value }))}
                      className="bg-slate-50 border-slate-200 text-[13px] h-8"
                    />
                  )}
                </div>
              ))}
              <div className="col-span-2 flex items-center justify-end gap-3 pt-2">
                <SaveStatus status={academicStatus} />
                <Button
                  size="sm"
                  className="bg-[#007BFF] hover:bg-[#0069d9] text-white h-8 text-[13px] gap-1.5"
                  onClick={saveAcademic}
                  disabled={academicStatus === "saving"}
                >
                  {academicStatus === "saving"
                    ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin text-[11px]" /> Saving…</>
                    : <><FontAwesomeIcon icon={faFloppyDisk} className="text-[11px]" /> Save Changes</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Roles ── */}
        <TabsContent value="roles" className="mt-4">
          <Card className="shadow-none border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} className="text-[#007BFF] text-[13px]" />
                <CardTitle className="text-[14px]">Role Permissions</CardTitle>
              </div>
              <p className="text-[12px] text-slate-500 mt-1">
                Click a cell to toggle access for Teacher and Finance roles. Admin permissions are fixed.
              </p>
            </CardHeader>
            <Separator />
            <CardContent className="pt-0 overflow-x-auto">
              <Table className="min-w-[560px]">
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-28">Role</TableHead>
                    {PERM_KEYS.map((k) => (
                      <TableHead key={k} className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 capitalize px-2">
                        <div className="flex justify-center">{k}</div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rolesMatrix.map((r, roleIdx) => {
                    const isLocked = r.role === "Admin";
                    return (
                      <TableRow key={r.role}>
                        <TableCell className="py-3">
                          <Badge variant="outline" className={`text-[11px] font-semibold ${r.color}`}>
                            {r.role}
                          </Badge>
                        </TableCell>
                        {PERM_KEYS.map((k) => (
                          <TableCell key={k} className="px-2 py-3">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={!!r.perms[k]}
                                onCheckedChange={() => !isLocked && togglePerm(roleIdx, k)}
                                disabled={isLocked}
                                className="data-[state=checked]:bg-[#007BFF] data-[state=checked]:border-[#007BFF] cursor-pointer"
                              />
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex items-center justify-end gap-3 pt-4 pb-1">
                <SaveStatus status={rolesStatus} />
                <Button
                  size="sm"
                  className="bg-[#007BFF] hover:bg-[#0069d9] text-white h-8 text-[13px] gap-1.5"
                  onClick={saveRoles}
                  disabled={rolesStatus === "saving"}
                >
                  {rolesStatus === "saving"
                    ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin text-[11px]" /> Saving…</>
                    : <><FontAwesomeIcon icon={faFloppyDisk} className="text-[11px]" /> Save Changes</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Users (admin only) ── */}
        {isAdmin && (
          <TabsContent value="users" className="mt-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold text-slate-800">System Users</h2>
                  <p className="text-[12px] text-slate-500 mt-0.5">Manage login accounts for Admin, Teacher and Finance staff.</p>
                </div>
                <Button size="sm" className="bg-[#007BFF] hover:bg-[#0069d9] text-white text-[13px] h-8 gap-1.5"
                  onClick={() => { setEditTarget(null); setShowDialog(true); }}>
                  <FontAwesomeIcon icon={faPlus} className="text-[11px]" /> New User
                </Button>
              </div>

              <Card className="shadow-none border-slate-200 py-0">
                <CardContent className="p-0">
                  {usersLoading ? (
                    <div className="flex flex-col divide-y divide-slate-100">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex-1 flex flex-col gap-1.5">
                            <Skeleton className="h-3.5 w-40" />
                            <Skeleton className="h-3 w-56" />
                          </div>
                          <Skeleton className="h-5 w-16 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                      <FontAwesomeIcon icon={faUsers} className="text-2xl" />
                      <p className="text-[13px]">No users found.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-[#FFCA2B] flex items-center justify-center text-[#212529] text-[10px] font-bold shrink-0">
                            {u.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-slate-800 leading-tight truncate flex items-center gap-2">
                              {u.name}
                              {!u.is_active && (
                                <Badge variant="outline" className="text-[10px] font-semibold text-slate-400 bg-slate-100 border-slate-200">
                                  Disabled
                                </Badge>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{u.email}</p>
                          </div>
                          <RoleBadge role={u.role} />
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[#007BFF] hover:bg-blue-50"
                              onClick={() => { setEditTarget(u); setShowDialog(true); }}>
                              <FontAwesomeIcon icon={faPencil} className="text-[11px]" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50"
                              onClick={() => handleDelete(u)}
                              disabled={u.id === me?.id}>
                              <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* ── Notifications ── */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="shadow-none border-slate-200 max-w-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faBell} className="text-[#007BFF] text-[13px]" />
                <CardTitle className="text-[14px]">Notification Settings</CardTitle>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-2 flex flex-col divide-y divide-slate-100">
              {NOTIF_SETTINGS.map((n) => (
                <div key={n.key} className="flex items-start justify-between gap-4 py-3">
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-slate-800">{n.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{n.desc}</p>
                  </div>
                  <Checkbox
                    id={`notif-${n.key}`}
                    checked={notifs[n.key]}
                    onCheckedChange={(v) => setNotifs((prev) => ({ ...prev, [n.key]: !!v }))}
                    className="mt-0.5 data-[state=checked]:bg-[#007BFF] data-[state=checked]:border-[#007BFF]"
                  />
                </div>
              ))}
              <div className="pt-3 flex justify-end">
                <Button size="sm" className="bg-[#007BFF] hover:bg-[#0069d9] text-white h-8 text-[13px] gap-1.5">
                  <FontAwesomeIcon icon={faFloppyDisk} className="text-[11px]" /> Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Portal ── */}
        <TabsContent value="portal" className="mt-4">
          <Card className="shadow-none border-slate-200 max-w-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faGlobe} className="text-[#007BFF] text-[13px]" />
                <CardTitle className="text-[14px]">Portal Settings</CardTitle>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 flex flex-col gap-4">
              {[
                { label: "Student Portal URL",        val: "sms.kdiae.in"   },
                { label: "Teacher Portal URL",        val: "tms.kdiae.in"   },
                { label: "Session Timeout (minutes)", val: "30"             },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-[12px] font-medium text-slate-600 mb-1 block">{f.label}</label>
                  <Input defaultValue={f.val} className="bg-slate-50 border-slate-200 text-[13px] h-8" />
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <Button size="sm" className="bg-[#007BFF] hover:bg-[#0069d9] text-white h-8 text-[13px] gap-1.5">
                  <FontAwesomeIcon icon={faFloppyDisk} className="text-[11px]" /> Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security ── */}
        <TabsContent value="security" className="mt-4">
          <Card className="shadow-none border-slate-200 max-w-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faShield} className="text-[#007BFF] text-[13px]" />
                <CardTitle className="text-[14px]">Security Settings</CardTitle>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 flex flex-col gap-4">
              {[
                { label: "Minimum Password Length",            val: "8"  },
                { label: "Password Expiry (days)",             val: "90" },
                { label: "Max Login Attempts",                 val: "5"  },
                { label: "Account Lockout Duration (minutes)", val: "15" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-[12px] font-medium text-slate-600 mb-1 block">{f.label}</label>
                  <Input defaultValue={f.val} className="bg-slate-50 border-slate-200 text-[13px] h-8" />
                </div>
              ))}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faLock} className="text-amber-600 text-[11px]" />
                  <p className="text-[12px] font-medium text-amber-700">Two-Factor Authentication</p>
                </div>
                <p className="text-[11px] text-amber-600 mt-1">2FA is currently disabled. Enable it for admin accounts to improve security.</p>
                <Button variant="outline" size="sm" className="h-7 text-[12px] mt-2 border-amber-300 text-amber-700 hover:bg-amber-100">
                  <FontAwesomeIcon icon={faKey} className="mr-1.5 text-[10px]" />Enable 2FA
                </Button>
              </div>
              <div className="flex justify-end">
                <Button size="sm" className="bg-[#007BFF] hover:bg-[#0069d9] text-white h-8 text-[13px] gap-1.5">
                  <FontAwesomeIcon icon={faFloppyDisk} className="text-[11px]" /> Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UserDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        initial={editTarget}
        onSaved={handleSaved}
      />
    </>
  );
}
