import { useParams } from "react-router-dom";

export function DeclarationPreviewPage() {
  const { assignmentId = "" } = useParams();
  return (
    <section className="card">
      <h2>Declaration Preview</h2>
      <p>Assignment: {assignmentId}</p>
      <p>This page is reserved for expanded declaration preview/editor in later iterations.</p>
    </section>
  );
}
