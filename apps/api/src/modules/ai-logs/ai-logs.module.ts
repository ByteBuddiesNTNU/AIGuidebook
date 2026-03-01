import { Module } from "@nestjs/common";
import { AiLogsController } from "./ai-logs.controller";
import { AiLogsService } from "./ai-logs.service";

@Module({
  controllers: [AiLogsController],
  providers: [AiLogsService],
  exports: [AiLogsService],
})
export class AiLogsModule {}
