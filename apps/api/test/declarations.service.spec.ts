jest.mock("fs", () => {
  const actual = jest.requireActual("fs");
  return {
    ...actual,
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
  };
});

import { NotFoundException } from "@nestjs/common";
import { mkdirSync, writeFileSync } from "fs";
import { DeclarationsService } from "../src/modules/declarations/declarations.service";

describe("DeclarationsService", () => {
  const prisma = {
    assignment: { findUnique: jest.fn() },
    declaration: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  };
  const complianceService = { checkAssignment: jest.fn() };
  const pdfRenderer = { renderHtmlToPdf: jest.fn() };

  const service = new DeclarationsService(prisma as any, complianceService as any, pdfRenderer as any);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(1710000000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("generates declaration, renders PDF, writes file and persists declaration", async () => {
    prisma.assignment.findUnique.mockResolvedValue({
      id: "a1",
      title: "Essay",
      dueDate: new Date("2026-01-10T00:00:00.000Z"),
      studentId: "s1",
      institutionId: "i1",
      deletedAt: null,
      course: { name: "AI101" },
      aiLogs: [
        {
          toolName: "ChatGPT",
          model: "gpt",
          usagePurpose: "ideation",
          responseSummary: "summary",
          studentReflection: "reflection",
        },
      ],
    });
    complianceService.checkAssignment.mockResolvedValue({
      result: "warning",
      findingsJson: [{ ruleCode: "R1" }],
    });
    pdfRenderer.renderHtmlToPdf.mockResolvedValue(Buffer.from("pdf"));
    prisma.declaration.create.mockResolvedValue({ id: "d1" });

    const result = await service.generate("s1", "a1");

    expect(result).toEqual({ id: "d1" });
    expect(pdfRenderer.renderHtmlToPdf).toHaveBeenCalledWith(expect.stringContaining("AI Usage Declaration"));
    expect(mkdirSync).toHaveBeenCalledWith(expect.stringContaining("tmp"), { recursive: true });
    expect(writeFileSync).toHaveBeenCalledWith(expect.stringContaining("a1-1710000000000.pdf"), expect.any(Buffer));
    expect(prisma.declaration.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assignmentId: "a1",
          studentId: "s1",
          version: 1,
          payloadJson: expect.objectContaining({
            assignment: expect.objectContaining({ title: "Essay", course: "AI101" }),
            compliance: expect.objectContaining({ result: "warning" }),
          }),
          pdfUrlOrPath: expect.stringContaining("a1-1710000000000.pdf"),
        }),
      }),
    );
  });

  it("handles generate when assignment has zero logs", async () => {
    prisma.assignment.findUnique.mockResolvedValue({
      id: "a2",
      title: "Lab",
      dueDate: new Date("2026-01-11T00:00:00.000Z"),
      studentId: "s1",
      institutionId: "i1",
      deletedAt: null,
      course: { name: "AI102" },
      aiLogs: [],
    });
    complianceService.checkAssignment.mockResolvedValue({
      result: "ok",
      findingsJson: [],
    });
    pdfRenderer.renderHtmlToPdf.mockResolvedValue(Buffer.from("pdf"));
    prisma.declaration.create.mockResolvedValue({ id: "d2" });

    await service.generate("s1", "a2");

    expect(prisma.declaration.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          payloadJson: expect.objectContaining({
            logs: [],
            compliance: expect.objectContaining({ result: "ok", findings: [] }),
          }),
        }),
      }),
    );
  });

  it("throws NotFoundException when generate assignment is missing", async () => {
    prisma.assignment.findUnique.mockResolvedValue(null);

    await expect(service.generate("s1", "missing")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("throws NotFoundException when generate assignment belongs to another student", async () => {
    prisma.assignment.findUnique.mockResolvedValue({
      id: "a1",
      studentId: "other",
      deletedAt: null,
    });

    await expect(service.generate("s1", "a1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("lists declarations by assignment for owner", async () => {
    prisma.assignment.findUnique.mockResolvedValue({
      id: "a1",
      studentId: "s1",
      deletedAt: null,
    });
    prisma.declaration.findMany.mockResolvedValue([{ id: "d1" }]);

    const result = await service.list("s1", "a1");

    expect(result).toEqual([{ id: "d1" }]);
    expect(prisma.declaration.findMany).toHaveBeenCalledWith({
      where: { assignmentId: "a1", studentId: "s1" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("throws NotFoundException when listing declarations for missing assignment", async () => {
    prisma.assignment.findUnique.mockResolvedValue(null);

    await expect(service.list("s1", "a1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns declaration PDF path for owner", async () => {
    prisma.declaration.findUnique.mockResolvedValue({
      id: "d1",
      studentId: "s1",
      pdfUrlOrPath: "/tmp/file.pdf",
    });

    const result = await service.getPdfPath("s1", "d1");

    expect(result).toBe("/tmp/file.pdf");
  });

  it("throws NotFoundException when declaration is missing in getPdfPath", async () => {
    prisma.declaration.findUnique.mockResolvedValue(null);

    await expect(service.getPdfPath("s1", "d1")).rejects.toBeInstanceOf(NotFoundException);
  });
});
