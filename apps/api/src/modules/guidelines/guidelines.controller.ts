import { Body, Controller, Get, Param, UseGuards } from "@nestjs/common";
import { randomUUID } from "crypto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { GuidelinesService } from "./guidelines.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class GuidelinesController {
  constructor(private readonly guidelinesService: GuidelinesService) {}

  @Get("assignments/:id/guidelines/active")
  async getForAssignment(@Param("id") assignmentId: string) {
    return this.ok(await this.guidelinesService.getActiveForAssignment(assignmentId));
  }

  @Get("courses/:id/guidelines/active")
  async getForCourse(@Param("id") courseId: string) {
    return this.ok(await this.guidelinesService.getActiveForCourse(courseId));
  }

  // Placeholder to keep strict typing for admin payload in one place.
  static parseAdminPayload(payload: unknown) {
    return payload as Parameters<GuidelinesService["createSet"]>[0];
  }

  private ok(data: unknown) {
    return {
      data,
      error: null,
      meta: { requestId: randomUUID(), timestamp: new Date().toISOString() },
    };
  }
}
