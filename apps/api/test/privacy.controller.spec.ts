import { PrivacyController } from "../src/modules/privacy/privacy.controller";

describe("PrivacyController", () => {
  const privacyService = {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
    exportMetadata: jest.fn(),
  };

  const controller = new PrivacyController(privacyService as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("[TC8][FR8] returns export payload envelope for authenticated user", async () => {
    privacyService.exportMetadata.mockResolvedValue({
      studentId: "s1",
      generatedAt: "2026-01-01T00:00:00.000Z",
      counts: { assignments: 1, logs: 1, declarations: 0 },
      data: {
        assignments: [{ id: "a1" }],
        logs: [{ id: "l1" }],
        declarations: [],
      },
    });

    const result = await controller.exportData({ user: { sub: "s1" } } as any);

    expect(privacyService.exportMetadata).toHaveBeenCalledWith("s1");
    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          studentId: "s1",
          counts: { assignments: 1, logs: 1, declarations: 0 },
          data: {
            assignments: [{ id: "a1" }],
            logs: [{ id: "l1" }],
            declarations: [],
          },
        }),
        error: null,
        meta: expect.objectContaining({ requestId: expect.any(String), timestamp: expect.any(String) }),
      }),
    );
  });
});
