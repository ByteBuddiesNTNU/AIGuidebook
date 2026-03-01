type Envelope<T> = { data: T; error: { code: string; message: string } | null };

const BASE_URL = "http://localhost:3000/api/v1";

async function req<T>(path: string, init?: RequestInit): Promise<Envelope<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<Envelope<T>>;
}

function authHeader(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
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
};
