import { useState } from "react";
import { useAuth } from "../../app/providers/auth-provider";
import { api } from "../../lib/api";

type Finding = {
  message: string;
  ruleCode: string;
  severity: "info" | "warning" | "high";
  matchedCondition: Record<string, unknown>;
};

export function CompliancePanel({ assignmentId }: { assignmentId: string }) {
  const { accessToken } = useAuth();
  const [result, setResult] = useState<"ok" | "warning" | "">("");
  const [findings, setFindings] = useState<Finding[]>([]);

  async function runCheck() {
    if (!accessToken) return;
    const resp = await api.runCompliance(accessToken, assignmentId);
    setResult(resp.data.result);
    setFindings(Array.isArray(resp.data.findingsJson) ? (resp.data.findingsJson as Finding[]) : []);
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
