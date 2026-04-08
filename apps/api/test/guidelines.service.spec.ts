import { NotFoundException } from "@nestjs/common";
import { GuidelinesService } from "../src/modules/guidelines/guidelines.service";

// Traceability note:
// TC4/FR4: course/assignment guideline retrieval behavior.
describe("GuidelinesService", () => {
  const prisma = {
    assignment: { findUnique: jest.fn() },
    course: { findUnique: jest.fn() },
    guidelineSet: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  };

  const service = new GuidelinesService(prisma as any);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("throws NotFoundException when assignment is missing", async () => {
    prisma.assignment.findUnique.mockResolvedValue(null);

    await expect(service.getActiveForAssignment("a1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns assignment scoped guideline set when present", async () => {
    prisma.assignment.findUnique.mockResolvedValue({ id: "a1", institutionId: "i1", courseId: "c1" });
    prisma.guidelineSet.findFirst
      .mockResolvedValueOnce({ id: "g-assignment", scopeType: "assignment", rules: [] })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await service.getActiveForAssignment("a1");

    expect(result).toEqual({ id: "g-assignment", scopeType: "assignment", rules: [] });
    expect(prisma.guidelineSet.findFirst).toHaveBeenCalledTimes(1);
  });

  it("falls back from assignment to course to institution guideline set", async () => {
    prisma.assignment.findUnique.mockResolvedValue({ id: "a1", institutionId: "i1", courseId: "c1" });
    prisma.guidelineSet.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "g-inst", scopeType: "institution", rules: [] });

    const result = await service.getActiveForAssignment("a1");

    expect(result).toEqual({ id: "g-inst", scopeType: "institution", rules: [] });
    expect(prisma.guidelineSet.findFirst).toHaveBeenCalledTimes(3);
    expect(prisma.guidelineSet.findFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: expect.objectContaining({ scopeType: "course", courseId: "c1" }) }),
    );
    expect(prisma.guidelineSet.findFirst).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ where: expect.objectContaining({ scopeType: "institution", institutionId: "i1" }) }),
    );
  });

  it("throws NotFoundException when course is missing", async () => {
    prisma.course.findUnique.mockResolvedValue(null);

    await expect(service.getActiveForCourse("c1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("[TC4][FR4] returns active guideline set for course", async () => {
    prisma.course.findUnique.mockResolvedValue({ id: "c1", institutionId: "i1" });
    prisma.guidelineSet.findFirst.mockResolvedValue({ id: "g-course", scopeType: "course", rules: [] });

    const result = await service.getActiveForCourse("c1");

    expect(result).toEqual({ id: "g-course", scopeType: "course", rules: [] });
    expect(prisma.guidelineSet.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ institutionId: "i1", courseId: "c1", scopeType: "course" }) }),
    );
  });

  it("creates a guideline set with mapped rule payload", async () => {
    prisma.guidelineSet.create.mockResolvedValue({ id: "g1" });

    const result = await service.createSet({
      institutionId: "i1",
      scopeType: "course",
      courseId: "c1",
      version: 1,
      sourceType: "manual",
      effectiveFrom: "2026-01-01T00:00:00.000Z",
      effectiveTo: null,
      rules: [
        {
          ruleCode: "R1",
          title: "Title",
          description: "Description",
          severity: "warning",
          conditionJson: { maxLogs: 2 },
          adviceText: "Advice",
        },
      ],
    } as any);

    expect(result).toEqual({ id: "g1" });
    expect(prisma.guidelineSet.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          institutionId: "i1",
          scopeType: "course",
          courseId: "c1",
          effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
          rules: {
            create: [
              expect.objectContaining({ ruleCode: "R1", severity: "warning", conditionJson: { maxLogs: 2 } }),
            ],
          },
        }),
      }),
    );
  });

  it("publishes a guideline set", async () => {
    prisma.guidelineSet.update.mockResolvedValue({ id: "g1", status: "published" });

    const result = await service.publishSet("g1");

    expect(result).toEqual({ id: "g1", status: "published" });
    expect(prisma.guidelineSet.update).toHaveBeenCalledWith({
      where: { id: "g1" },
      data: { status: "published" },
      include: { rules: true },
    });
  });

  it("returns sync metadata for seeded guidelines", async () => {
    const result = await service.syncSeededGuidelines();

    expect(result).toEqual(
      expect.objectContaining({
        synced: true,
        source: "seed",
        syncedAt: expect.any(String),
      }),
    );
  });
});
