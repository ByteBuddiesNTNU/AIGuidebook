import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async usageOverTime(studentId: string, from?: string, to?: string) {
    const logs = await this.prisma.aIInteractionLog.findMany({
      where: {
        studentId,
        deletedAt: null,
        createdAt: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const byDay = logs.reduce<Record<string, number>>((acc, item) => {
      const day = item.createdAt.toISOString().slice(0, 10);
      acc[day] = (acc[day] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(byDay).map(([date, count]) => ({ date, count }));
  }

  async usageByCategory(studentId: string, from?: string, to?: string) {
    const logs = await this.prisma.aIInteractionLog.findMany({
      where: {
        studentId,
        deletedAt: null,
        createdAt: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      select: { usagePurpose: true },
    });

    const byPurpose = logs.reduce<Record<string, number>>((acc, item) => {
      acc[item.usagePurpose] = (acc[item.usagePurpose] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(byPurpose).map(([usagePurpose, count]) => ({ usagePurpose, count }));
  }
}
