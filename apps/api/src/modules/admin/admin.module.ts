import { Module } from "@nestjs/common";
import { GuidelinesModule } from "../guidelines/guidelines.module";
import { PrivacyModule } from "../privacy/privacy.module";
import { AdminController } from "./admin.controller";

@Module({
  imports: [GuidelinesModule, PrivacyModule],
  controllers: [AdminController],
})
export class AdminModule {}
