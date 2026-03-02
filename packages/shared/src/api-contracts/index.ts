import type { Role, UsagePurpose } from "../domain-types/common";

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  institutionId: string;
  email: string;
  password: string;
};

export type AssignmentDto = {
  id: string;
  institutionId: string;
  courseId: string;
  studentId: string;
  title: string;
  dueDate: string;
  status: "draft" | "active" | "submitted";
};

export type AuthUserDto = {
  id: string;
  email: string;
  role: Role;
  institutionId: string;
};

export type AuthResponseDto = {
  accessToken: string;
  user: AuthUserDto;
};

export type InstitutionDto = {
  id: string;
  name: string;
  code: string;
};

export type CourseDto = {
  id: string;
  code: string;
  name: string;
  term: string;
  institutionId: string;
};

export type AssignmentListItemDto = {
  id: string;
  title: string;
  dueDate: string;
  status: "draft" | "active" | "submitted";
};

export type CreateAssignmentRequest = {
  institutionId: string;
  courseId: string;
  title: string;
  dueDate: string;
};

export type AssignmentIdResponse = {
  id: string;
};

export type AiLogListItemDto = {
  id: string;
  toolName: string;
  usagePurpose: UsagePurpose;
  responseSummary: string;
};

export type CreateAiLogRequest = {
  toolName: string;
  model?: string;
  usagePurpose: UsagePurpose;
  promptRaw?: string;
  responseSummary: string;
  studentReflection?: string;
};

export type ActiveGuidelineRuleDto = {
  id: string;
  ruleCode: string;
  title: string;
  adviceText: string;
  severity: "info" | "warning" | "high";
};

export type ActiveGuidelineSetDto = {
  id: string;
  rules: ActiveGuidelineRuleDto[];
};

export type ComplianceCheckDto = {
  id: string;
  result: "ok" | "warning";
  findingsJson: unknown;
};

export type DeclarationSummaryDto = {
  id: string;
  createdAt: string;
};

export type PrivacySettingsDto = {
  storeRawPromptsDefault: boolean;
  rawPromptRetentionDays: number;
};

export type UpdatePrivacySettingsRequest = {
  storeRawPromptsDefault?: boolean;
  rawPromptRetentionDays?: number;
};

export type UsageOverTimePointDto = {
  date: string;
  count: number;
};

export type UsageByCategoryPointDto = {
  usagePurpose: UsagePurpose;
  count: number;
};

export type GuidelineScopeType = "institution" | "course" | "assignment";
export type GuidelineSourceType = "seed" | "manual" | "sync";
export type RuleSeverity = "info" | "warning" | "high";

export type CreateGuidelineRuleRequest = {
  ruleCode: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  conditionJson: Record<string, unknown>;
  adviceText: string;
};

export type CreateGuidelineSetRequest = {
  institutionId: string;
  scopeType: GuidelineScopeType;
  courseId?: string;
  assignmentId?: string;
  version: number;
  sourceType: GuidelineSourceType;
  effectiveFrom: string;
  effectiveTo?: string;
  rules: CreateGuidelineRuleRequest[];
};

export type GuidelineSetSummaryDto = {
  id: string;
  status: "draft" | "published" | "archived";
};
