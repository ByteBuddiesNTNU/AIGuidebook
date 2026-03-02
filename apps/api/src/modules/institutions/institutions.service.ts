import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class InstitutionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.institution.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    });
  }

  findOne(id: string) {
    return this.prisma.institution.findUnique({ where: { id } });
  }
}
