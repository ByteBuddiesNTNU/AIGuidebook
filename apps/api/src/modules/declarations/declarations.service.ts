import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { PrismaService } from "../../prisma/prisma.service";
import { ComplianceService } from "../compliance/compliance.service";
import { PdfRenderer } from "./pdf-renderer.port";

@Injectable()
export class DeclarationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly complianceService: ComplianceService,
    @Inject("PdfRenderer")
    private readonly pdfRenderer: PdfRenderer,
  ) {}

  async generate(studentId: string, assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { aiLogs: { where: { deletedAt: null } }, course: true },
    });
    if (!assignment || assignment.deletedAt || assignment.studentId !== studentId) {
      throw new NotFoundException("Assignment not found");
    }

    const compliance = await this.complianceService.checkAssignment(studentId, assignmentId);
    const payload = {
      assignment: {
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate.toISOString(),
        course: assignment.course.name,
      },
      logs: assignment.aiLogs.map((log) => ({
        toolName: log.toolName,
        model: log.model,
        usagePurpose: log.usagePurpose,
        responseSummary: log.responseSummary,
        reflection: log.studentReflection,
      })),
      compliance: {
        result: compliance.result,
        findings: compliance.findingsJson,
      },
      generatedAt: new Date().toISOString(),
    };

    const html = this.renderDeclarationHtml(payload);
    const pdfBuffer = await this.pdfRenderer.renderHtmlToPdf(html);
    const outputDir = join(process.cwd(), "tmp", "declarations");
    mkdirSync(outputDir, { recursive: true });
    const outputPath = join(outputDir, `${assignment.id}-${Date.now()}.pdf`);
    writeFileSync(outputPath, pdfBuffer);

    return this.prisma.declaration.create({
      data: {
        institutionId: assignment.institutionId,
        assignmentId: assignment.id,
        studentId,
        version: 1,
        payloadJson: payload,
        pdfUrlOrPath: outputPath,
      },
    });
  }

  async list(studentId: string, assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.studentId !== studentId || assignment.deletedAt) {
      throw new NotFoundException("Assignment not found");
    }
    return this.prisma.declaration.findMany({
      where: { assignmentId, studentId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPdfPath(studentId: string, declarationId: string) {
    const declaration = await this.prisma.declaration.findUnique({ where: { id: declarationId } });
    if (!declaration || declaration.studentId !== studentId) {
      throw new NotFoundException("Declaration not found");
    }
    return declaration.pdfUrlOrPath;
  }

  private renderDeclarationHtml(payload: Record<string, unknown>) {
    const logs = (payload.logs as Array<Record<string, unknown>>)
      .map(
        (log) =>
          `<li><strong>${log.toolName}</strong> (${log.usagePurpose}) - ${log.responseSummary ?? ""}</li>`,
      )
      .join("");

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>AI Declaration</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111; }
      h1 { margin-bottom: 4px; }
      .meta { color: #555; margin-bottom: 16px; }
      .section { margin: 16px 0; }
    </style>
  </head>
  <body>
    <h1>AI Usage Declaration</h1>
    <div class="meta">Generated at ${(payload.generatedAt as string) ?? ""}</div>
    <div class="section"><strong>Assignment:</strong> ${(payload.assignment as Record<string, string>).title}</div>
    <div class="section"><strong>Logged AI interactions:</strong><ul>${logs}</ul></div>
    <div class="section"><strong>Compliance result:</strong> ${(payload.compliance as Record<string, string>).result}</div>
    <div class="section"><em>Template prepared for future NTNU branding.</em></div>
  </body>
</html>`;
  }
}
