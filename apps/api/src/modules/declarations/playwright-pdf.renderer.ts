import { Injectable } from "@nestjs/common";
import { chromium } from "playwright";
import { PdfRenderer } from "./pdf-renderer.port";

@Injectable()
export class PlaywrightPdfRenderer implements PdfRenderer {
  async renderHtmlToPdf(html: string): Promise<Buffer> {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle" });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "24px", right: "24px", bottom: "24px", left: "24px" },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
