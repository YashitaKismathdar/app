import { useEffect, useMemo, useState } from "react";
import { PageHeader, StatCard, StatusPill, EmptyState } from "@/components/module/ModulePrimitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, UserPlus, Building2, CalendarDays, Award } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";

function initials(name) {
  return (name || "?").split(" ").map(s => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function Directory() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "Employee", designation: "", department: "", phone: "" });
  const [tempPw, setTempPw] = useState(null);

  async function load() {
    const { data } = await api.get("/employees");
    setRows(data);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const t = q.toLowerCase();
    return rows.filter(r => (r.name + r.email + (r.designation || "") + (r.department || "")).toLowerCase().includes(t));
  }, [rows, q]);

  async function invite() {
    try {
      const { data } = await api.post("/employees/invite", form);
      setTempPw({ email: form.email, password: data.temp_password });
      toast.success("Teammate invited");
      setForm({ email: "", name: "", role: "Employee", designation: "", department: "", phone: "" });
      load();
    } catch (e) { toast.error(formatApiError(e)); }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between mb-4">
        <Input placeholder="Search by name, email, role, department…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" data-testid="employee-search" />
        <Button onClick={() => setOpen(true)} data-testid="employee-invite-btn"><UserPlus className="h-4 w-4 mr-1.5" /> Invite teammate</Button>
      </div>

      <Card className="border-border">
        {filtered.length === 0 ? <EmptyState icon={Users} title="No employees match" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8"><AvatarImage src={u.photo || undefined} /><AvatarFallback className="bg-wavygo-100 text-wavygo-800 text-[10px] font-semibold">{initials(u.name)}</AvatarFallback></Avatar>
                      <div><div className="text-[13.5px] font-medium">{u.name}</div><div className="text-[11.5px] text-muted-foreground">{u.email}</div></div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                  <TableCell className="text-[13px]">{u.designation || "—"}</TableCell>
                  <TableCell className="text-[13px]">{u.department || "—"}</TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">{u.phone || "—"}</TableCell>
                  <TableCell><StatusPill status={u.online ? "active" : "paused"} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Invite teammate</DialogTitle>
            <DialogDescription>They'll be created with a temporary password. Share it securely.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))} data-testid="invite-name-input" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm(s => ({ ...s, email: e.target.value }))} data-testid="invite-email-input" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm(s => ({ ...s, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Founder","Admin","Manager","Employee","Intern"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm(s => ({ ...s, phone: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Designation</Label><Input value={form.designation} onChange={(e) => setForm(s => ({ ...s, designation: e.target.value }))} /></div>
              <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm(s => ({ ...s, department: e.target.value }))} /></div>
            </div>
            {tempPw && (
              <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-[12.5px]">
                Temporary password for <span className="font-medium">{tempPw.email}</span>: <span className="font-mono font-semibold">{tempPw.password}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setTempPw(null); }}>Close</Button>
            <Button onClick={invite} data-testid="invite-submit-btn">Send invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Attendance() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employee_id: "", date: new Date().toISOString().slice(0, 10), status: "present" });

  async function load() {
    const [{ data: att }, { data: emps }] = await Promise.all([
      api.get("/employees/attendance/records"),
      api.get("/employees"),
    ]);
    // enrich names
    const nameMap = Object.fromEntries(emps.map(e => [e.id, e.name]));
    setRows(att.map(a => ({ ...a, employee_name: nameMap[a.employee_id] || "—" })));
    setUsers(emps);
  }
  useEffect(() => { load(); }, []);

  async function submit() {
    try { await api.post("/employees/attendance/records", form); toast.success("Attendance recorded"); setOpen(false); load(); }
    catch (e) { toast.error(formatApiError(e)); }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setOpen(true)} data-testid="attendance-mark-btn"><Plus className="h-4 w-4 mr-1.5" /> Mark attendance</Button>
      </div>
      <Card className="border-border">
        {rows.length === 0 ? <EmptyState icon={CalendarDays} title="No attendance yet" description="Attendance records will appear here." /> : (
          <Table>
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Check-in</TableHead><TableHead>Check-out</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.employee_name}</TableCell>
                <TableCell>{r.date}</TableCell>
                <TableCell><StatusPill status={r.status} /></TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{r.check_in || "—"}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{r.check_out || "—"}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Mark attendance</DialogTitle><DialogDescription>Record for a specific date and employee.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Employee</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm(s => ({ ...s, employee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm(s => ({ ...s, date: e.target.value }))} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(s => ({ ...s, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["present","absent","leave","half_day","wfh"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_"," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Leave() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employee_id: "", from_date: "", to_date: "", kind: "casual", reason: "", status: "pending" });

  async function load() {
    const [{ data: lv }, { data: emps }] = await Promise.all([api.get("/employees/leave/requests"), api.get("/employees")]);
    setRows(lv); setUsers(emps);
  }
  useEffect(() => { load(); }, []);
  async function submit() { try { await api.post("/employees/leave/requests", form); toast.success("Leave requested"); setOpen(false); load(); } catch (e) { toast.error(formatApiError(e)); } }
  async function decide(id, status) { try { await api.patch(`/employees/leave/requests/${id}`, { status }); toast.success(`Leave ${status}`); load(); } catch (e) { toast.error(formatApiError(e)); } }

  return (
    <>
      <div className="flex justify-end mb-4"><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> Request leave</Button></div>
      <Card className="border-border">
        {rows.length === 0 ? <EmptyState icon={CalendarDays} title="No leave requests" /> : (
          <Table>
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>From → To</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.employee_name}</TableCell>
                <TableCell className="capitalize">{r.kind}</TableCell>
                <TableCell className="text-[13px]">{r.from_date} → {r.to_date}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground line-clamp-1">{r.reason}</TableCell>
                <TableCell><StatusPill status={r.status} /></TableCell>
                <TableCell className="text-right space-x-1">
                  {r.status === "pending" && <>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-success border-success/40" onClick={() => decide(r.id, "approved")}>Approve</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/40" onClick={() => decide(r.id, "rejected")}>Reject</Button>
                  </>}
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Request leave</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Employee</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm(s => ({ ...s, employee_id: v }))}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>From</Label><Input type="date" value={form.from_date} onChange={(e) => setForm(s => ({ ...s, from_date: e.target.value }))} /></div>
              <div><Label>To</Label><Input type="date" value={form.to_date} onChange={(e) => setForm(s => ({ ...s, to_date: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.kind} onValueChange={(v) => setForm(s => ({ ...s, kind: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["casual","sick","earned","unpaid"].map(k => <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Reason</Label><Textarea rows={3} value={form.reason} onChange={(e) => setForm(s => ({ ...s, reason: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Performance() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employee_id: "", period: "Q1-2026", score: 4.0, highlights: "", growth_areas: "" });

  async function load() {
    const [{ data: pr }, { data: emps }] = await Promise.all([api.get("/employees/performance/reviews"), api.get("/employees")]);
    setRows(pr); setUsers(emps);
  }
  useEffect(() => { load(); }, []);
  async function submit() { try { await api.post("/employees/performance/reviews", form); toast.success("Review saved"); setOpen(false); load(); } catch (e) { toast.error(formatApiError(e)); } }

  return (
    <>
      <div className="flex justify-end mb-4"><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> Log review</Button></div>
      <Card className="border-border">
        {rows.length === 0 ? <EmptyState icon={Award} title="No reviews yet" /> : (
          <div className="divide-y divide-border">
            {rows.map(r => (
              <div key={r.id} className="p-4 flex gap-4">
                <Avatar className="h-10 w-10"><AvatarImage src={r.employee_photo || undefined} /><AvatarFallback className="bg-wavygo-100 text-wavygo-800 text-[11px] font-semibold">{initials(r.employee_name)}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-[14px]">{r.employee_name}</div>
                    <Badge variant="secondary" className="text-[10px]">{r.period}</Badge>
                    <span className="ml-auto inline-flex items-center gap-1 text-warning font-semibold">★ {r.score}</span>
                  </div>
                  {r.employee_designation && <div className="text-[11.5px] text-muted-foreground">{r.employee_designation}</div>}
                  <div className="mt-2 text-[13px]"><span className="text-muted-foreground text-[11px] uppercase tracking-wide">Highlights · </span>{r.highlights}</div>
                  {r.growth_areas && <div className="text-[13px] mt-1"><span className="text-muted-foreground text-[11px] uppercase tracking-wide">Growth · </span>{r.growth_areas}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Log performance review</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Employee</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm(s => ({ ...s, employee_id: v }))}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Period</Label><Input value={form.period} onChange={(e) => setForm(s => ({ ...s, period: e.target.value }))} /></div>
              <div><Label>Score (1-5)</Label><Input type="number" step="0.1" value={form.score} onChange={(e) => setForm(s => ({ ...s, score: parseFloat(e.target.value) }))} /></div>
            </div>
            <div><Label>Highlights</Label><Textarea rows={2} value={form.highlights} onChange={(e) => setForm(s => ({ ...s, highlights: e.target.value }))} /></div>
            <div><Label>Growth areas</Label><Textarea rows={2} value={form.growth_areas} onChange={(e) => setForm(s => ({ ...s, growth_areas: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>Save review</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Departments() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  async function load() { const { data } = await api.get("/employees/departments/list"); setRows(data); }
  useEffect(() => { load(); }, []);
  async function submit() { try { await api.post("/employees/departments/list", form); toast.success("Department created"); setOpen(false); setForm({ name: "", description: "" }); load(); } catch (e) { toast.error(formatApiError(e)); } }
  return (
    <>
      <div className="flex justify-end mb-4"><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> New department</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map(d => (
          <Card key={d.id} className="border-border hover-lift">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center"><Building2 className="h-4.5 w-4.5" /></div>
                <div>
                  <CardTitle className="font-display text-[15px]">{d.name}</CardTitle>
                  <div className="text-[11.5px] text-muted-foreground">{d.headcount} teammate{d.headcount === 1 ? "" : "s"}{d.head_name ? ` · ${d.head_name}` : ""}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 text-[13px] text-muted-foreground">{d.description || "—"}</CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">New department</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Employees() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/employees/stats/overview").then(({ data }) => setStats(data)); }, []);
  return (
    <div data-testid="employees-page">
      <PageHeader eyebrow="Module" title="Employees" description="Directory, attendance, leave, performance and departments — the human core of WavyGo." />
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total teammates" value={stats.total} icon={Users} />
          <StatCard label="Online now" value={stats.online} icon={Users} tone="success" />
          <StatCard label="Departments" value={stats.departments} icon={Building2} tone="info" />
          <StatCard label="Pending leave" value={stats.pending_leave} icon={CalendarDays} tone="warning" />
        </div>
      )}
      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory" data-testid="emp-tab-directory">Directory</TabsTrigger>
          <TabsTrigger value="attendance" data-testid="emp-tab-attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave" data-testid="emp-tab-leave">Leave</TabsTrigger>
          <TabsTrigger value="performance" data-testid="emp-tab-performance">Performance</TabsTrigger>
          <TabsTrigger value="departments" data-testid="emp-tab-departments">Departments</TabsTrigger>
        </TabsList>
        <TabsContent value="directory" className="mt-6"><Directory /></TabsContent>
        <TabsContent value="attendance" className="mt-6"><Attendance /></TabsContent>
        <TabsContent value="leave" className="mt-6"><Leave /></TabsContent>
        <TabsContent value="performance" className="mt-6"><Performance /></TabsContent>
        <TabsContent value="departments" className="mt-6"><Departments /></TabsContent>
      </Tabs>
    </div>
  );
}
