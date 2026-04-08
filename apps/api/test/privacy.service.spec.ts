import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PrivacyService } from "../src/modules/privacy/privacy.service";

// Traceability notes:
// TC8/FR8: user data export payload generation.
// TC13/NFR5: retention workflow for GDPR-aligned data handling.
describe("PrivacyService", () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    assignment: { findMany: jest.fn() },
    declaration: { findMany: jest.fn() },
    aIInteractionLog: { findMany: jest.fn(), updateMany: jest.fn() },
    studentPrivacySetting: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    retentionJobRun: { create: jest.fn(), update: jest.fn() },
  };

  const service = new PrivacyService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns existing privacy settings", async () => {
    prisma.studentPrivacySetting.findUnique.mockResolvedValue({ studentId: "s1", rawPromptRetentionDays: 180 });

    const result = await service.getSettings("s1");

    expect(result).toEqual({ studentId: "s1", rawPromptRetentionDays: 180 });
    expect(prisma.studentPrivacySetting.create).not.toHaveBeenCalled();
  });

  it("creates default settings when missing", async () => {
    prisma.studentPrivacySetting.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue({ id: "s1", institutionId: "i1" });
    prisma.studentPrivacySetting.create.mockResolvedValue({ studentId: "s1", institutionId: "i1", rawPromptRetentionDays: 180 });

    const result = await service.getSettings("s1");

    expect(result).toEqual({ studentId: "s1", institutionId: "i1", rawPromptRetentionDays: 180 });
    expect(prisma.studentPrivacySetting.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ studentId: "s1", institutionId: "i1" }) }),
    );
  });

  it("throws NotFoundException when user is missing while creating settings", async () => {
    prisma.studentPrivacySetting.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getSettings("s1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("updates privacy settings within retention bounds", async () => {
    prisma.studentPrivacySetting.findUnique.mockResolvedValue({
      studentId: "s1",
      storeRawPromptsDefault: false,
      rawPromptRetentionDays: 180,
    });
    prisma.studentPrivacySetting.update.mockResolvedValue({ studentId: "s1", storeRawPromptsDefault: true, rawPromptRetentionDays: 365 });

    const result = await service.updateSettings("s1", { storeRawPromptsDefault: true, rawPromptRetentionDays: 365 });

    expect(result).toEqual({ studentId: "s1", storeRawPromptsDefault: true, rawPromptRetentionDays: 365 });
    expect(prisma.studentPrivacySetting.update).toHaveBeenCalledWith({
      where: { studentId: "s1" },
      data: {
        storeRawPromptsDefault: true,
        rawPromptRetentionDays: 365,
      },
    });
  });

  it("rejects out-of-range retention settings", async () => {
    prisma.studentPrivacySetting.findUnique.mockResolvedValue({
      studentId: "s1",
      storeRawPromptsDefault: false,
      rawPromptRetentionDays: 180,
    });

    await expect(service.updateSettings("s1", { rawPromptRetentionDays: 0 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("[TC8][FR8] exports user data with records and counts", async () => {
    prisma.assignment.findMany.mockResolvedValue([
      { id: "a1", title: "Essay" },
      { id: "a2", title: "Lab" },
    ]);
    prisma.aIInteractionLog.findMany.mockResolvedValue([
      { id: "l1", assignmentId: "a1", usagePurpose: "brainstorming" },
      { id: "l2", assignmentId: "a2", usagePurpose: "coding_help" },
    ]);
    prisma.declaration.findMany.mockResolvedValue([{ id: "d1", assignmentId: "a1", version: 1 }]);

    const result = await service.exportMetadata("s1");

    expect(result).toEqual(
      expect.objectContaining({
        studentId: "s1",
        counts: { assignments: 2, logs: 2, declarations: 1 },
        data: {
          assignments: [{ id: "a1", title: "Essay" }, { id: "a2", title: "Lab" }],
          logs: [
            { id: "l1", assignmentId: "a1", usagePurpose: "brainstorming" },
            { id: "l2", assignmentId: "a2", usagePurpose: "coding_help" },
          ],
          declarations: [{ id: "d1", assignmentId: "a1", version: 1 }],
        },
      }),
    );
    expect(prisma.assignment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { studentId: "s1", deletedAt: null } }));
    expect(prisma.aIInteractionLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { studentId: "s1", deletedAt: null } }));
    expect(prisma.declaration.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { studentId: "s1" } }));
  });

  it("[TC13][NFR5] runs retention and marks completed with deleted count", async () => {
    prisma.retentionJobRun.create.mockResolvedValue({ id: "run1" });
    prisma.studentPrivacySetting.findMany.mockResolvedValue([
      { studentId: "s1", rawPromptRetentionDays: 180 },
      { studentId: "s2", rawPromptRetentionDays: 90 },
    ]);
    prisma.aIInteractionLog.updateMany.mockResolvedValueOnce({ count: 3 }).mockResolvedValueOnce({ count: 2 });
    prisma.retentionJobRun.update.mockResolvedValue({ id: "run1", status: "completed", deletedCount: 5 });

    const result = await service.runRetentionNow();

    expect(result).toEqual({ id: "run1", status: "completed", deletedCount: 5 });
    expect(prisma.aIInteractionLog.updateMany).toHaveBeenCalledTimes(2);
    expect(prisma.retentionJobRun.update).toHaveBeenCalledWith({
      where: { id: "run1" },
      data: { status: "completed", finishedAt: expect.any(Date), deletedCount: 5 },
    });
  });

  it("marks retention run as failed when cleanup throws", async () => {
    prisma.retentionJobRun.create.mockResolvedValue({ id: "run2" });
    prisma.studentPrivacySetting.findMany.mockRejectedValue(new Error("db down"));
    prisma.retentionJobRun.update.mockResolvedValue({ id: "run2", status: "failed" });

    const result = await service.runRetentionNow();

    expect(result).toEqual({ id: "run2", status: "failed" });
    expect(prisma.retentionJobRun.update).toHaveBeenCalledWith({
      where: { id: "run2" },
      data: {
        status: "failed",
        finishedAt: expect.any(Date),
        error: expect.stringContaining("db down"),
      },
    });
  });
});
