import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAssignmentDto } from "./create-assignment.dto";
import { UpdateAssignmentDto } from "./update-assignment.dto";

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateAssignmentDto) {
    return this.prisma.assignment.create({
      data: {
        institutionId: dto.institutionId,
        courseId: dto.courseId,
        studentId: userId,
        title: dto.title,
        dueDate: new Date(dto.dueDate),
        status: dto.status ?? "draft",
        storeRawPromptsOverride: dto.storeRawPromptsOverride,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.assignment.findMany({
      where: { studentId: userId, deletedAt: null },
      orderBy: { dueDate: "asc" },
    });
  }

  async findOne(userId: string, id: string) {
    const assignment = await this.prisma.assignment.findFirst({ where: { id, deletedAt: null } });
    if (!assignment) {
      throw new NotFoundException("Assignment not found");
    }
    this.enforceOwnership(userId, assignment.studentId);
    return assignment;
  }

  async update(userId: string, id: string, dto: UpdateAssignmentDto) {
    const assignment = await this.findOne(userId, id);
    return this.prisma.assignment.update({
      where: { id: assignment.id },
      data: {
        title: dto.title,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
        storeRawPromptsOverride: dto.storeRawPromptsOverride,
      },
    });
  }

  async remove(userId: string, id: string) {
    const assignment = await this.findOne(userId, id);
    await this.prisma.assignment.update({ where: { id: assignment.id }, data: { deletedAt: new Date() } });
    return { id: assignment.id, deleted: true };
  }

  async updatePrivacy(userId: string, id: string, storeRawPromptsOverride: boolean | null) {
    const assignment = await this.findOne(userId, id);
    return this.prisma.assignment.update({
      where: { id: assignment.id },
      data: { storeRawPromptsOverride },
    });
  }

  private enforceOwnership(userId: string, ownerId: string) {
    if (userId !== ownerId) {
      throw new ForbiddenException("Not allowed");
    }
  }
}
