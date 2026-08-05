import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Forbidden() {
  const nav = useNavigate();
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center" data-testid="forbidden-page">
      <Card className="border-border max-w-md w-full">
        <CardContent className="p-10 flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
            <ShieldAlert className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight mt-4">Access restricted</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            You don't have access to this module. Contact your administrator if you believe this is a mistake.
          </p>
          <Button className="mt-6" onClick={() => nav("/dashboard")} data-testid="forbidden-back-btn">
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
