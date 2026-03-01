import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../app/providers/auth-provider";
import { api } from "../../lib/api";

export function GuidelinesPanel({ assignmentId }: { assignmentId: string }) {
  const { accessToken } = useAuth();
  const query = useQuery({
    queryKey: ["guidelines", assignmentId],
    queryFn: () => api.getActiveGuidelines(accessToken!, assignmentId).then((r) => r.data),
    enabled: Boolean(accessToken && assignmentId),
  });

  return (
    <article className="card">
      <h3>Guidelines</h3>
      <ul>
        {(query.data?.rules ?? []).map((rule) => (
          <li key={rule.id}>
            <strong>{rule.ruleCode}</strong> ({rule.severity}): {rule.adviceText}
          </li>
        ))}
      </ul>
    </article>
  );
}
