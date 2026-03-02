import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "../../app/providers/auth-provider";
import { ApiError, api } from "../../lib/api";

export function PrivacySettingsPage() {
  const { accessToken, user } = useAuth();
  const [storeRawPromptsDefault, setStoreRawPromptsDefault] = useState(false);
  const [rawPromptRetentionDays, setRawPromptRetentionDays] = useState(180);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const settingsQuery = useQuery({
    queryKey: ["privacy-settings", user?.id],
    enabled: Boolean(accessToken && user?.id),
    queryFn: async () => {
      if (!accessToken) {
        throw new Error("Missing access token");
      }
      return (await api.getPrivacySettings(accessToken)).data;
    },
  });
  const saveMutation = useMutation({
    mutationFn: async (input: {
      storeRawPromptsDefault: boolean;
      rawPromptRetentionDays: number;
    }) => {
      if (!accessToken) {
        throw new Error("Missing access token");
      }
      return (await api.updatePrivacySettings(accessToken, input)).data;
    },
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setStoreRawPromptsDefault(settingsQuery.data.storeRawPromptsDefault);
    setRawPromptRetentionDays(settingsQuery.data.rawPromptRetentionDays);
  }, [settingsQuery.data]);

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    setStatus("");
    setError(null);
    try {
      await saveMutation.mutateAsync({
        storeRawPromptsDefault,
        rawPromptRetentionDays,
      });
      setStatus("Saved");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        return;
      }
      setError("Failed to save settings.");
    }
  }

  return (
    <section className="card">
      <h2>Privacy Settings</h2>
      <p>
        Data is private by default and never shared with faculty without
        explicit consent.
      </p>
      {settingsQuery.isLoading ? <p>Loading privacy settings...</p> : null}
      {settingsQuery.isError ? (
        <p className="error">Failed to load privacy settings.</p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      <form onSubmit={onSubmit}>
        <label>
          <input
            type="checkbox"
            checked={storeRawPromptsDefault}
            onChange={(e) => setStoreRawPromptsDefault(e.target.checked)}
          />
          Store raw prompts by default
        </label>
        <label>Raw prompt retention (days)</label>
        <input
          type="number"
          min={1}
          max={3650}
          value={rawPromptRetentionDays}
          onChange={(e) => setRawPromptRetentionDays(Number(e.target.value))}
        />
        <button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save"}
        </button>
      </form>
      <p>{status}</p>
    </section>
  );
}
