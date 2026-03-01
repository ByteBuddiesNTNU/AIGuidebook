import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(institutionId?: string, term?: string) {
    return this.prisma.course.findMany({
      where: {
        institutionId,
        term,
      },
      orderBy: { name: "asc" },
    });
  }
}
