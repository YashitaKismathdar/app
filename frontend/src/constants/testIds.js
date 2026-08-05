export const HOME = { emergentLink: "emergent-link" };

export const AUTH = {
  emailInput: "login-email-input",
  passwordInput: "login-password-input",
  submitButton: "login-submit-button",
  rememberCheckbox: "login-remember-checkbox",
  forgotLink: "login-forgot-link",
  errorMessage: "login-error-message",
  logoutButton: "logout-button",
};

export const SHELL = {
  sidebar: "app-sidebar",
  sidebarToggle: "sidebar-toggle",
  topnav: "app-topnav",
  greeting: "app-greeting",
  themeToggle: "theme-toggle",
  notificationBell: "notification-bell",
  notificationDrawer: "notification-drawer",
  globalSearch: "global-search-input",
  globalSearchTrigger: "global-search-trigger",
  quickCreate: "quick-create-trigger",
  userMenu: "user-menu-trigger",
};

export const DASHBOARD = {
  root: "founder-dashboard",
  kpi: (k) => `kpi-${k}`,
  revenueChart: "revenue-chart",
  bookingsChart: "bookings-chart",
  cityTable: "city-performance-table",
  tasksList: "todays-tasks-list",
  calendarList: "upcoming-events-list",
  quickActions: "quick-actions",
  activityFeed: "recent-activity-feed",
  opportunities: "opportunity-summary",
};

export const SIDEBAR_NAV = (key) => `nav-${key}`;
