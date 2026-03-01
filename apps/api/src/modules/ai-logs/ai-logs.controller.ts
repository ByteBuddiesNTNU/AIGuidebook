import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { randomUUID } from "crypto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AiLogsService } from "./ai-logs.service";
import { CreateAiLogDto } from "./create-ai-log.dto";
import { UpdateAiLogDto } from "./update-ai-log.dto";

@Controller()
@UseGuards(JwtAuthGuard)
export class AiLogsController {
  constructor(private readonly aiLogsService: AiLogsService) {}

  @Post("assignments/:id/ai-logs")
  async create(@Req() req: Request, @Param("id") assignmentId: string, @Body() dto: CreateAiLogDto) {
    const user = req.user as { sub: string };
    return this.ok(await this.aiLogsService.create(user.sub, assignmentId, dto));
  }

  @Get("assignments/:id/ai-logs")
  async list(@Req() req: Request, @Param("id") assignmentId: string) {
    const user = req.user as { sub: string };
    return this.ok(await this.aiLogsService.listByAssignment(user.sub, assignmentId));
  }

  @Patch("ai-logs/:logId")
  async update(@Req() req: Request, @Param("logId") logId: string, @Body() dto: UpdateAiLogDto) {
    const user = req.user as { sub: string };
    return this.ok(await this.aiLogsService.update(user.sub, logId, dto));
  }

  @Delete("ai-logs/:logId")
  async remove(@Req() req: Request, @Param("logId") logId: string) {
    const user = req.user as { sub: string };
    return this.ok(await this.aiLogsService.remove(user.sub, logId));
  }

  private ok(data: unknown) {
    return { data, error: null, meta: { requestId: randomUUID(), timestamp: new Date().toISOString() } };
  }
}
