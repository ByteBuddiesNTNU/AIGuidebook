import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAiLogDto } from "./create-ai-log.dto";
import { UpdateAiLogDto } from "./update-ai-log.dto";

@Injectable()
export class AiLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, assignmentId: string, dto: CreateAiLogDto) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.deletedAt) {
      throw new NotFoundException("Assignment not found");
    }
    this.enforceOwnership(userId, assignment.studentId);

    const privacy = await this.prisma.studentPrivacySetting.findUnique({ where: { studentId: userId } });
    const storeRaw = assignment.storeRawPromptsOverride ?? privacy?.storeRawPromptsDefault ?? false;

    return this.prisma.aIInteractionLog.create({
      data: {
        institutionId: assignment.institutionId,
        assignmentId,
        studentId: userId,
        toolName: dto.toolName,
        model: dto.model,
        usagePurpose: dto.usagePurpose,
        promptRaw: storeRaw ? dto.promptRaw : null,
        responseSummary: dto.responseSummary,
        studentReflection: dto.studentReflection,
        rawPromptStored: storeRaw,
      },
    });
  }

  async listByAssignment(userId: string, assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.deletedAt) {
      throw new NotFoundException("Assignment not found");
    }
    this.enforceOwnership(userId, assignment.studentId);

    return this.prisma.aIInteractionLog.findMany({
      where: { assignmentId, studentId: userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(userId: string, logId: string, dto: UpdateAiLogDto) {
    const existing = await this.prisma.aIInteractionLog.findUnique({ where: { id: logId } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException("AI log not found");
    }
    this.enforceOwnership(userId, existing.studentId);

    return this.prisma.aIInteractionLog.update({
      where: { id: logId },
      data: {
        toolName: dto.toolName,
        model: dto.model,
        usagePurpose: dto.usagePurpose,
        promptRaw: dto.promptRaw,
        responseSummary: dto.responseSummary,
        studentReflection: dto.studentReflection,
      },
    });
  }

  async remove(userId: string, logId: string) {
    const existing = await this.prisma.aIInteractionLog.findUnique({ where: { id: logId } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException("AI log not found");
    }
    this.enforceOwnership(userId, existing.studentId);

    await this.prisma.aIInteractionLog.update({
      where: { id: logId },
      data: { deletedAt: new Date(), promptRaw: null },
    });

    return { id: logId, deleted: true };
  }

  private enforceOwnership(userId: string, ownerId: string) {
    if (userId !== ownerId) {
      throw new ForbiddenException("Not allowed");
    }
  }
}
