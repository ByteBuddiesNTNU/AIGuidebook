import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { randomUUID } from "crypto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AssignmentsService } from "./assignments.service";
import { CreateAssignmentDto } from "./create-assignment.dto";
import { UpdateAssignmentDto } from "./update-assignment.dto";

class AssignmentPrivacyDto {
  storeRawPromptsOverride!: boolean | null;
}

@Controller("assignments")
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateAssignmentDto) {
    const user = req.user as { sub: string };
    return this.ok(await this.assignmentsService.create(user.sub, dto));
  }

  @Get()
  async findAll(@Req() req: Request) {
    const user = req.user as { sub: string };
    return this.ok(await this.assignmentsService.findAll(user.sub));
  }

  @Get(":id")
  async findOne(@Req() req: Request, @Param("id") id: string) {
    const user = req.user as { sub: string };
    return this.ok(await this.assignmentsService.findOne(user.sub, id));
  }

  @Patch(":id")
  async update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateAssignmentDto) {
    const user = req.user as { sub: string };
    return this.ok(await this.assignmentsService.update(user.sub, id, dto));
  }

  @Delete(":id")
  async remove(@Req() req: Request, @Param("id") id: string) {
    const user = req.user as { sub: string };
    return this.ok(await this.assignmentsService.remove(user.sub, id));
  }

  @Patch(":id/privacy")
  async updatePrivacy(@Req() req: Request, @Param("id") id: string, @Body() dto: AssignmentPrivacyDto) {
    const user = req.user as { sub: string };
    return this.ok(await this.assignmentsService.updatePrivacy(user.sub, id, dto.storeRawPromptsOverride));
  }

  private ok(data: unknown) {
    return { data, error: null, meta: { requestId: randomUUID(), timestamp: new Date().toISOString() } };
  }
}
