import { Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { randomUUID } from "crypto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ComplianceService } from "./compliance.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post("assignments/:id/compliance/check")
  async check(@Req() req: Request, @Param("id") assignmentId: string) {
    const user = req.user as { sub: string };
    return this.ok(await this.complianceService.checkAssignment(user.sub, assignmentId));
  }

  @Get("assignments/:id/compliance/latest")
  async latest(@Req() req: Request, @Param("id") assignmentId: string) {
    const user = req.user as { sub: string };
    return this.ok(await this.complianceService.latest(user.sub, assignmentId));
  }

  private ok(data: unknown) {
    return { data, error: null, meta: { requestId: randomUUID(), timestamp: new Date().toISOString() } };
  }
}
