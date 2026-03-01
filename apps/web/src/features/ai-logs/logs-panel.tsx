import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../app/providers/auth-provider";
import { api } from "../../lib/api";

export function LogsPanel({ assignmentId }: { assignmentId: string }) {
  const { accessToken } = useAuth();
  const query = useQuery({
    queryKey: ["logs", assignmentId],
    queryFn: () => api.getAssignmentLogs(accessToken!, assignmentId).then((r) => r.data),
    enabled: Boolean(accessToken && assignmentId),
  });

  return (
    <article className="card">
      <h3>Logs</h3>
      <ul>
        {(query.data ?? []).map((log) => (
          <li key={log.id}>
            <strong>{log.usagePurpose}</strong>: {log.responseSummary}
          </li>
        ))}
      </ul>
    </article>
  );
}
