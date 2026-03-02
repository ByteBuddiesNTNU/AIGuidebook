import type { AuthRole } from "./auth.types";

export type AuthUser = {
  userId: string;
  institutionId: string;
  role: AuthRole;
  email: string;
};

export interface AuthProvider {
  validateCredentials(email: string, password: string): Promise<AuthUser | null>;
}
