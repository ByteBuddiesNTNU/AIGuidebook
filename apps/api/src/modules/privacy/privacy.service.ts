import { Injectable, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(studentId: string) {
    let settings = await this.prisma.studentPrivacySetting.findUnique({ where: { studentId } });
    if (!settings) {
      const user = await this.prisma.user.findUnique({ where: { id: studentId } });
      if (!user) {
        throw new NotFoundException("User not found");
      }
      settings = await this.prisma.studentPrivacySetting.create({
        data: {
          studentId,
          institutionId: user.institutionId,
          storeRawPromptsDefault: false,
          rawPromptRetentionDays: Number(process.env.RAW_PROMPT_RETENTION_DAYS ?? 180),
        },
      });
    }
    return settings;
  }

  async updateSettings(studentId: string, input: { storeRawPromptsDefault?: boolean; rawPromptRetentionDays?: number }) {
    const current = await this.getSettings(studentId);
    const retention = input.rawPromptRetentionDays ?? current.rawPromptRetentionDays;
    if (retention < 1 || retention > 3650) {
      throw new Error("Retention days out of range");
    }

    return this.prisma.studentPrivacySetting.update({
      where: { studentId },
      data: {
        storeRawPromptsDefault: input.storeRawPromptsDefault ?? current.storeRawPromptsDefault,
        rawPromptRetentionDays: retention,
      },
    });
  }

  async exportMetadata(studentId: string) {
    const [assignments, logs, declarations] = await Promise.all([
      this.prisma.assignment.count({ where: { studentId, deletedAt: null } }),
      this.prisma.aIInteractionLog.count({ where: { studentId, deletedAt: null } }),
      this.prisma.declaration.count({ where: { studentId } }),
    ]);
    return {
      studentId,
      generatedAt: new Date().toISOString(),
      counts: { assignments, logs, declarations },
      note: "Self-service data export payload generation can be added in a later milestone.",
    };
  }

  async runRetentionNow() {
    const run = await this.prisma.retentionJobRun.create({ data: { status: "running" } });
    try {
      const now = new Date();
      const settings = await this.prisma.studentPrivacySetting.findMany();

      let deletedCount = 0;
      for (const setting of settings) {
        const cutoff = new Date(now.getTime() - setting.rawPromptRetentionDays * 24 * 60 * 60 * 1000);
        const result = await this.prisma.aIInteractionLog.updateMany({
          where: {
            studentId: setting.studentId,
            rawPromptStored: true,
            promptRaw: { not: null },
            createdAt: { lt: cutoff },
          },
          data: { promptRaw: null, rawPromptStored: false },
        });
        deletedCount += result.count;
      }

      return this.prisma.retentionJobRun.update({
        where: { id: run.id },
        data: { status: "completed", finishedAt: new Date(), deletedCount },
      });
    } catch (error) {
      return this.prisma.retentionJobRun.update({
        where: { id: run.id },
        data: { status: "failed", finishedAt: new Date(), error: String(error) },
      });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduledRetention() {
    await this.runRetentionNow();
  }
}
