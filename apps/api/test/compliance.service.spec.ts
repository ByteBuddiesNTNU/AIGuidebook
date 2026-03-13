import { NotFoundException } from "@nestjs/common";
import { ComplianceResult } from "@prisma/client";
import { ComplianceService } from "../src/modules/compliance/compliance.service";

describe("ComplianceService", () => {
  const prisma = {
    assignment: { findUnique: jest.fn() },
    complianceCheck: { create: jest.fn(), findFirst: jest.fn() },
  };
  const guidelinesService = { getActiveForAssignment: jest.fn() };

  const service = new ComplianceService(prisma as any, guidelinesService as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws NotFoundException when assignment does not exist", async () => {
    prisma.assignment.findUnique.mockResolvedValue(null);

    await expect(service.checkAssignment("s1", "a1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("throws NotFoundException when assignment belongs to another student", async () => {
    prisma.assignment.findUnique.mockResolvedValue({
      id: "a1",
      studentId: "other",
      deletedAt: null,
    });

    await expect(service.checkAssignment("s1", "a1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns virtual ok check when no active guideline set exists", async () => {
    prisma.assignment.findUnique.mockResolvedValue({
      id: "a1",
      institutionId: "i1",
      studentId: "s1",
      deletedAt: null,
      aiLogs: [],
    });
    guidelinesService.getActiveForAssignment.mockResolvedValue(null);

    const result = await service.checkAssignment("s1", "a1");

    expect(result).toEqual(
      expect.objectContaining({
        id: "virtual-no-guideline",
        result: ComplianceResult.ok,
        findingsJson: [],
      }),
    );
    expect(prisma.complianceCheck.create).not.toHaveBeenCalled();
  });

  it("creates warning compliance result when rule conditions are matched", async () => {
    prisma.assignment.findUnique.mockResolvedValue({
      id: "a1",
      institutionId: "i1",
      studentId: "s1",
      deletedAt: null,
      aiLogs: [
        { usagePurpose: "forbidden-purpose", promptRaw: null, rawPromptStored: false },
        { usagePurpose: "research", promptRaw: null, rawPromptStored: false },
      ],
    });
    guidelinesService.getActiveForAssignment.mockResolvedValue({
      id: "g1",
      rules: [
        {
          ruleCode: "R1",
          severity: "warning",
          adviceText: "Do less AI",
          conditionJson: {
            maxLogs: 1,
            disallowedPurpose: "forbidden-purpose",
            requireReflection: true,
          },
        },
      ],
    });
    prisma.complianceCheck.create.mockResolvedValue({ id: "c1", result: ComplianceResult.warning });

    const result = await service.checkAssignment("s1", "a1");

    expect(result).toEqual({ id: "c1", result: ComplianceResult.warning });
    expect(prisma.complianceCheck.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assignmentId: "a1",
          result: ComplianceResult.warning,
          findingsJson: expect.arrayContaining([
            expect.objectContaining({ ruleCode: "R1", matchedCondition: expect.objectContaining({ maxLogs: 1 }) }),
            expect.objectContaining({
              ruleCode: "R1",
              matchedCondition: expect.objectContaining({ disallowedPurpose: "forbidden-purpose" }),
            }),
            expect.objectContaining({
              ruleCode: "R1",
              matchedCondition: expect.objectContaining({ requireReflection: true }),
            }),
          ]),
        }),
      }),
    );
  });

  it("creates ok compliance result when no rule conditions are matched", async () => {
    prisma.assignment.findUnique.mockResolvedValue({
      id: "a1",
      institutionId: "i1",
      studentId: "s1",
      deletedAt: null,
      aiLogs: [{ usagePurpose: "research", promptRaw: "present", rawPromptStored: true }],
    });
    guidelinesService.getActiveForAssignment.mockResolvedValue({
      id: "g1",
      rules: [
        {
          ruleCode: "R2",
          severity: "info",
          adviceText: "Looks good",
          conditionJson: { maxLogs: 5, disallowedPurpose: "plagiarism", requireReflection: true },
        },
      ],
    });
    prisma.complianceCheck.create.mockResolvedValue({ id: "c2", result: ComplianceResult.ok });

    const result = await service.checkAssignment("s1", "a1");

    expect(result).toEqual({ id: "c2", result: ComplianceResult.ok });
    expect(prisma.complianceCheck.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          result: ComplianceResult.ok,
          findingsJson: [],
        }),
      }),
    );
  });

  it("returns latest compliance check for owned assignment", async () => {
    prisma.assignment.findUnique.mockResolvedValue({
      id: "a1",
      studentId: "s1",
      deletedAt: null,
    });
    prisma.complianceCheck.findFirst.mockResolvedValue({ id: "latest" });

    const result = await service.latest("s1", "a1");

    expect(result).toEqual({ id: "latest" });
    expect(prisma.complianceCheck.findFirst).toHaveBeenCalledWith({
      where: { assignmentId: "a1", studentId: "s1" },
      orderBy: { runAt: "desc" },
    });
  });

  it("throws NotFoundException in latest when assignment is deleted", async () => {
    prisma.assignment.findUnique.mockResolvedValue({
      id: "a1",
      studentId: "s1",
      deletedAt: new Date(),
    });

    await expect(service.latest("s1", "a1")).rejects.toBeInstanceOf(NotFoundException);
  });
});
