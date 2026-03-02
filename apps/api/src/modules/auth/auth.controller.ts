import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";
import { Throttle } from "@nestjs/throttler";
import { randomUUID } from "crypto";
import { AuthService } from "./auth.service";
import { LoginDto } from "./application/login.dto";
import { RegisterDto } from "./application/register.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...tokens } = await this.authService.register(dto);
    this.setRefreshCookie(res, refreshToken);
    return { data: tokens, error: null, meta: this.meta() };
  }

  @Post("login")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...tokens } = await this.authService.login(dto, req.headers["user-agent"], req.ip);
    this.setRefreshCookie(res, refreshToken);
    return { data: tokens, error: null, meta: this.meta() };
  }

  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refreshToken;
    const { refreshToken, ...tokens } = await this.authService.refresh(token);
    this.setRefreshCookie(res, refreshToken);
    return { data: tokens, error: null, meta: this.meta() };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as { sid?: string };
    await this.authService.logout(user?.sid);
    res.clearCookie("refreshToken");
    return { data: { ok: true }, error: null, meta: this.meta() };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    const user = req.user as { sub: string };
    return { data: await this.authService.me(user.sub), error: null, meta: this.meta() };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie("refreshToken", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/v1/auth/refresh",
    });
  }

  private meta() {
    return { requestId: randomUUID(), timestamp: new Date().toISOString() };
  }
}
