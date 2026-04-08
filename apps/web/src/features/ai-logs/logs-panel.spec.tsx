import { screen } from "@testing-library/react";
import { vi } from "vitest";
import { LogsPanel } from "./logs-panel";
import { renderWithQueryClient } from "../../test/render-with-query-client";

// Traceability note:
// TC7/FR7: AI logs are organized and displayed per assignment context.
const apiMocks = vi.hoisted(() => ({
  getAssignmentLogs: vi.fn(),
}));

vi.mock("../../app/providers/auth-provider", () => ({
  useAuth: () => ({ accessToken: "token" }),
}));

vi.mock("../../lib/api", () => ({
  api: {
    getAssignmentLogs: apiMocks.getAssignmentLogs,
  },
}));

describe("LogsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("[TC7][FR7] renders logs for the selected assignment", async () => {
    apiMocks.getAssignmentLogs.mockResolvedValue({
      data: [
        { id: "l1", usagePurpose: "research", responseSummary: "Summarized article" },
        { id: "l2", usagePurpose: "debug", responseSummary: "Fixed type errors" },
      ],
    });

    renderWithQueryClient(<LogsPanel assignmentId="a1" />);

    expect(await screen.findByText("research")).toBeInTheDocument();
    expect(await screen.findByText("debug")).toBeInTheDocument();
    expect(apiMocks.getAssignmentLogs).toHaveBeenCalledWith("token", "a1");
  });
});
