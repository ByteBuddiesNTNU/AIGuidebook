export type AuthUser = {
  userId: string;
  institutionId: string;
  role: "student" | "admin";
  email: string;
};

export interface AuthProvider {
  validateCredentials(email: string, password: string): Promise<AuthUser | null>;
}
