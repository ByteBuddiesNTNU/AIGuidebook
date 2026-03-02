import type {
  ActiveGuidelineSetDto,
  AiLogListItemDto,
  AssignmentIdResponse,
  AssignmentListItemDto,
  AuthResponseDto,
  AuthUserDto,
  ComplianceCheckDto,
  CourseDto,
  CreateAiLogRequest,
  CreateAssignmentRequest,
  CreateGuidelineSetRequest,
  DeclarationSummaryDto,
  GuidelineSetSummaryDto,
  InstitutionDto,
  LoginRequest,
  PrivacySettingsDto,
  RegisterRequest,
  UpdatePrivacySettingsRequest,
  UsageByCategoryPointDto,
  UsageOverTimePointDto,
} from "@aiguidebook/shared";

type Envelope<T> = { data: T; error: { code: string; message: string } | null };

const BASE_URL = "http://localhost:3000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<Envelope<T>> {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    await throwResponseError(response);
  }

  return response.json() as Promise<Envelope<T>>;
}

async function reqBlob(path: string, init?: RequestInit): Promise<Blob> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
  });

  if (!response.ok) {
    await throwResponseError(response);
  }

  return response.blob();
}

async function throwResponseError(response: Response) {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  let message = `Request failed: ${response.status}`;
  if (payload && typeof payload === "object" && "message" in payload) {
    const rawMessage = (payload as { message?: unknown }).message;
    if (Array.isArray(rawMessage)) {
      message = rawMessage.join(", ");
    } else if (typeof rawMessage === "string") {
      message = rawMessage;
    }
  }

  throw new ApiError(message, response.status, payload);
}

function authHeader(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  getInstitutions() {
    return req<InstitutionDto[]>("/institutions");
  },
  register(input: RegisterRequest) {
    return req<AuthResponseDto>("/auth/register", { method: "POST", body: JSON.stringify(input) });
  },
  login(input: LoginRequest) {
    return req<AuthResponseDto>("/auth/login", { method: "POST", body: JSON.stringify(input) });
  },
  refresh() {
    return req<AuthResponseDto>("/auth/refresh", { method: "POST" });
  },
  getMe(token: string) {
    return req<AuthUserDto>("/auth/me", {
      headers: authHeader(token),
    });
  },
  getAssignments(token: string) {
    return req<AssignmentListItemDto[]>("/assignments", {
      headers: authHeader(token),
    });
  },
  getCourses(token: string, institutionId?: string, term?: string) {
    const params = new URLSearchParams();
    if (institutionId) params.set("institutionId", institutionId);
    if (term) params.set("term", term);
    const query = params.toString();
    return req<CourseDto[]>(`/courses${query ? `?${query}` : ""}`, { headers: authHeader(token) });
  },
  createAssignment(token: string, input: CreateAssignmentRequest) {
    return req<AssignmentIdResponse>("/assignments", {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify(input),
    });
  },
  getAssignmentLogs(token: string, assignmentId: string) {
    return req<AiLogListItemDto[]>(`/assignments/${assignmentId}/ai-logs`, {
      headers: authHeader(token),
    });
  },
  createAssignmentLog(token: string, assignmentId: string, input: CreateAiLogRequest) {
    return req<AssignmentIdResponse>(`/assignments/${assignmentId}/ai-logs`, {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify(input),
    });
  },
  getActiveGuidelines(token: string, assignmentId: string) {
    return req<ActiveGuidelineSetDto>(`/assignments/${assignmentId}/guidelines/active`, { headers: authHeader(token) });
  },
  runCompliance(token: string, assignmentId: string) {
    return req<ComplianceCheckDto>(`/assignments/${assignmentId}/compliance/check`, {
      method: "POST",
      headers: authHeader(token),
    });
  },
  generateDeclaration(token: string, assignmentId: string) {
    return req<AssignmentIdResponse>(`/assignments/${assignmentId}/declarations/generate`, {
      method: "POST",
      headers: authHeader(token),
    });
  },
  listDeclarations(token: string, assignmentId: string) {
    return req<DeclarationSummaryDto[]>(`/assignments/${assignmentId}/declarations`, {
      headers: authHeader(token),
    });
  },
  getDeclarationPdf(token: string, declarationId: string) {
    return reqBlob(`/declarations/${declarationId}/pdf`, {
      headers: authHeader(token),
    });
  },
  getPrivacySettings(token: string) {
    return req<PrivacySettingsDto>("/privacy/settings", {
      headers: authHeader(token),
    });
  },
  updatePrivacySettings(token: string, input: UpdatePrivacySettingsRequest) {
    return req<PrivacySettingsDto>("/privacy/settings", {
      method: "PATCH",
      headers: authHeader(token),
      body: JSON.stringify(input),
    });
  },
  usageOverTime(token: string) {
    return req<UsageOverTimePointDto[]>("/analytics/usage-over-time", {
      headers: authHeader(token),
    });
  },
  usageByCategory(token: string) {
    return req<UsageByCategoryPointDto[]>("/analytics/usage-by-category", {
      headers: authHeader(token),
    });
  },
  createGuidelineSet(token: string, input: CreateGuidelineSetRequest) {
    return req<GuidelineSetSummaryDto>(`/admin/guidelines/sets`, {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify(input),
    });
  },
  publishGuidelineSet(token: string, setId: string) {
    return req<GuidelineSetSummaryDto>(`/admin/guidelines/sets/${setId}/publish`, {
      method: "POST",
      headers: authHeader(token),
    });
  },
};
