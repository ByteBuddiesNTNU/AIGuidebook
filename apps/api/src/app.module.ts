import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { InstitutionsModule } from "./modules/institutions/institutions.module";
import { CoursesModule } from "./modules/courses/courses.module";
import { AssignmentsModule } from "./modules/assignments/assignments.module";
import { AiLogsModule } from "./modules/ai-logs/ai-logs.module";
import { GuidelinesModule } from "./modules/guidelines/guidelines.module";
import { ComplianceModule } from "./modules/compliance/compliance.module";
import { DeclarationsModule } from "./modules/declarations/declarations.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { PrivacyModule } from "./modules/privacy/privacy.module";
import { AdminModule } from "./modules/admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    InstitutionsModule,
    CoursesModule,
    AssignmentsModule,
    AiLogsModule,
    GuidelinesModule,
    ComplianceModule,
    DeclarationsModule,
    AnalyticsModule,
    PrivacyModule,
    AdminModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
