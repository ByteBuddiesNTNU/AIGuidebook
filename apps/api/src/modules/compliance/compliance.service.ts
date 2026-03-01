import { Injectable, NotFoundException } from "@nestjs/common";
import { ComplianceResult, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { GuidelinesService } from "../guidelines/guidelines.service";

type Finding = {
  ruleCode: string;
  severity: "info" | "warning" | "high";
  message: string;
  matchedCondition: Record<string, unknown>;
};

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly guidelinesService: GuidelinesService,
  ) {}

  async checkAssignment(studentId: string, assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { aiLogs: { where: { deletedAt: null } } },
    });
    if (!assignment || assignment.deletedAt) {
      throw new NotFoundException("Assignment not found");
    }
    if (assignment.studentId !== studentId) {
      throw new NotFoundException("Assignment not found");
    }

    const guidelineSet = await this.guidelinesService.getActiveForAssignment(assignmentId);
    if (!guidelineSet) {
      return {
        id: "virtual-no-guideline",
        institutionId: assignment.institutionId,
        assignmentId,
        studentId,
        guidelineSetId: null,
        result: ComplianceResult.ok,
        findingsJson: [],
        runAt: new Date(),
      };
    }

    const findings = guidelineSet.rules.flatMap((rule) => this.evaluateRule(rule.conditionJson as Record<string, unknown>, rule.ruleCode, rule.severity, rule.adviceText, assignment.aiLogs));
    const result = findings.some((f) => f.severity === "warning" || f.severity === "high") ? ComplianceResult.warning : ComplianceResult.ok;

    return this.prisma.complianceCheck.create({
      data: {
        institutionId: assignment.institutionId,
        assignmentId,
        studentId,
        guidelineSetId: guidelineSet.id,
        result,
        findingsJson: findings as Prisma.InputJsonValue,
      },
    });
  }

  async latest(studentId: string, assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.studentId !== studentId || assignment.deletedAt) {
      throw new NotFoundException("Assignment not found");
    }
    return this.prisma.complianceCheck.findFirst({
      where: { assignmentId, studentId },
      orderBy: { runAt: "desc" },
    });
  }

  private evaluateRule(
    condition: Record<string, unknown>,
    ruleCode: string,
    severity: "info" | "warning" | "high",
    adviceText: string,
    logs: Array<{ usagePurpose: string; promptRaw: string | null; rawPromptStored: boolean }>,
  ): Finding[] {
    const findings: Finding[] = [];

    const maxLogs = typeof condition.maxLogs === "number" ? condition.maxLogs : undefined;
    if (maxLogs !== undefined && logs.length > maxLogs) {
      findings.push({
        ruleCode,
        severity,
        message: adviceText,
        matchedCondition: { maxLogs, actualLogs: logs.length },
      });
    }

    const disallowedPurpose = typeof condition.disallowedPurpose === "string" ? condition.disallowedPurpose : undefined;
    if (disallowedPurpose && logs.some((log) => log.usagePurpose === disallowedPurpose)) {
      findings.push({
        ruleCode,
        severity,
        message: adviceText,
        matchedCondition: { disallowedPurpose },
      });
    }

    const requireReflection = condition.requireReflection === true;
    if (requireReflection && logs.length > 0 && logs.every((l) => !l.promptRaw && !l.rawPromptStored)) {
      findings.push({
        ruleCode,
        severity,
        message: adviceText,
        matchedCondition: { requireReflection: true },
      });
    }

    return findings;
  }
}
