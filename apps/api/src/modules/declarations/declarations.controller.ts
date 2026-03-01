import { Controller, Get, Param, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { createReadStream, existsSync } from "fs";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { DeclarationsService } from "./declarations.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class DeclarationsController {
  constructor(private readonly declarationsService: DeclarationsService) {}

  @Post("assignments/:id/declarations/generate")
  async generate(@Req() req: Request, @Param("id") assignmentId: string) {
    const user = req.user as { sub: string };
    return this.ok(await this.declarationsService.generate(user.sub, assignmentId));
  }

  @Get("assignments/:id/declarations")
  async list(@Req() req: Request, @Param("id") assignmentId: string) {
    const user = req.user as { sub: string };
    return this.ok(await this.declarationsService.list(user.sub, assignmentId));
  }

  @Get("declarations/:id/pdf")
  async getPdf(@Req() req: Request, @Param("id") declarationId: string, @Res() res: Response) {
    const user = req.user as { sub: string };
    const path = await this.declarationsService.getPdfPath(user.sub, declarationId);
    if (!existsSync(path)) {
      return res.status(404).json({ data: null, error: { code: "PDF_NOT_FOUND", message: "PDF file not found" }, meta: this.meta() });
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=declaration.pdf");
    createReadStream(path).pipe(res);
  }

  private ok(data: unknown) {
    return { data, error: null, meta: this.meta() };
  }

  private meta() {
    return { requestId: randomUUID(), timestamp: new Date().toISOString() };
  }
}
