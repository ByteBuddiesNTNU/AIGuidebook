import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MinLength } from "class-validator";

export class CreateAssignmentDto {
  @IsString()
  institutionId!: string;

  @IsString()
  courseId!: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsEnum(["draft", "active", "submitted"])
  status?: "draft" | "active" | "submitted";

  @IsOptional()
  @IsBoolean()
  storeRawPromptsOverride?: boolean;
}
