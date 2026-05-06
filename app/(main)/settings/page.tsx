"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFloppyDisk, faShield, faBell, faGlobe, faLock,
  faUsers, faGraduationCap, faBuilding, faPlus, faPencil,
  faTrash, faSpinner, faCheck, faKey, faEye, faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { usersApi, type AppUser } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// ── RBAC permission matrix ────────────────────────────────────────────────────

const PERM_KEYS = ["students", "admissions", "classes", "fees", "exams", "attendance", "transport", "reports", "announcements", "settings"];

const ROLES_MATRIX = [
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
    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border capitalize ${ROLE_COLORS[role] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {role}
    </span>
  );
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
            <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Role</label>
            <div className="flex gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button key={r} onClick={() => setForm((p) => ({ ...p, role: r }))}
                  className={`flex-1 py-1.5 rounded-md text-[12px] font-semibold border-2 capitalize transition-all
                    ${form.role === r ? "border-[#007BFF] bg-[#007BFF]/10 text-[#007BFF]" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                  {r}
                </button>
              ))}
            </div>
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
              <button onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${form.is_active ? "bg-[#007BFF]" : "bg-slate-200"}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0"}`} />
              </button>
              <span className="text-[12px] text-slate-700">Account Active</span>
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
      <Tabs defaultValue="school">
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
                { label: "School Name",  val: "KD Institute of Advance Education",                 full: true },
                { label: "Address",      val: "Ilsoba, Depara, 13 Pandua-Kalna Road, Hooghly-712146", full: true },
                { label: "Phone",        val: "+91 74328 00090" },
                { label: "Email",        val: "info@kdiae.in"   },
                { label: "Website",      val: "www.kdiae.in"    },
                { label: "School Type",  val: "CBSE Co-Education" },
                { label: "Motto",        val: "Knowledge, Integrity, Excellence", full: true },
              ].map((f) => (
                <div key={f.label} className={f.full ? "col-span-2" : ""}>
                  <label className="text-[12px] font-medium text-slate-600 mb-1 block">{f.label}</label>
                  <Input defaultValue={f.val} className="bg-slate-50 border-slate-200 text-[13px] h-8" />
                </div>
              ))}
              <div className="col-span-2 flex justify-end pt-2">
                <Button size="sm" className="bg-[#007BFF] hover:bg-[#0069d9] text-white h-8 text-[13px] gap-1.5">
                  <FontAwesomeIcon icon={faFloppyDisk} className="text-[11px]" /> Save Changes
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
                { label: "Academic Year",      val: "2026–2027"    },
                { label: "Current Term",       val: "Half-yearly"  },
                { label: "Term Start Date",    val: "Apr 1, 2026"  },
                { label: "Term End Date",      val: "Aug 31, 2026" },
                { label: "Next Session Start", val: "Sep 16, 2026", full: true },
              ].map((f) => (
                <div key={f.label} className={(f as { label: string; val: string; full?: boolean }).full ? "col-span-2" : ""}>
                  <label className="text-[12px] font-medium text-slate-600 mb-1 block">{f.label}</label>
                  <Input defaultValue={f.val} className="bg-slate-50 border-slate-200 text-[13px] h-8" />
                </div>
              ))}
              <div className="col-span-2 flex justify-end pt-2">
                <Button size="sm" className="bg-[#007BFF] hover:bg-[#0069d9] text-white h-8 text-[13px] gap-1.5">
                  <FontAwesomeIcon icon={faFloppyDisk} className="text-[11px]" /> Save Changes
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
                The three system roles and the pages each role can access. Only admins can manage users.
              </p>
            </CardHeader>
            <Separator />
            <CardContent className="pt-0 overflow-x-auto">
              <table className="w-full min-w-[540px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-2.5 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 bg-slate-50 w-28">Role</th>
                    {PERM_KEYS.map((k) => (
                      <th key={k} className="py-2.5 px-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 bg-slate-50 capitalize">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROLES_MATRIX.map((r) => (
                    <tr key={r.role} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${r.color}`}>{r.role}</span>
                      </td>
                      {PERM_KEYS.map((k) => (
                        <td key={k} className="py-2.5 px-1 text-center">
                          {(r.perms as Record<string, boolean>)[k]
                            ? <span className="inline-block w-4 h-4 bg-[#007BFF] rounded-sm" title="Allowed" />
                            : <span className="inline-block w-4 h-4 bg-slate-200 rounded-sm" title="Denied" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Users (admin only) ── */}
        {isAdmin && (
          <TabsContent value="users" className="mt-4" onAnimationStart={() => users.length === 0 && loadUsers()}>
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

              <Card className="shadow-none border-slate-200">
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
                                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">Disabled</span>
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
                <div key={n.key} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[13px] font-medium text-slate-800">{n.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{n.desc}</p>
                  </div>
                  <button onClick={() => setNotifs((prev) => ({ ...prev, [n.key]: !prev[n.key] }))}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${notifs[n.key] ? "bg-[#007BFF]" : "bg-slate-200"}`}>
                    <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${notifs[n.key] ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
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
