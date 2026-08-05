import { useAuth } from "@/contexts/AuthContext";
import { can as canAction, canViewModule as canView, sidebarLabel as sbLabel } from "@/constants/permissions";

// Role-aware permission helpers derived from the current authenticated user.
export function usePermission() {
  const { user } = useAuth();
  const role = user?.role || null;

  return {
    role,
    can: (action) => (role ? canAction(role, action) : false),
    canViewModule: (key) => (role ? canView(role, key) : false),
    sidebarLabel: (key, defaultLabel) => sbLabel(key, defaultLabel, role),
  };
}

export default usePermission;
