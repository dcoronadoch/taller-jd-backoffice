import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { hasRole, isAuthenticated } from "../auth/session";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

// Solo deja pasar si hay una sesión vigente y el rol tiene permiso.
export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
