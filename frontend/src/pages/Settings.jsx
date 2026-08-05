import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";

export default function Settings() {
  const { user, refreshMe } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState({ name: "", phone: "", designation: "", department: "" });
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "" });
  const [company, setCompany] = useState(null);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (user) setProfile({
      name: user.name || "", phone: user.phone || "",
      designation: user.designation || "", department: user.department || "",
    });
  }, [user]);

  useEffect(() => {
    api.get("/settings/company").then(({ data }) => setCompany(data)).catch(() => {});
    api.get("/settings/roles").then(({ data }) => setRoles(data.roles)).catch(() => {});
  }, []);

  async function saveProfile() {
    try {
      await api.patch("/users/me", profile);
      await refreshMe();
      toast.success("Profile updated");
    } catch (e) { toast.error(formatApiError(e)); }
  }

  async function changePassword() {
    try {
      await api.post("/users/me/password", pwForm);
      setPwForm({ current_password: "", new_password: "" });
      toast.success("Password updated");
    } catch (e) { toast.error(formatApiError(e)); }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Settings</div>
        <h1 className="font-display text-3xl font-semibold tracking-tight mt-1">Workspace preferences</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="company" data-testid="tab-company">Company</TabsTrigger>
          <TabsTrigger value="theme" data-testid="tab-theme">Theme</TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
          <TabsTrigger value="roles" data-testid="tab-roles">Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="border-border">
            <CardHeader><CardTitle className="font-display">Your profile</CardTitle><CardDescription>Update your personal details</CardDescription></CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div><Label>Name</Label><Input className="mt-1.5" value={profile.name} onChange={(e) => setProfile(s => ({ ...s, name: e.target.value }))} data-testid="profile-name" /></div>
              <div><Label>Phone</Label><Input className="mt-1.5" value={profile.phone} onChange={(e) => setProfile(s => ({ ...s, phone: e.target.value }))} placeholder="+91" data-testid="profile-phone" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Designation</Label><Input className="mt-1.5" value={profile.designation} onChange={(e) => setProfile(s => ({ ...s, designation: e.target.value }))} data-testid="profile-designation" /></div>
                <div><Label>Department</Label><Input className="mt-1.5" value={profile.department} onChange={(e) => setProfile(s => ({ ...s, department: e.target.value }))} data-testid="profile-department" /></div>
              </div>
              <Button onClick={saveProfile} data-testid="save-profile-btn">Save changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="mt-4">
          <Card className="border-border">
            <CardHeader><CardTitle className="font-display">Company</CardTitle><CardDescription>Registered entity details</CardDescription></CardHeader>
            <CardContent>
              {company ? (
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {Object.entries(company).map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{k}</dt>
                      <dd className="text-[14px] font-medium text-foreground mt-0.5">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : <div className="text-sm text-muted-foreground">Loading…</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="mt-4">
          <Card className="border-border">
            <CardHeader><CardTitle className="font-display">Appearance</CardTitle><CardDescription>Personalise WavyGo OS</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between max-w-md">
                <div>
                  <div className="text-[14px] font-medium">Dark mode</div>
                  <div className="text-[12px] text-muted-foreground">Reduces eye strain in low-light environments.</div>
                </div>
                <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} data-testid="dark-mode-switch" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card className="border-border">
            <CardHeader><CardTitle className="font-display">Security</CardTitle><CardDescription>Change your password</CardDescription></CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div><Label>Current password</Label><Input type="password" className="mt-1.5" value={pwForm.current_password} onChange={(e) => setPwForm(s => ({ ...s, current_password: e.target.value }))} data-testid="current-password-input" /></div>
              <div><Label>New password</Label><Input type="password" className="mt-1.5" value={pwForm.new_password} onChange={(e) => setPwForm(s => ({ ...s, new_password: e.target.value }))} data-testid="new-password-input" /></div>
              <Button onClick={changePassword} data-testid="change-password-btn">Update password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card className="border-border">
            <CardHeader><CardTitle className="font-display">Roles & permissions</CardTitle><CardDescription>How access is structured across WavyGo OS</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roles.map((r) => (
                  <div key={r.name} className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold text-foreground">{r.name}</span>
                        <Badge variant="secondary" className="text-[10px]">Level {r.level}</Badge>
                      </div>
                      <div className="text-[13px] text-muted-foreground mt-1">{r.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
