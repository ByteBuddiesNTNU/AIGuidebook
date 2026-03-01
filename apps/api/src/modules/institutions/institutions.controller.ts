import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { randomUUID } from "crypto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { InstitutionsService } from "./institutions.service";

@Controller("institutions")
@UseGuards(JwtAuthGuard)
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return {
      data: await this.institutionsService.findOne(id),
      error: null,
      meta: { requestId: randomUUID(), timestamp: new Date().toISOString() },
    };
  }
}
