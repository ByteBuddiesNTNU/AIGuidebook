import { fireEvent, screen } from "@testing-library/react";
import { vi } from "vitest";
import { CompliancePanel } from "./compliance-panel";
import { renderWithQueryClient } from "../../test/render-with-query-client";

// Traceability note:
// TC12/NFR4: compliance feedback is presented as guidance.
const apiMocks = vi.hoisted(() => ({
  runCompliance: vi.fn(),
}));

vi.mock("../../app/providers/auth-provider", () => ({
  useAuth: () => ({ accessToken: "token" }),
}));

vi.mock("../../lib/api", () => ({
  api: {
    runCompliance: apiMocks.runCompliance,
  },
}));

describe("CompliancePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("[TC12][NFR4] renders supportive compliance guidance from findings", async () => {
    apiMocks.runCompliance.mockResolvedValue({
      data: {
        result: "warning",
        findingsJson: [
          {
            ruleCode: "R1",
            severity: "warning",
            message: "Consider adding more reflection details.",
            matchedCondition: { requireReflection: true },
          },
        ],
      },
    });

    renderWithQueryClient(<CompliancePanel assignmentId="a1" />);

    fireEvent.click(screen.getByRole("button", { name: "Run check" }));

    expect(await screen.findByText("Result: WARNING")).toBeInTheDocument();
    expect(await screen.findByText(/Consider adding more reflection details\./i)).toBeInTheDocument();
  });
});
