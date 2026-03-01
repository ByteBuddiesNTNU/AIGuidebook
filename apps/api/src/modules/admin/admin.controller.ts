import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { randomUUID } from "crypto";
import { AdminGuard } from "../../common/guards/admin.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { GuidelinesService } from "../guidelines/guidelines.service";
import { PrivacyService } from "../privacy/privacy.service";

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly guidelinesService: GuidelinesService,
    private readonly privacyService: PrivacyService,
  ) {}

  @Post("guidelines/sets")
  async createSet(@Body() body: Parameters<GuidelinesService["createSet"]>[0]) {
    return this.ok(await this.guidelinesService.createSet(body));
  }

  @Post("guidelines/sets/:id/publish")
  async publishSet(@Param("id") setId: string) {
    return this.ok(await this.guidelinesService.publishSet(setId));
  }

  @Post("guidelines/sync")
  async syncGuidelines() {
    return this.ok(await this.guidelinesService.syncSeededGuidelines());
  }

  @Post("retention/run")
  async runRetention() {
    return this.ok(await this.privacyService.runRetentionNow());
  }

  private ok(data: unknown) {
    return { data, error: null, meta: { requestId: randomUUID(), timestamp: new Date().toISOString() } };
  }
}
