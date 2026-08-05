import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, Info, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { SHELL } from "@/constants/testIds";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const KIND_META = {
  info:    { icon: Info,          class: "text-info bg-info/10" },
  success: { icon: CheckCircle2,  class: "text-success bg-success/10" },
  warning: { icon: AlertTriangle, class: "text-warning bg-warning/10" },
  error:   { icon: XCircle,       class: "text-destructive bg-destructive/10" },
};

function relative(iso) {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return ""; }
}

export function NotificationDrawer({ open, onOpenChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications");
      setItems(data);
    } finally { setLoading(false); }
  }

  useEffect(() => { if (open) load(); }, [open]);

  async function markAll() {
    await api.post("/notifications/read-all");
    load();
  }

  async function markOne(id) {
    await api.post(`/notifications/${id}/read`);
    setItems((s) => s.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  const unread = items.filter(i => !i.read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent data-testid={SHELL.notificationDrawer} side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border flex-row items-center justify-between space-y-0">
          <div>
            <SheetTitle className="font-display text-lg">Notifications</SheetTitle>
            <SheetDescription className="sr-only">Recent notifications for your workspace</SheetDescription>
            <div className="text-xs text-muted-foreground mt-0.5">{unread} unread</div>
          </div>
          <Button variant="ghost" size="sm" onClick={markAll} disabled={!unread} className="text-xs">
            <CheckCheck className="h-3.5 w-3.5 mr-1.5" /> Mark all read
          </Button>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
          {!loading && items.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">You're all caught up.</div>
          )}
          <ul className="divide-y divide-border">
            {items.map((n) => {
              const meta = KIND_META[n.kind] || KIND_META.info;
              const Icon = meta.icon;
              return (
                <li key={n.id} onClick={() => !n.read && markOne(n.id)}
                    className={cn(
                      "px-6 py-4 flex gap-3 cursor-pointer transition-colors",
                      !n.read ? "bg-primary/[0.04] hover:bg-primary/[0.07]" : "hover:bg-muted/50"
                    )}>
                  <div className={cn("h-9 w-9 rounded-md flex items-center justify-center shrink-0", meta.class)}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2 justify-between">
                      <div className="text-[13.5px] font-medium leading-tight text-foreground">{n.title}</div>
                      {!n.read && <Badge className="bg-primary text-primary-foreground shrink-0 h-4 px-1.5 text-[9px]">NEW</Badge>}
                    </div>
                    <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">{n.body}</p>
                    <div className="text-[11px] text-muted-foreground/70 mt-2">{relative(n.created_at)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
