import { Injectable, NotFoundException } from "@nestjs/common";
import { GuidelineSetStatus, Prisma, ScopeType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

type CreateGuidelineSetInput = {
  institutionId: string;
  scopeType: ScopeType;
  courseId?: string;
  assignmentId?: string;
  version: number;
  sourceType: "seed" | "manual" | "sync";
  effectiveFrom: string;
  effectiveTo?: string;
  rules: Array<{
    ruleCode: string;
    title: string;
    description: string;
    severity: "info" | "warning" | "high";
    conditionJson: Record<string, unknown>;
    adviceText: string;
  }>;
};

@Injectable()
export class GuidelinesService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveForAssignment(assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) {
      throw new NotFoundException("Assignment not found");
    }

    const now = new Date();
    const assignmentSet = await this.prisma.guidelineSet.findFirst({
      where: {
        institutionId: assignment.institutionId,
        scopeType: "assignment",
        assignmentId: assignment.id,
        status: "published",
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      include: { rules: true },
      orderBy: { version: "desc" },
    });
    if (assignmentSet) return assignmentSet;

    const courseSet = await this.prisma.guidelineSet.findFirst({
      where: {
        institutionId: assignment.institutionId,
        scopeType: "course",
        courseId: assignment.courseId,
        status: "published",
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      include: { rules: true },
      orderBy: { version: "desc" },
    });
    if (courseSet) return courseSet;

    return this.prisma.guidelineSet.findFirst({
      where: {
        institutionId: assignment.institutionId,
        scopeType: "institution",
        status: "published",
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      include: { rules: true },
      orderBy: { version: "desc" },
    });
  }

  async getActiveForCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException("Course not found");
    }
    const now = new Date();
    return this.prisma.guidelineSet.findFirst({
      where: {
        institutionId: course.institutionId,
        scopeType: "course",
        courseId,
        status: "published",
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      include: { rules: true },
      orderBy: { version: "desc" },
    });
  }

  createSet(input: CreateGuidelineSetInput) {
    return this.prisma.guidelineSet.create({
      data: {
        institutionId: input.institutionId,
        scopeType: input.scopeType,
        courseId: input.courseId,
        assignmentId: input.assignmentId,
        version: input.version,
        sourceType: input.sourceType,
        effectiveFrom: new Date(input.effectiveFrom),
        effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
        rules: {
          create: input.rules.map((rule) => ({
            ruleCode: rule.ruleCode,
            title: rule.title,
            description: rule.description,
            severity: rule.severity,
            conditionJson: rule.conditionJson as Prisma.InputJsonValue,
            adviceText: rule.adviceText,
          })),
        },
      },
      include: { rules: true },
    });
  }

  publishSet(id: string) {
    return this.prisma.guidelineSet.update({
      where: { id },
      data: { status: GuidelineSetStatus.published },
      include: { rules: true },
    });
  }

  async syncSeededGuidelines() {
    return { synced: true, source: "seed", syncedAt: new Date().toISOString() };
  }
}
