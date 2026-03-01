import { Link, useParams } from "react-router-dom";
import { LogsPanel } from "../ai-logs/logs-panel";
import { GuidelinesPanel } from "../guidelines/guidelines-panel";
import { CompliancePanel } from "../compliance/compliance-panel";
import { DeclarationPanel } from "../declarations/declaration-panel";

export function AssignmentDetailPage() {
  const { assignmentId = "" } = useParams();

  return (
    <section>
      <h2>Assignment</h2>
      <p className="tabs">
        <Link to={`/assignments/${assignmentId}`}>Logs</Link>
        <Link to={`/assignments/${assignmentId}`}>Guidelines</Link>
        <Link to={`/assignments/${assignmentId}`}>Compliance</Link>
        <Link to={`/assignments/${assignmentId}`}>Declaration</Link>
      </p>
      <div className="grid">
        <LogsPanel assignmentId={assignmentId} />
        <GuidelinesPanel assignmentId={assignmentId} />
        <CompliancePanel assignmentId={assignmentId} />
        <DeclarationPanel assignmentId={assignmentId} />
      </div>
      <Link className="button-link sticky-action" to={`/assignments/${assignmentId}/logs/new`}>
        Add log
      </Link>
    </section>
  );
}
