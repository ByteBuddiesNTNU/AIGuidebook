import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../app/providers/auth-provider";
import { ApiError, api } from "../../lib/api";

export function DeclarationPanel({ assignmentId }: { assignmentId: string }) {
  const { accessToken } = useAuth();
  const [latestDeclarationId, setLatestDeclarationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!accessToken) return;
    setError(null);
    try {
      const created = await api.generateDeclaration(accessToken, assignmentId);
      setLatestDeclarationId(created.data.id);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        return;
      }
      setError("Failed to generate declaration.");
    }
  }

  async function openPdf() {
    if (!accessToken || !latestDeclarationId) return;
    setError(null);
    try {
      const blob = await api.getDeclarationPdf(accessToken, latestDeclarationId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        return;
      }
      setError("Failed to open PDF.");
    }
  }

  return (
    <article className="card">
      <h3>Declaration</h3>
      <button type="button" onClick={generate}>
        Generate declaration PDF
      </button>
      {error ? <p style={{ color: "#b00020" }}>{error}</p> : null}
      {latestDeclarationId ? (
        <p>
          <button type="button" onClick={openPdf}>
            Open PDF
          </button>
        </p>
      ) : null}
      <Link to={`/assignments/${assignmentId}/declaration/preview`}>Preview route</Link>
    </article>
  );
}
