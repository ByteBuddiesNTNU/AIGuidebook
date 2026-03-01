import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { randomUUID } from "crypto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AnalyticsService } from "./analytics.service";

@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("usage-over-time")
  async usageOverTime(@Req() req: Request, @Query("from") from?: string, @Query("to") to?: string) {
    const user = req.user as { sub: string };
    return this.ok(await this.analyticsService.usageOverTime(user.sub, from, to));
  }

  @Get("usage-by-category")
  async usageByCategory(@Req() req: Request, @Query("from") from?: string, @Query("to") to?: string) {
    const user = req.user as { sub: string };
    return this.ok(await this.analyticsService.usageByCategory(user.sub, from, to));
  }

  private ok(data: unknown) {
    return { data, error: null, meta: { requestId: randomUUID(), timestamp: new Date().toISOString() } };
  }
}
