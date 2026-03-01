import { Body, Controller, Get, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { randomUUID } from "crypto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PrivacyService } from "./privacy.service";

class UpdatePrivacySettingsDto {
  storeRawPromptsDefault?: boolean;
  rawPromptRetentionDays?: number;
}

@Controller("privacy")
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get("settings")
  async getSettings(@Req() req: Request) {
    const user = req.user as { sub: string };
    return this.ok(await this.privacyService.getSettings(user.sub));
  }

  @Patch("settings")
  async updateSettings(@Req() req: Request, @Body() dto: UpdatePrivacySettingsDto) {
    const user = req.user as { sub: string };
    return this.ok(await this.privacyService.updateSettings(user.sub, dto));
  }

  @Post("export")
  async exportData(@Req() req: Request) {
    const user = req.user as { sub: string };
    return this.ok(await this.privacyService.exportMetadata(user.sub));
  }

  private ok(data: unknown) {
    return { data, error: null, meta: { requestId: randomUUID(), timestamp: new Date().toISOString() } };
  }
}
