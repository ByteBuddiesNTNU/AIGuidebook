import { screen } from "@testing-library/react";
import { vi } from "vitest";
import { AnalyticsPage } from "./analytics-page";
import { renderWithQueryClient } from "../../test/render-with-query-client";

// Traceability note:
// TC6/FR6: usage-over-time visualization renders for the user.
const apiMocks = vi.hoisted(() => ({
  usageOverTime: vi.fn(),
  usageByCategory: vi.fn(),
}));

vi.mock("../../app/providers/auth-provider", () => ({
  useAuth: () => ({ accessToken: "token" }),
}));

vi.mock("../../lib/api", () => ({
  api: {
    usageOverTime: apiMocks.usageOverTime,
    usageByCategory: apiMocks.usageByCategory,
  },
}));

describe("AnalyticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("[TC6][FR6] renders usage over time and usage by category", async () => {
    apiMocks.usageOverTime.mockResolvedValue({ data: [{ date: "2026-01-01", count: 2 }] });
    apiMocks.usageByCategory.mockResolvedValue({ data: [{ usagePurpose: "research", count: 2 }] });

    renderWithQueryClient(<AnalyticsPage />);

    expect(screen.getByRole("heading", { name: "Analytics" })).toBeInTheDocument();
    expect(await screen.findByText("2026-01-01: 2")).toBeInTheDocument();
    expect(await screen.findByText("research: 2")).toBeInTheDocument();
  });
});
