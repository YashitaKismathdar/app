import {
  LayoutDashboard, Bike, ClipboardList, Target, Users, MessagesSquare,
  Archive, Wallet, Handshake, Megaphone, BarChart3, CalendarDays,
  Sparkles, Building2, ScrollText, Bell, Settings,
} from "lucide-react";
import { canViewModule, sidebarLabel } from "@/constants/permissions";

export const NAV_ITEMS = [
  { key: "dashboard",       moduleKey: "dashboard",       label: "Dashboard",       icon: LayoutDashboard,  to: "/dashboard" },
  { key: "marketplace",     moduleKey: "marketplace",     label: "Marketplace",     icon: Bike,             to: "/marketplace" },
  { key: "task-board",      moduleKey: "task-board",      label: "Task Board",      icon: ClipboardList,    to: "/task-board" },
  { key: "opportunity-hub", moduleKey: "opportunity-hub", label: "Opportunity Hub", icon: Target,           to: "/opportunity-hub" },
  { key: "employees",       moduleKey: "employees",       label: "Employees",       icon: Users,            to: "/employees" },
  { key: "wavygo-connect",  moduleKey: "wavygo-connect",  label: "WavyGo Connect",  icon: MessagesSquare,   to: "/wavygo-connect" },
  { key: "company-vault",   moduleKey: "company-vault",   label: "Company Vault",   icon: Archive,          to: "/company-vault" },
  { key: "finance",         moduleKey: "finance",         label: "Finance",         icon: Wallet,           to: "/finance" },
  { key: "crm",             moduleKey: "crm",             label: "CRM",             icon: Handshake,        to: "/crm" },
  { key: "marketing",       moduleKey: "marketing",       label: "Marketing",       icon: Megaphone,        to: "/marketing" },
  { key: "analytics",       moduleKey: "analytics",       label: "Analytics",       icon: BarChart3,        to: "/analytics" },
  { key: "calendar",        moduleKey: "calendar",        label: "Calendar",        icon: CalendarDays,     to: "/calendar" },
  { key: "wavygo-ai",       moduleKey: "wavygo-ai",       label: "WavyGo AI",       icon: Sparkles,         to: "/wavygo-ai" },
  { key: "about-wavygo",    moduleKey: "about-wavygo",    label: "About WavyGo",    icon: Building2,        to: "/about-wavygo" },
  { key: "activity-logs",   moduleKey: "activity-logs",   label: "Activity Logs",   icon: ScrollText,       to: "/activity-logs" },
  { key: "notifications",   moduleKey: "notifications",   label: "Notifications",   icon: Bell,             to: "/notifications" },
  { key: "settings",        moduleKey: "settings",        label: "Settings",        icon: Settings,         to: "/settings" },
];

// Returns nav items visible to a role, with role-specific labels applied.
export function visibleNavFor(role) {
  if (!role) return [];
  return NAV_ITEMS
    .filter((item) => canViewModule(role, item.moduleKey))
    .map((item) => ({ ...item, label: sidebarLabel(item.moduleKey, item.label, role) }));
}
