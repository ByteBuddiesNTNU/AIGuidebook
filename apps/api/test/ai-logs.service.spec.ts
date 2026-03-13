import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { AiLogsService } from "../src/modules/ai-logs/ai-logs.service";

describe("AiLogsService", () => {
  const prisma = {
    assignment: { findUnique: jest.fn() },
    studentPrivacySetting: { findUnique: jest.fn() },
    aIInteractionLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const service = new AiLogsService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a log and stores raw prompt when assignment override is true", async () => {
    prisma.assignment.findUnique.mockResolvedValue({
      id: "a1",
      studentId: "u1",
      institutionId: "i1",
      storeRawPromptsOverride: true,
      deletedAt: null,
    });
    prisma.studentPrivacySetting.findUnique.mockResolvedValue({ storeRawPromptsDefault: false });
    prisma.aIInteractionLog.create.mockResolvedValue({ id: "l1" });

    const dto = {
      toolName: "ChatGPT",
      model: "gpt",
      usagePurpose: "ideation",
      promptRaw: "raw",
      responseSummary: "summary",
      studentReflection: "reflection",
    };

    const result = await service.create("u1", "a1", dto as any);

    expect(result).toEqual({ id: "l1" });
    expect(prisma.aIInteractionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assignmentId: "a1",
          studentId: "u1",
          rawPromptStored: true,
          promptRaw: "raw",
        }),
      }),
    );
  });

  it("creates a log and strips raw prompt when no override and privacy default false", async () => {
    prisma.assignment.findUnique.mockResolvedValue({
      id: "a1",
      studentId: "u1",
      institutionId: "i1",
      storeRawPromptsOverride: null,
      deletedAt: null,
    });
    prisma.studentPrivacySetting.findUnique.mockResolvedValue({ storeRawPromptsDefault: false });
    prisma.aIInteractionLog.create.mockResolvedValue({ id: "l2" });

    await service.create("u1", "a1", {
      toolName: "Copilot",
      model: "x",
      usagePurpose: "debug",
      promptRaw: "sensitive",
      responseSummary: "summary",
      studentReflection: "reflection",
    } as any);

    expect(prisma.aIInteractionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rawPromptStored: false,
          promptRaw: null,
        }),
      }),
    );
  });

  it("throws NotFoundException when create assignment does not exist", async () => {
    prisma.assignment.findUnique.mockResolvedValue(null);

    await expect(service.create("u1", "missing", {} as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("throws ForbiddenException when create assignment owner differs", async () => {
    prisma.assignment.findUnique.mockResolvedValue({
      id: "a1",
      studentId: "owner",
      institutionId: "i1",
      storeRawPromptsOverride: false,
      deletedAt: null,
    });

    await expect(service.create("u1", "a1", {} as any)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("lists logs by assignment for owner", async () => {
    prisma.assignment.findUnique.mockResolvedValue({
      id: "a1",
      studentId: "u1",
      deletedAt: null,
    });
    prisma.aIInteractionLog.findMany.mockResolvedValue([{ id: "l1" }]);

    const result = await service.listByAssignment("u1", "a1");

    expect(result).toEqual([{ id: "l1" }]);
    expect(prisma.aIInteractionLog.findMany).toHaveBeenCalledWith({
      where: { assignmentId: "a1", studentId: "u1", deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  });

  it("throws NotFoundException when listing logs for deleted assignment", async () => {
    prisma.assignment.findUnique.mockResolvedValue({ id: "a1", studentId: "u1", deletedAt: new Date() });

    await expect(service.listByAssignment("u1", "a1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("updates an existing log for owner", async () => {
    prisma.aIInteractionLog.findUnique.mockResolvedValue({ id: "l1", studentId: "u1", deletedAt: null });
    prisma.aIInteractionLog.update.mockResolvedValue({ id: "l1", toolName: "new" });

    const result = await service.update("u1", "l1", { toolName: "new" } as any);

    expect(result).toEqual({ id: "l1", toolName: "new" });
    expect(prisma.aIInteractionLog.update).toHaveBeenCalledWith({
      where: { id: "l1" },
      data: {
        toolName: "new",
        model: undefined,
        usagePurpose: undefined,
        promptRaw: undefined,
        responseSummary: undefined,
        studentReflection: undefined,
      },
    });
  });

  it("throws NotFoundException when updating a missing log", async () => {
    prisma.aIInteractionLog.findUnique.mockResolvedValue(null);

    await expect(service.update("u1", "missing", {} as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("throws ForbiddenException when updating another users log", async () => {
    prisma.aIInteractionLog.findUnique.mockResolvedValue({ id: "l1", studentId: "other", deletedAt: null });

    await expect(service.update("u1", "l1", {} as any)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("soft deletes a log and returns deleted marker", async () => {
    prisma.aIInteractionLog.findUnique.mockResolvedValue({ id: "l1", studentId: "u1", deletedAt: null });
    prisma.aIInteractionLog.update.mockResolvedValue({});

    const result = await service.remove("u1", "l1");

    expect(result).toEqual({ id: "l1", deleted: true });
    expect(prisma.aIInteractionLog.update).toHaveBeenCalledWith({
      where: { id: "l1" },
      data: { deletedAt: expect.any(Date), promptRaw: null },
    });
  });
});
