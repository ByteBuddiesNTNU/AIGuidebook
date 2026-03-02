export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type ApiError = {
  code: string;
  message: string;
  details?: JsonValue;
};

export type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
  meta: {
    requestId: string;
    timestamp: string;
  };
};

export type Role = "student" | "admin";

export type UsagePurpose =
  | "brainstorming"
  | "outlining"
  | "coding_help"
  | "proofreading"
  | "translation"
  | "concept_explanation"
  | "other";
