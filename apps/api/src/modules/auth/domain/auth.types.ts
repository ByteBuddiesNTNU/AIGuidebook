import type { Role } from "@aiguidebook/shared";

export type AuthRole = Role;

export type JwtAccessPayload = {
  sub: string;
  institutionId: string;
  role: AuthRole;
  email: string;
  sid?: string;
};
