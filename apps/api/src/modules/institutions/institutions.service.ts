import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class InstitutionsService {
  constructor(private readonly prisma: PrismaService) {}

  findOne(id: string) {
    return this.prisma.institution.findUnique({ where: { id } });
  }
}
