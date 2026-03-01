import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { LoginDto } from "./application/login.dto";
import { RegisterDto } from "./application/register.dto";
import { LocalAuthProvider } from "./infrastructure/local-auth.provider";
import * as argon2 from "argon2";
import { randomUUID } from "crypto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly localAuthProvider: LocalAuthProvider,
  ) {}

  async register(dto: RegisterDto) {
    const hash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = await this.prisma.user.create({
      data: {
        institutionId: dto.institutionId,
        email: dto.email,
        passwordHash: hash,
        role: "student",
      },
      select: { id: true, institutionId: true, email: true, role: true },
    });
    return this.issueTokens(user.id, user.institutionId, user.role, user.email);
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const authUser = await this.localAuthProvider.validateCredentials(dto.email, dto.password);
    if (!authUser) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.issueTokens(authUser.userId, authUser.institutionId, authUser.role, authUser.email, userAgent, ipAddress);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException("Missing refresh token");
    }
    const payload = await this.jwtService.verifyAsync<{ sub: string; sid: string }>(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Session is not valid");
    }

    const isValid = await argon2.verify(session.refreshTokenHash, refreshToken);
    if (!isValid) {
      throw new UnauthorizedException("Refresh token is not valid");
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(session.user.id, session.user.institutionId, session.user.role, session.user.email);
  }

  async logout(sessionId?: string) {
    if (!sessionId) {
      return;
    }

    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, institutionId: true, role: true, isActive: true },
    });
  }

  private async issueTokens(
    userId: string,
    institutionId: string,
    role: "student" | "admin",
    email: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const sessionId = randomUUID();
    const accessPayload = { sub: userId, institutionId, role, email, sid: sessionId };
    const refreshPayload = { sub: userId, sid: sessionId };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900),
    });

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: Number(process.env.REFRESH_TOKEN_TTL_SECONDS ?? 604800),
    });

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId,
        refreshTokenHash: await argon2.hash(refreshToken, { type: argon2.argon2id }),
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    return {
      accessToken,
      refreshToken,
      sessionId,
      user: { id: userId, institutionId, role, email },
    };
  }
}
