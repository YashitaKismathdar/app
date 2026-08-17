import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader, EmptyState } from "@/components/module/ModulePrimitives";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessagesSquare, Hash, Users2, Megaphone, Plus, Send, Search, Lock } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const KIND_ICON = { channel: Hash, dm: MessagesSquare, group: Users2, announcement: Megaphone };

function initials(name) { return (name || "?").split(" ").map(s => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase(); }

export default function WavygoConnect() {
  const { user } = useAuth();
  const { can } = usePermission();
  const canCreateChannel = can("connect.create_channel");
  const canCreateAnnouncement = can("connect.create_announcement");
  const canPostAnnouncement = can("connect.post_announcement");
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [dmOpen, setDmOpen] = useState(false);
  const [form, setForm] = useState({ name: "", kind: "channel", description: "" });
  const [q, setQ] = useState("");
  const scrollRef = useRef(null);

  async function loadChannels(selectId = null) {
    const { data } = await api.get("/connect/channels");
    setChannels(data);
    if (selectId) setActiveId(selectId);
    else if (!activeId && data.length) setActiveId(data[0].id);
  }
  async function loadUsers() { try { const { data } = await api.get("/users"); setUsers(data); } catch { /* noop */ } }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadChannels(); loadUsers(); }, []);

  async function loadMessages(id) {
    try { const { data } = await api.get(`/connect/channels/${id}/messages`); setMessages(data); }
    catch (e) { toast.error(formatApiError(e)); }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeId) {
      loadMessages(activeId);
      const t = setInterval(() => loadMessages(activeId), 5000);
      return () => clearInterval(t);
    }
  }, [activeId]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  async function createChannel() {
    try {
      const { data } = await api.post("/connect/channels", { name: form.name, kind: form.kind, description: form.description, members: [] });
      toast.success(`${form.kind} created`);
      setCreateOpen(false); setForm({ name: "", kind: "channel", description: "" });
      loadChannels(data.id);
    } catch (e) { toast.error(formatApiError(e)); }
  }

  async function openDm(peerId) {
    try {
      const { data } = await api.post(`/connect/dm/${peerId}`);
      setDmOpen(false);
      loadChannels(data.id);
    } catch (e) { toast.error(formatApiError(e)); }
  }

  async function send() {
    if (!text.trim() || !activeId) return;
    try {
      await api.post(`/connect/channels/${activeId}/messages`, { body: text.trim() });
      setText("");
      loadMessages(activeId);
      loadChannels();
    } catch (e) { toast.error(formatApiError(e)); }
  }

  const active = channels.find(c => c.id === activeId);

  const grouped = useMemo(() => {
    const g = { announcement: [], channel: [], group: [], dm: [] };
    for (const c of channels) {
      if (q && !(c.name + (c.description || "")).toLowerCase().includes(q.toLowerCase())) continue;
      (g[c.kind] || (g[c.kind] = [])).push(c);
    }
    return g;
  }, [channels, q]);

  return (
    <div data-testid="connect-page">
      <PageHeader
        eyebrow="Module"
        title="WavyGo Connect"
        description="Internal channels, announcements, groups and direct messages — all your team communication in one place."
        actions={
          <>
            <Button variant="outline" onClick={() => setDmOpen(true)}><MessagesSquare className="h-4 w-4 mr-1.5" /> New DM</Button>
            {canCreateChannel && (
              <Button onClick={() => setCreateOpen(true)} data-testid="connect-create-btn"><Plus className="h-4 w-4 mr-1.5" /> New channel</Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-[560px]">
        {/* Channel list */}
        <Card className="border-border p-3 flex flex-col">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 pl-8 text-[13px]" />
          </div>
          <ScrollArea className="mt-3 flex-1">
            {["announcement", "channel", "group", "dm"].map(kind => (
              (grouped[kind] || []).length > 0 && (
                <div key={kind} className="mb-4">
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground px-2 mb-1.5">
                    {kind === "dm" ? "Direct Messages" : kind === "announcement" ? "Announcements" : kind === "group" ? "Groups" : "Channels"}
                  </div>
                  <ul className="space-y-0.5">
                    {(grouped[kind] || []).map(c => {
                      const Icon = KIND_ICON[c.kind] || Hash;
                      const isActive = c.id === activeId;
                      const displayName = c.display_name || c.name;
                      return (
                        <li key={c.id}>
                          <button onClick={() => setActiveId(c.id)}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition-colors",
                                    isActive ? "bg-primary/10 text-foreground font-medium" : "text-foreground/80 hover:bg-muted"
                                  )}>
                            {c.kind === "dm" ? (
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={c.peer_photo || undefined} />
                                <AvatarFallback className="text-[8px] bg-wavygo-100 text-wavygo-800">{initials(displayName)}</AvatarFallback>
                              </Avatar>
                            ) : <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                            <span className="truncate flex-1 text-left">{displayName}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )
            ))}
          </ScrollArea>
        </Card>

        {/* Message pane */}
        <Card className="border-border flex flex-col overflow-hidden">
          {!active ? (
            <EmptyState icon={MessagesSquare} title="Select a channel" description="Pick a channel from the list to start chatting." />
          ) : (
            <>
              <div className="px-5 py-3 border-b border-border flex items-center gap-3">
                {active.kind === "dm" ? (
                  <>
                    <Avatar className="h-8 w-8"><AvatarImage src={active.peer_photo || undefined} /><AvatarFallback className="text-[10px] bg-wavygo-100 text-wavygo-800">{initials(active.display_name || active.name)}</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <div className="font-display text-[15px] font-semibold">{active.display_name || active.name}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full", active.peer_online ? "bg-emerald-500" : "bg-slate-400")} />
                        {active.peer_online ? "Online" : "Offline"} · {active.peer_role}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      {(() => { const Icon = KIND_ICON[active.kind] || Hash; return <Icon className="h-4 w-4" />; })()}
                    </div>
                    <div className="flex-1">
                      <div className="font-display text-[15px] font-semibold flex items-center gap-2">
                        {active.name}
                        {active.kind === "group" && <Badge variant="secondary" className="text-[10px]"><Lock className="h-2.5 w-2.5 mr-1" />Private</Badge>}
                        {active.kind === "announcement" && <Badge className="bg-info/10 text-info hover:bg-info/10 text-[10px]">Announcement</Badge>}
                      </div>
                      {active.description && <div className="text-[11.5px] text-muted-foreground">{active.description}</div>}
                    </div>
                  </>
                )}
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-4 min-h-[300px] max-h-[520px]">
                {messages.length === 0 && <div className="text-center text-sm text-muted-foreground py-16">No messages yet. Say hello 👋</div>}
                {messages.map(m => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={cn("flex gap-2.5", mine && "flex-row-reverse")}>
                      <Avatar className="h-7 w-7 shrink-0"><AvatarImage src={m.sender_photo || undefined} /><AvatarFallback className="text-[9px] bg-wavygo-100 text-wavygo-800">{initials(m.sender_name)}</AvatarFallback></Avatar>
                      <div className={cn("max-w-[70%]", mine && "text-right")}>
                        <div className={cn("flex items-baseline gap-2 mb-0.5", mine && "flex-row-reverse")}>
                          <span className="text-[12px] font-medium">{m.sender_name}</span>
                          <span className="text-[10.5px] text-muted-foreground">{(() => { try { return formatDistanceToNow(new Date(m.created_at), { addSuffix: true }); } catch { return ""; } })()}</span>
                        </div>
                        <div className={cn("inline-block rounded-lg px-3 py-2 text-[13.5px] leading-relaxed", mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                          {m.body}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(active.kind !== "announcement" || canPostAnnouncement) && (
                <div className="border-t border-border px-4 py-3 flex items-center gap-2">
                  <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                         placeholder={`Message ${active.kind === "dm" ? active.display_name || active.name : "#" + active.name}`}
                         className="h-10" data-testid="connect-message-input" />
                  <Button onClick={send} disabled={!text.trim()} data-testid="connect-send-btn"><Send className="h-4 w-4" /></Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* New channel dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">New channel</DialogTitle><DialogDescription>Channels are visible to everyone. Groups are private.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))} placeholder="e.g. patna-ops" /></div>
            <div>
              <Label>Kind</Label>
              <Select value={form.kind} onValueChange={(v) => setForm(s => ({ ...s, kind: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="channel">Channel — public</SelectItem>
                  <SelectItem value="group">Group — private</SelectItem>
                  {canCreateAnnouncement && <SelectItem value="announcement">Announcement — broadcast</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={createChannel}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New DM dialog */}
      <Dialog open={dmOpen} onOpenChange={setDmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Start a direct message</DialogTitle><DialogDescription>Pick a teammate to message directly.</DialogDescription></DialogHeader>
          <div className="max-h-[380px] overflow-y-auto scrollbar-thin -mx-6 px-6">
            <ul className="divide-y divide-border">
              {users.filter(u => u.id !== user?.id).map(u => (
                <li key={u.id}>
                  <button onClick={() => openDm(u.id)} className="w-full flex items-center gap-3 py-2.5 px-1 hover:bg-muted rounded-md text-left">
                    <Avatar className="h-8 w-8"><AvatarImage src={u.photo || undefined} /><AvatarFallback className="text-[10px] bg-wavygo-100 text-wavygo-800">{initials(u.name)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium">{u.name}</div>
                      <div className="text-[11.5px] text-muted-foreground">{u.role} · {u.designation || u.email}</div>
                    </div>
                    <span className={cn("h-2 w-2 rounded-full", u.online ? "bg-emerald-500" : "bg-slate-400")} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
