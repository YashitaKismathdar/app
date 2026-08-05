import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { NAV_ITEMS } from "@/constants/nav";
import { useLocation } from "react-router-dom";

export default function ModulePlaceholder() {
  const loc = useLocation();
  const item = NAV_ITEMS.find((n) => n.to === loc.pathname);
  const Icon = item?.icon || Sparkles;
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Module</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight mt-1">{item?.label || "Coming soon"}</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            The <span className="font-medium text-foreground">{item?.label}</span> module is part of the WavyGo OS roadmap. This screen is wired into the permanent app shell and will light up in the next phase.
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Phase 2</Badge>
      </div>

      <Card className="border-border border-dashed">
        <CardContent className="p-16 flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h3 className="font-display text-lg font-semibold mt-4">{item?.label} is on the way</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            The foundation (auth, roles, activity logs, notifications, shell, design system) is already in place. Every future module — from Marketplace to WavyGo AI — plugs into this exact frame.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
