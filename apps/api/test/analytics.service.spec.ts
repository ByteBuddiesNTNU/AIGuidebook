import { AnalyticsService } from "../src/modules/analytics/analytics.service";

describe("AnalyticsService", () => {
  const prisma = {
    aIInteractionLog: {
      findMany: jest.fn(),
    },
  };

  const service = new AnalyticsService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("groups usage over time by day", async () => {
    prisma.aIInteractionLog.findMany.mockResolvedValue([
      { createdAt: new Date("2026-01-01T10:00:00.000Z") },
      { createdAt: new Date("2026-01-01T12:00:00.000Z") },
      { createdAt: new Date("2026-01-02T09:00:00.000Z") },
    ]);

    const result = await service.usageOverTime("s1");

    expect(result).toEqual([
      { date: "2026-01-01", count: 2 },
      { date: "2026-01-02", count: 1 },
    ]);
    expect(prisma.aIInteractionLog.findMany).toHaveBeenCalledWith({
      where: {
        studentId: "s1",
        deletedAt: null,
        createdAt: {
          gte: undefined,
          lte: undefined,
        },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });
  });

  it("returns empty usage over time for no logs and applies date filters", async () => {
    prisma.aIInteractionLog.findMany.mockResolvedValue([]);

    const result = await service.usageOverTime("s1", "2026-01-01", "2026-01-31");

    expect(result).toEqual([]);
    expect(prisma.aIInteractionLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: {
            gte: new Date("2026-01-01"),
            lte: new Date("2026-01-31"),
          },
        }),
      }),
    );
  });

  it("groups usage by category", async () => {
    prisma.aIInteractionLog.findMany.mockResolvedValue([
      { usagePurpose: "research" },
      { usagePurpose: "research" },
      { usagePurpose: "summarize" },
    ]);

    const result = await service.usageByCategory("s1");

    expect(result).toEqual([
      { usagePurpose: "research", count: 2 },
      { usagePurpose: "summarize", count: 1 },
    ]);
  });

  it("returns empty category aggregation and applies date filters", async () => {
    prisma.aIInteractionLog.findMany.mockResolvedValue([]);

    const result = await service.usageByCategory("s1", "2026-02-01", "2026-02-28");

    expect(result).toEqual([]);
    expect(prisma.aIInteractionLog.findMany).toHaveBeenCalledWith({
      where: {
        studentId: "s1",
        deletedAt: null,
        createdAt: {
          gte: new Date("2026-02-01"),
          lte: new Date("2026-02-28"),
        },
      },
      select: { usagePurpose: true },
    });
  });
});
