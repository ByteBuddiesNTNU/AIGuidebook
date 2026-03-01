import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../app/providers/auth-provider";
import { api } from "../../lib/api";

export function PrivacySettingsPage() {
  const { accessToken } = useAuth();
  const [storeRawPromptsDefault, setStoreRawPromptsDefault] = useState(false);
  const [rawPromptRetentionDays, setRawPromptRetentionDays] = useState(180);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    api.getPrivacySettings(accessToken).then((resp) => {
      setStoreRawPromptsDefault(resp.data.storeRawPromptsDefault);
      setRawPromptRetentionDays(resp.data.rawPromptRetentionDays);
    });
  }, [accessToken]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    await api.updatePrivacySettings(accessToken, { storeRawPromptsDefault, rawPromptRetentionDays });
    setStatus("Saved");
  }

  return (
    <section className="card">
      <h2>Privacy Settings</h2>
      <p>Data is private by default and never shared with faculty without explicit consent.</p>
      <form onSubmit={onSubmit}>
        <label>
          <input type="checkbox" checked={storeRawPromptsDefault} onChange={(e) => setStoreRawPromptsDefault(e.target.checked)} />
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
        <button type="submit">Save</button>
      </form>
      <p>{status}</p>
    </section>
  );
}
