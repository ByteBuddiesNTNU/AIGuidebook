import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";

const usagePurposes = [
  "brainstorming",
  "outlining",
  "coding_help",
  "proofreading",
  "translation",
  "concept_explanation",
  "other",
] as const;

export class CreateAiLogDto {
  @IsString()
  toolName!: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsEnum(usagePurposes)
  usagePurpose!: (typeof usagePurposes)[number];

  @IsOptional()
  @IsString()
  promptRaw?: string;

  @IsString()
  @MinLength(5)
  responseSummary!: string;

  @IsOptional()
  @IsString()
  studentReflection?: string;
}
