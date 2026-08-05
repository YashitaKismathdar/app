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
import { Target, Plus, Trophy, Calendar as CalendarIcon, ExternalLink, Trash2, User } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";

const OPP_TYPES = ["Grant", "Investor", "Accelerator", "Incubator", "Competition", "Government Scheme", "Tender", "CSR", "Partnership", "Workshop", "Conference"];
const STATUSES = ["open", "assigned", "in_progress", "won", "lost", "closed"];

function initials(name) { return (name || "?").split(" ").map(s => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase(); }

export default function OpportunityHub() {
  const { can, role } = usePermission();
  const canCreate = can("opportunity.create");
  const canAssign = can("opportunity.assign");
  const canDelete = can("opportunity.delete");
  const oppTitle = role === "Employee" ? "My Opportunities" : "Opportunity Hub";
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", type: "Grant", description: "", organisation: "", deadline: "", value_lakhs: 0, status: "open", assignee_id: "", link: "" });

  async function load() {
    const [{ data: r }, { data: u }, { data: s }] = await Promise.all([
      api.get("/opportunities"),
      api.get("/users").catch(() => ({ data: [] })),
      api.get("/opportunities/stats/overview"),
    ]);
    setRows(r); setUsers(u); setStats(s);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q && !JSON.stringify(r).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rows, q, typeFilter, statusFilter]);

  async function submit() {
    try {
      const payload = { ...form, assignee_id: form.assignee_id || null };
      if (editing) await api.patch(`/opportunities/${editing.id}`, payload);
      else await api.post("/opportunities", payload);
      toast.success(editing ? "Opportunity updated" : "Opportunity logged");
      setOpen(false); setEditing(null);
      setForm({ title: "", type: "Grant", description: "", organisation: "", deadline: "", value_lakhs: 0, status: "open", assignee_id: "", link: "" });
      load();
    } catch (e) { toast.error(formatApiError(e)); }
  }

  async function setStatus(id, status) { try { await api.patch(`/opportunities/${id}/status`, { status }); toast.success(`Opportunity → ${status}`); load(); } catch (e) { toast.error(formatApiError(e)); } }
  async function assign(id, assignee_id) { try { await api.post(`/opportunities/${id}/assign`, { assignee_id }); toast.success("Assigned"); load(); } catch (e) { toast.error(formatApiError(e)); } }
  async function del(id) { if (!confirm("Delete this opportunity?")) return; try { await api.delete(`/opportunities/${id}`); toast.success("Deleted"); load(); } catch (e) { toast.error(formatApiError(e)); } }

  function edit(o) { setEditing(o); setForm({ ...form, ...o, assignee_id: o.assignee_id || "" }); setOpen(true); }

  const fieldsLocked = !!editing && role === "Employee";

  return (
    <div data-testid="opportunity-page">
      <PageHeader
        eyebrow="Module"
        title={oppTitle}
        description="Track every grant, investor conversation, tender, partnership and CSR deal in one place."
        actions={canCreate && <Button onClick={() => { setEditing(null); setOpen(true); }} data-testid="opp-create-btn"><Plus className="h-4 w-4 mr-1.5" /> Log opportunity</Button>}
      />

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <StatCard label="Open" value={stats.open} icon={Target} tone="info" />
          <StatCard label="Assigned" value={stats.assigned} icon={User} tone="info" />
          <StatCard label="In progress" value={stats.in_progress} icon={Target} tone="warning" />
          <StatCard label="Won" value={stats.won} icon={Trophy} tone="success" />
          <StatCard label="Lost" value={stats.lost} icon={Target} tone="danger" />
          <StatCard label="Assigned to me" value={stats.mine} icon={User} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Input placeholder="Search opportunities…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" data-testid="opp-search" />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All types</SelectItem>{OPP_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_"," ")}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Target} title="No opportunities match" description="Log the first opportunity or clear filters." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(o => (
            <Card key={o.id} className="border-border hover-lift">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Badge variant="secondary" className="text-[10px] mb-2">{o.type}</Badge>
                    <CardTitle className="font-display text-[15.5px] leading-snug">{o.title}</CardTitle>
                    {o.organisation && <div className="text-[11.5px] text-muted-foreground mt-1">{o.organisation}</div>}
                  </div>
                  <StatusPill status={o.status} />
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {o.description && <p className="text-[12.5px] text-muted-foreground line-clamp-2">{o.description}</p>}
                <div className="flex items-center justify-between text-[12px]">
                  {o.deadline && <div className="inline-flex items-center gap-1.5 text-muted-foreground"><CalendarIcon className="h-3 w-3" /> {new Date(o.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>}
                  {o.value_lakhs ? <div className="font-semibold text-primary">₹{o.value_lakhs}L</div> : <div />}
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-2">
                    {o.assignee_name ? (
                      <><Avatar className="h-6 w-6"><AvatarImage src={o.assignee_photo || undefined} /><AvatarFallback className="text-[9px] bg-wavygo-100 text-wavygo-800">{initials(o.assignee_name)}</AvatarFallback></Avatar>
                        <span className="text-[12px]">{o.assignee_name}</span></>
                    ) : (
                      <Select value="" onValueChange={(v) => assign(o.id, v)}>
                        <SelectTrigger className="h-7 text-[11px] w-[140px]"><SelectValue placeholder="Assign…" /></SelectTrigger>
                        <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {o.link && <a href={o.link} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground p-1"><ExternalLink className="h-3.5 w-3.5" /></a>}
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => edit(o)}>Edit</Button>
                    {canDelete && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => del(o.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                  </div>
                </div>
                <div className="flex gap-1 pt-1">
                  {STATUSES.filter(s => s !== o.status).map(s => (
                    <Button key={s} size="sm" variant="outline" className="h-6 text-[10.5px] px-1.5 capitalize" onClick={() => setStatus(o.id, s)}>{s.replace("_", " ")}</Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit opportunity" : "Log new opportunity"}</DialogTitle>
            <DialogDescription>Every opportunity you log publishes to Activity Logs and notifies the assignee.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {fieldsLocked && <div className="rounded-md border border-border bg-muted/40 p-2.5 text-[12px] text-muted-foreground">As the assignee, you can update the status only.</div>}
            <div><Label>Title</Label><Input disabled={fieldsLocked} value={form.title} onChange={(e) => setForm(s => ({ ...s, title: e.target.value }))} data-testid="opp-title-input" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm(s => ({ ...s, type: v }))} disabled={fieldsLocked}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{OPP_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Organisation</Label><Input disabled={fieldsLocked} value={form.organisation} onChange={(e) => setForm(s => ({ ...s, organisation: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Deadline</Label><Input disabled={fieldsLocked} type="date" value={form.deadline || ""} onChange={(e) => setForm(s => ({ ...s, deadline: e.target.value }))} /></div>
              <div><Label>Value (₹ lakhs)</Label><Input disabled={fieldsLocked} type="number" value={form.value_lakhs} onChange={(e) => setForm(s => ({ ...s, value_lakhs: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div><Label>Link</Label><Input disabled={fieldsLocked} value={form.link} onChange={(e) => setForm(s => ({ ...s, link: e.target.value }))} placeholder="https://…" /></div>
            <div><Label>Description</Label><Textarea disabled={fieldsLocked} rows={3} value={form.description} onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(s => ({ ...s, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_"," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assignee</Label>
                <Select value={form.assignee_id} onValueChange={(v) => setForm(s => ({ ...s, assignee_id: v }))} disabled={fieldsLocked || !canAssign}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} data-testid="opp-submit-btn">{editing ? "Save changes" : "Log opportunity"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
