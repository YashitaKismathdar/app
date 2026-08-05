import {
  LayoutDashboard, Bike, ClipboardList, Target, Users, MessagesSquare,
  Archive, Wallet, Handshake, Megaphone, BarChart3, CalendarDays,
  Sparkles, Building2, ScrollText, Bell, Settings,
} from "lucide-react";

export const NAV_ITEMS = [
  { key: "dashboard",       label: "Dashboard",       icon: LayoutDashboard,  to: "/dashboard" },
  { key: "marketplace",     label: "Marketplace",     icon: Bike,             to: "/marketplace" },
  { key: "task-board",      label: "Task Board",      icon: ClipboardList,    to: "/task-board" },
  { key: "opportunity-hub", label: "Opportunity Hub", icon: Target,           to: "/opportunity-hub" },
  { key: "employees",       label: "Employees",       icon: Users,            to: "/employees" },
  { key: "wavygo-connect",  label: "WavyGo Connect",  icon: MessagesSquare,   to: "/wavygo-connect" },
  { key: "company-vault",   label: "Company Vault",   icon: Archive,          to: "/company-vault" },
  { key: "finance",         label: "Finance",         icon: Wallet,           to: "/finance" },
  { key: "crm",             label: "CRM",             icon: Handshake,        to: "/crm" },
  { key: "marketing",       label: "Marketing",       icon: Megaphone,        to: "/marketing" },
  { key: "analytics",       label: "Analytics",       icon: BarChart3,        to: "/analytics" },
  { key: "calendar",        label: "Calendar",        icon: CalendarDays,     to: "/calendar" },
  { key: "wavygo-ai",       label: "WavyGo AI",       icon: Sparkles,         to: "/wavygo-ai" },
  { key: "about-wavygo",    label: "About WavyGo",    icon: Building2,        to: "/about-wavygo" },
  { key: "activity-logs",   label: "Activity Logs",   icon: ScrollText,       to: "/activity-logs" },
  { key: "notifications",   label: "Notifications",   icon: Bell,             to: "/notifications" },
  { key: "settings",        label: "Settings",        icon: Settings,         to: "/settings" },
];
