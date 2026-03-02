import { Controller, Get, Param } from "@nestjs/common";
import { randomUUID } from "crypto";
import { InstitutionsService } from "./institutions.service";

@Controller("institutions")
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get()
  async findAll() {
    return {
      data: await this.institutionsService.findAll(),
      error: null,
      meta: { requestId: randomUUID(), timestamp: new Date().toISOString() },
    };
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return {
      data: await this.institutionsService.findOne(id),
      error: null,
      meta: { requestId: randomUUID(), timestamp: new Date().toISOString() },
    };
  }
}
