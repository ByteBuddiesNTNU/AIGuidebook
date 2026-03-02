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
  return response.json() as Promise<Envelope<T>>;
}

async function reqBlob(path: string, init?: RequestInit): Promise<Blob> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
  });

  if (!response.ok) {
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

  return response.blob();
}

function authHeader(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  getInstitutions() {
    return req<Array<{ id: string; name: string; code: string }>>("/institutions");
  },
  register(input: { institutionId: string; email: string; password: string }) {
    return req<{ accessToken: string; user: { id: string; email: string; role: "student" | "admin"; institutionId: string } }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(input) },
    );
  },
  login(input: { email: string; password: string }) {
    return req<{ accessToken: string; user: { id: string; email: string; role: "student" | "admin"; institutionId: string } }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(input) },
    );
  },
  refresh() {
    return req<{ accessToken: string; user: { id: string; email: string; role: "student" | "admin"; institutionId: string } }>(
      "/auth/refresh",
      { method: "POST" },
    );
  },
  getMe(token: string) {
    return req<{ id: string; email: string; role: "student" | "admin"; institutionId: string }>("/auth/me", {
      headers: authHeader(token),
    });
  },
  getAssignments(token: string) {
    return req<Array<{ id: string; title: string; dueDate: string; status: string }>>("/assignments", {
      headers: authHeader(token),
    });
  },
  getCourses(token: string, institutionId?: string, term?: string) {
    const params = new URLSearchParams();
    if (institutionId) params.set("institutionId", institutionId);
    if (term) params.set("term", term);
    const query = params.toString();
    return req<Array<{ id: string; code: string; name: string; term: string; institutionId: string }>>(
      `/courses${query ? `?${query}` : ""}`,
      { headers: authHeader(token) },
    );
  },
  createAssignment(token: string, input: { institutionId: string; courseId: string; title: string; dueDate: string }) {
    return req<{ id: string }>("/assignments", {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify(input),
    });
  },
  getAssignmentLogs(token: string, assignmentId: string) {
    return req<Array<{ id: string; toolName: string; usagePurpose: string; responseSummary: string }>>(`/assignments/${assignmentId}/ai-logs`, {
      headers: authHeader(token),
    });
  },
  createAssignmentLog(
    token: string,
    assignmentId: string,
    input: {
      toolName: string;
      model?: string;
      usagePurpose: string;
      promptRaw?: string;
      responseSummary: string;
      studentReflection?: string;
    },
  ) {
    return req<{ id: string }>(`/assignments/${assignmentId}/ai-logs`, {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify(input),
    });
  },
  getActiveGuidelines(token: string, assignmentId: string) {
    return req<{ id: string; rules: Array<{ id: string; ruleCode: string; title: string; adviceText: string; severity: string }> }>(
      `/assignments/${assignmentId}/guidelines/active`,
      { headers: authHeader(token) },
    );
  },
  runCompliance(token: string, assignmentId: string) {
    return req<{ id: string; result: "ok" | "warning"; findingsJson: unknown }>(`/assignments/${assignmentId}/compliance/check`, {
      method: "POST",
      headers: authHeader(token),
    });
  },
  generateDeclaration(token: string, assignmentId: string) {
    return req<{ id: string }>(`/assignments/${assignmentId}/declarations/generate`, {
      method: "POST",
      headers: authHeader(token),
    });
  },
  listDeclarations(token: string, assignmentId: string) {
    return req<Array<{ id: string; createdAt: string }>>(`/assignments/${assignmentId}/declarations`, {
      headers: authHeader(token),
    });
  },
  getDeclarationPdf(token: string, declarationId: string) {
    return reqBlob(`/declarations/${declarationId}/pdf`, {
      headers: authHeader(token),
    });
  },
  getPrivacySettings(token: string) {
    return req<{ storeRawPromptsDefault: boolean; rawPromptRetentionDays: number }>("/privacy/settings", {
      headers: authHeader(token),
    });
  },
  updatePrivacySettings(token: string, input: { storeRawPromptsDefault?: boolean; rawPromptRetentionDays?: number }) {
    return req<{ storeRawPromptsDefault: boolean; rawPromptRetentionDays: number }>("/privacy/settings", {
      method: "PATCH",
      headers: authHeader(token),
      body: JSON.stringify(input),
    });
  },
  usageOverTime(token: string) {
    return req<Array<{ date: string; count: number }>>("/analytics/usage-over-time", {
      headers: authHeader(token),
    });
  },
  usageByCategory(token: string) {
    return req<Array<{ usagePurpose: string; count: number }>>("/analytics/usage-by-category", {
      headers: authHeader(token),
    });
  },
  createGuidelineSet(
    token: string,
    input: {
      institutionId: string;
      scopeType: "institution" | "course" | "assignment";
      courseId?: string;
      assignmentId?: string;
      version: number;
      sourceType: "seed" | "manual" | "sync";
      effectiveFrom: string;
      effectiveTo?: string;
      rules: Array<{
        ruleCode: string;
        title: string;
        description: string;
        severity: "info" | "warning" | "high";
        conditionJson: Record<string, unknown>;
        adviceText: string;
      }>;
    },
  ) {
    return req<{ id: string; status: string }>(`/admin/guidelines/sets`, {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify(input),
    });
  },
  publishGuidelineSet(token: string, setId: string) {
    return req<{ id: string; status: string }>(`/admin/guidelines/sets/${setId}/publish`, {
      method: "POST",
      headers: authHeader(token),
    });
  },
};
