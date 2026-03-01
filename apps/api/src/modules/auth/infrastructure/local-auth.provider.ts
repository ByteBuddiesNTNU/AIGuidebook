import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import * as argon2 from "argon2";
import { AuthProvider, AuthUser } from "../domain/auth-provider";

@Injectable()
export class LocalAuthProvider implements AuthProvider {
  constructor(private readonly prisma: PrismaService) {}

  async validateCredentials(email: string, password: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findFirst({ where: { email, isActive: true } });
    if (!user) {
      return null;
    }

    const matches = await argon2.verify(user.passwordHash, password);
    if (!matches) {
      return null;
    }

    return {
      userId: user.id,
      institutionId: user.institutionId,
      role: user.role,
      email: user.email,
    };
  }
}
