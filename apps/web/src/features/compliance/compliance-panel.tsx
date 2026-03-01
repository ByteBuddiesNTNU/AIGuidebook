import { useState } from "react";
import { useAuth } from "../../app/providers/auth-provider";
import { api } from "../../lib/api";

export function CompliancePanel({ assignmentId }: { assignmentId: string }) {
  const { accessToken } = useAuth();
  const [result, setResult] = useState<string>("");

  async function runCheck() {
    if (!accessToken) return;
    const resp = await api.runCompliance(accessToken, assignmentId);
    const findings = JSON.stringify(resp.data.findingsJson);
    setResult(`${resp.data.result}: ${findings}`);
  }

  return (
    <article className="card">
      <h3>Compliance</h3>
      <button type="button" onClick={runCheck}>
        Run check
      </button>
      <p>{result}</p>
    </article>
  );
}
