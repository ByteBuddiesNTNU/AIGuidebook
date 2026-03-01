import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../app/providers/auth-provider";
import { api } from "../../lib/api";

export function AssignmentsPage() {
  const { accessToken } = useAuth();
  const query = useQuery({
    queryKey: ["assignments"],
    queryFn: () => api.getAssignments(accessToken!).then((r) => r.data),
    enabled: Boolean(accessToken),
  });

  return (
    <section>
      <h2>Assignments</h2>
      <Link to="/assignments/new" className="button-link">
        Create assignment
      </Link>
      <ul>
        {(query.data ?? []).map((assignment) => (
          <li key={assignment.id}>
            <Link to={`/assignments/${assignment.id}`}>{assignment.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
