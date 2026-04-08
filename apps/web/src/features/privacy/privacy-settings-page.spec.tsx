import { fireEvent, screen } from "@testing-library/react";
import { vi } from "vitest";
import { PrivacySettingsPage } from "./privacy-settings-page";
import { renderWithQueryClient } from "../../test/render-with-query-client";

// Traceability note:
// TC11/NFR2: transparency text about data policy is visible in UI.
const apiMocks = vi.hoisted(() => ({
  getPrivacySettings: vi.fn(),
  updatePrivacySettings: vi.fn(),
}));

vi.mock("../../app/providers/auth-provider", () => ({
  useAuth: () => ({ accessToken: "token", user: { id: "s1" } }),
}));

vi.mock("../../lib/api", () => ({
  ApiError: class ApiError extends Error {},
  api: {
    getPrivacySettings: apiMocks.getPrivacySettings,
    updatePrivacySettings: apiMocks.updatePrivacySettings,
  },
}));

describe("PrivacySettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("[TC11][NFR2] shows transparency explanation and saves settings", async () => {
    apiMocks.getPrivacySettings.mockResolvedValue({
      data: { storeRawPromptsDefault: false, rawPromptRetentionDays: 180 },
    });
    apiMocks.updatePrivacySettings.mockResolvedValue({
      data: { storeRawPromptsDefault: true, rawPromptRetentionDays: 365 },
    });

    renderWithQueryClient(<PrivacySettingsPage />);

    expect(screen.getByText(/Data is private by default/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Saved")).toBeInTheDocument();
    expect(apiMocks.updatePrivacySettings).toHaveBeenCalledWith("token", {
      storeRawPromptsDefault: false,
      rawPromptRetentionDays: 180,
    });
  });
});
