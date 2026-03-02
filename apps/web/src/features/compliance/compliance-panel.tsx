import { useState } from "react";
import type { ComplianceFindingDto } from "@aiguidebook/shared";
import { useAuth } from "../../app/providers/auth-provider";
import { api } from "../../lib/api";

export function CompliancePanel({ assignmentId }: { assignmentId: string }) {
  const { accessToken } = useAuth();
  const [result, setResult] = useState<"ok" | "warning" | "">("");
  const [findings, setFindings] = useState<ComplianceFindingDto[]>([]);

  async function runCheck() {
    if (!accessToken) return;
    const resp = await api.runCompliance(accessToken, assignmentId);
    setResult(resp.data.result);
    setFindings(resp.data.findingsJson);
  }

  return (
    <article className="card">
      <h3>Compliance</h3>
      <button type="button" onClick={runCheck}>
        Run check
      </button>
      {result ? <p>Result: {result.toUpperCase()}</p> : null}
      {findings.length > 0 ? (
        <ul>
          {findings.map((finding) => (
            <li key={`${finding.ruleCode}-${finding.severity}-${finding.message}`}>
              <strong>{finding.severity.toUpperCase()}</strong> - {finding.ruleCode}: {finding.message} (condition:{" "}
              {Object.entries(finding.matchedCondition)
                .map(([key, value]) => `${key}=${String(value)}`)
                .join(", ")}
              )
            </li>
          ))}
        </ul>
      ) : result ? (
        <p>No findings.</p>
      ) : null}
    </article>
  );
}
