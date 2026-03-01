import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { randomUUID } from "crypto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CoursesService } from "./courses.service";

@Controller("courses")
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async findAll(@Query("institutionId") institutionId?: string, @Query("term") term?: string) {
    return {
      data: await this.coursesService.findAll(institutionId, term),
      error: null,
      meta: { requestId: randomUUID(), timestamp: new Date().toISOString() },
    };
  }
}
