import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../app/providers/auth-provider";
import { api } from "../../lib/api";

export function DashboardPage() {
  const { accessToken } = useAuth();
  const assignments = useQuery({
    queryKey: ["assignments"],
    queryFn: () => api.getAssignments(accessToken!).then((r) => r.data),
    enabled: Boolean(accessToken),
  });

  return (
    <section>
      <h2>Dashboard</h2>
      <p>Track AI usage per assignment and generate declaration PDFs.</p>
      <Link to="/assignments/new" className="button-link">
        New assignment
      </Link>
      <div className="card">
        <h3>Assignments</h3>
        <ul>
          {(assignments.data ?? []).map((a) => (
            <li key={a.id}>
              <Link to={`/assignments/${a.id}`}>{a.title}</Link> ({a.status})
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
