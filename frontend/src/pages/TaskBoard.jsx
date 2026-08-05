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
import { Plus, ClipboardList, CheckCircle2, Clock, Sparkles, Calendar as CalIcon, MessageSquare, Trash2 } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";

const STATUS_ORDER = ["todo", "in_progress", "review", "completed", "cancelled"];
const STATUS_LABEL = { todo: "To do", in_progress: "In progress", review: "Review", completed: "Completed", cancelled: "Cancelled" };

function initials(name) {
  return (name || "?").split(" ").map(s => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function TaskCard({ task, onOpen, onStatusChange }) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/task-id", task.id)}
      onClick={() => onOpen(task)}
      className="group p-3 rounded-lg border border-border bg-card hover:border-primary/40 hover-lift cursor-pointer"
      data-testid={`task-card-${task.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13.5px] font-medium leading-snug text-foreground line-clamp-2">{task.title}</div>
        <StatusPill status={task.priority} />
      </div>
      {task.module && <Badge variant="secondary" className="text-[10px] mt-2">{task.module}</Badge>}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
          {task.due_date && <><Clock className="h-3 w-3" /><span>{new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></>}
        </div>
        {task.assignee_name && (
          <Avatar className="h-6 w-6 ring-1 ring-border">
            <AvatarImage src={task.assignee_photo || undefined} />
            <AvatarFallback className="bg-wavygo-100 text-wavygo-800 text-[9px] font-semibold">{initials(task.assignee_name)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}

function Column({ status, tasks, onOpen, onStatusChange, onNew }) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = e.dataTransfer.getData("text/task-id");
        if (id) onStatusChange(id, status);
      }}
      className="min-w-[260px] w-[280px] shrink-0 rounded-xl bg-muted/40 border border-border p-3 flex flex-col"
      data-testid={`kanban-column-${status}`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <StatusPill status={status} />
          <span className="text-[12px] text-muted-foreground">{tasks.length}</span>
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onNew(status)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="space-y-2 flex-1">
        {tasks.map(t => <TaskCard key={t.id} task={t} onOpen={onOpen} onStatusChange={onStatusChange} />)}
      </div>
    </div>
  );
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", status: "todo", priority: "medium", module: "General" });
  const [comment, setComment] = useState("");

  async function load() {
    const [{ data: t }, { data: u }, { data: s }] = await Promise.all([
      api.get("/tasks?limit=300"),
      api.get("/users").catch(() => ({ data: [] })),
      api.get("/tasks/stats/overview"),
    ]);
    setTasks(t); setUsers(u); setStats(s);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q) return tasks;
    const t = q.toLowerCase();
    return tasks.filter(x => JSON.stringify(x).toLowerCase().includes(t));
  }, [tasks, q]);

  const byStatus = useMemo(() => {
    const m = Object.fromEntries(STATUS_ORDER.map(s => [s, []]));
    for (const t of filtered) (m[t.status] || (m[t.status] = [])).push(t);
    return m;
  }, [filtered]);

  async function createTask() {
    try {
      await api.post("/tasks", form);
      toast.success("Task created");
      setOpen(false); setForm({ title: "", description: "", status: "todo", priority: "medium", module: "General" });
      load();
    } catch (e) { toast.error(formatApiError(e)); }
  }

  async function setStatus(id, status) {
    try { await api.patch(`/tasks/${id}/status`, { status }); load(); }
    catch (e) { toast.error(formatApiError(e)); }
  }

  async function openDetail(t) {
    setActiveTask(t); setDetailOpen(true);
    // fetch fresh copy for comments
    try { const { data } = await api.get(`/tasks/${t.id}`); setActiveTask(data); } catch { /* noop */ }
  }

  async function addComment() {
    if (!comment.trim() || !activeTask) return;
    try {
      await api.post(`/tasks/${activeTask.id}/comments`, { body: comment.trim() });
      setComment("");
      const { data } = await api.get(`/tasks/${activeTask.id}`);
      setActiveTask(data);
      load();
    } catch (e) { toast.error(formatApiError(e)); }
  }

  async function deleteTask(id) {
    if (!confirm("Delete this task?")) return;
    try { await api.delete(`/tasks/${id}`); toast.success("Task deleted"); setDetailOpen(false); load(); }
    catch (e) { toast.error(formatApiError(e)); }
  }

  const userOpts = users.map(u => ({ value: u.id, label: u.name }));

  return (
    <div data-testid="taskboard-page">
      <PageHeader
        eyebrow="Module"
        title="Task Board"
        description="Every task across WavyGo — assign, comment, drag between statuses, and never lose track."
        actions={<Button onClick={() => setOpen(true)} data-testid="task-create-btn"><Plus className="h-4 w-4 mr-1.5" /> New task</Button>}
      />

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <StatCard label="Total" value={Object.values(stats).reduce((a, b) => a + b, 0) - (stats.mine || 0)} icon={ClipboardList} />
          <StatCard label="To do" value={stats.todo} icon={ClipboardList} tone="info" />
          <StatCard label="In progress" value={stats.in_progress} icon={Sparkles} tone="info" />
          <StatCard label="Review" value={stats.review} icon={Sparkles} tone="warning" />
          <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} tone="success" />
          <StatCard label="Assigned to me" value={stats.mine} icon={ClipboardList} tone="default" />
        </div>
      )}

      <Input placeholder="Filter tasks by title, assignee, module…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-md" data-testid="task-search" />

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban" data-testid="task-tab-kanban">Kanban</TabsTrigger>
          <TabsTrigger value="list" data-testid="task-tab-list">List</TabsTrigger>
          <TabsTrigger value="calendar" data-testid="task-tab-calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-4">
            {STATUS_ORDER.map(s => (
              <Column key={s} status={s} tasks={byStatus[s] || []} onOpen={openDetail} onStatusChange={setStatus}
                      onNew={(status) => { setForm(f => ({ ...f, status })); setOpen(true); }} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card className="border-border">
            {filtered.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No tasks match your filter" />
            ) : (
              <div className="divide-y divide-border">
                {filtered.map(t => (
                  <div key={t.id} onClick={() => openDetail(t)} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 cursor-pointer">
                    <StatusPill status={t.status} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-medium truncate">{t.title}</div>
                      <div className="text-[11.5px] text-muted-foreground">{t.module} · {t.assignee_name || "Unassigned"}</div>
                    </div>
                    <StatusPill status={t.priority} />
                    {t.due_date && <div className="text-[12px] text-muted-foreground hidden sm:block">{new Date(t.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="font-display text-[16px]">Upcoming by due date</CardTitle></CardHeader>
            <CardContent>
              {filtered.filter(t => t.due_date).length === 0 ? (
                <EmptyState icon={CalIcon} title="No tasks with due dates" />
              ) : (
                <ul className="space-y-3">
                  {filtered.filter(t => t.due_date).sort((a, b) => (a.due_date || "").localeCompare(b.due_date || "")).map(t => (
                    <li key={t.id} onClick={() => openDetail(t)} className="flex items-center gap-3 p-3 rounded-md border border-border hover:border-primary/40 cursor-pointer">
                      <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex flex-col items-center justify-center text-[10px] uppercase font-semibold">
                        <div>{new Date(t.due_date).toLocaleDateString("en-IN", { month: "short" })}</div>
                        <div className="text-[14px] font-bold leading-none">{new Date(t.due_date).getDate()}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium">{t.title}</div>
                        <div className="text-[11.5px] text-muted-foreground">{t.assignee_name || "Unassigned"} · {t.module}</div>
                      </div>
                      <StatusPill status={t.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display">New task</DialogTitle>
            <DialogDescription>Add a task, assign it, and it will publish to activity + notify the assignee.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input className="mt-1" value={form.title} onChange={(e) => setForm(s => ({ ...s, title: e.target.value }))} data-testid="task-title-input" /></div>
            <div><Label>Description</Label><Textarea rows={3} className="mt-1" value={form.description} onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(s => ({ ...s, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm(s => ({ ...s, priority: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["low","medium","high","urgent"].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Module</Label><Input className="mt-1" value={form.module} onChange={(e) => setForm(s => ({ ...s, module: e.target.value }))} /></div>
              <div>
                <Label>Assignee</Label>
                <Select value={form.assignee_id || ""} onValueChange={(v) => setForm(s => ({ ...s, assignee_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select teammate" /></SelectTrigger>
                  <SelectContent>{userOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Due date</Label><Input type="date" className="mt-1" value={form.due_date || ""} onChange={(e) => setForm(s => ({ ...s, due_date: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createTask} data-testid="task-submit-btn">Create task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          {activeTask && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-2">
                  <StatusPill status={activeTask.priority} />
                  <DialogTitle className="font-display flex-1">{activeTask.title}</DialogTitle>
                </div>
                <DialogDescription>{activeTask.module} · Reported by {activeTask.reporter_name || "system"}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Status</div>
                    <Select value={activeTask.status} onValueChange={(v) => setStatus(activeTask.id, v).then(() => openDetail({ ...activeTask, status: v }))}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Assignee</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      {activeTask.assignee_name ? (
                        <>
                          <Avatar className="h-7 w-7"><AvatarFallback className="bg-wavygo-100 text-wavygo-800 text-[10px]">{initials(activeTask.assignee_name)}</AvatarFallback></Avatar>
                          <div className="text-[13px] font-medium">{activeTask.assignee_name}</div>
                        </>
                      ) : <div className="text-[13px] text-muted-foreground">Unassigned</div>}
                    </div>
                  </div>
                </div>

                {activeTask.description && (
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Description</div>
                    <p className="text-[13.5px] text-foreground mt-1.5 leading-relaxed">{activeTask.description}</p>
                  </div>
                )}

                <div>
                  <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Comments · {activeTask.comments?.length || 0}</div>
                  <div className="mt-2 space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin">
                    {(activeTask.comments || []).map(c => (
                      <div key={c.id} className="p-3 rounded-md bg-muted/40 border border-border">
                        <div className="text-[12px] font-medium">{c.author_name}</div>
                        <div className="text-[13px] mt-0.5">{c.body}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Input placeholder="Write a comment…" value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addComment()} />
                    <Button size="sm" onClick={addComment}>Post</Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => deleteTask(activeTask.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-1.5" /> Delete</Button>
                <Button onClick={() => setDetailOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
