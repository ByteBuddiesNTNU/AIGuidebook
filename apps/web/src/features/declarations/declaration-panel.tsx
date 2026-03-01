import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../app/providers/auth-provider";
import { api } from "../../lib/api";

export function DeclarationPanel({ assignmentId }: { assignmentId: string }) {
  const { accessToken } = useAuth();
  const [latestDeclarationId, setLatestDeclarationId] = useState<string | null>(null);

  async function generate() {
    if (!accessToken) return;
    const created = await api.generateDeclaration(accessToken, assignmentId);
    setLatestDeclarationId(created.data.id);
  }

  return (
    <article className="card">
      <h3>Declaration</h3>
      <button type="button" onClick={generate}>
        Generate declaration PDF
      </button>
      {latestDeclarationId ? (
        <p>
          <a href={`http://localhost:3000/api/v1/declarations/${latestDeclarationId}/pdf`} target="_blank" rel="noreferrer">
            Open PDF
          </a>
        </p>
      ) : null}
      <Link to={`/assignments/${assignmentId}/declaration/preview`}>Preview route</Link>
    </article>
  );
}
