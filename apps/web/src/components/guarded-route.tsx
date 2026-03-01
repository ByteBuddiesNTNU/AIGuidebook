import { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../app/providers/auth-provider";

export function GuardedRoute({ children }: { children: ReactElement }) {
  const { accessToken } = useAuth();
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
