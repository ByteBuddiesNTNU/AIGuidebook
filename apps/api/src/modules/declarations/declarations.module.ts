import { Module } from "@nestjs/common";
import { ComplianceModule } from "../compliance/compliance.module";
import { DeclarationsController } from "./declarations.controller";
import { DeclarationsService } from "./declarations.service";
import { PlaywrightPdfRenderer } from "./playwright-pdf.renderer";

@Module({
  imports: [ComplianceModule],
  controllers: [DeclarationsController],
  providers: [
    DeclarationsService,
    {
      provide: "PdfRenderer",
      useClass: PlaywrightPdfRenderer,
    },
  ],
  exports: [DeclarationsService],
})
export class DeclarationsModule {}
