import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../app/providers/auth-provider";
import { api } from "../../lib/api";

export function NewLogPage() {
  const { assignmentId = "" } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [toolName, setToolName] = useState("");
  const [usagePurpose, setUsagePurpose] = useState("brainstorming");
  const [responseSummary, setResponseSummary] = useState("");
  const [promptRaw, setPromptRaw] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    await api.createAssignmentLog(accessToken, assignmentId, {
      toolName,
      usagePurpose,
      responseSummary,
      promptRaw,
    });
    navigate(`/assignments/${assignmentId}`);
  }

  return (
    <section className="card">
      <h2>New AI Log</h2>
      <form onSubmit={onSubmit}>
        <label>Tool name</label>
        <input value={toolName} onChange={(e) => setToolName(e.target.value)} required />
        <label>Purpose</label>
        <select value={usagePurpose} onChange={(e) => setUsagePurpose(e.target.value)}>
          <option value="brainstorming">brainstorming</option>
          <option value="outlining">outlining</option>
          <option value="coding_help">coding_help</option>
          <option value="proofreading">proofreading</option>
          <option value="translation">translation</option>
          <option value="concept_explanation">concept_explanation</option>
        </select>
        <label>Prompt (optional)</label>
        <textarea value={promptRaw} onChange={(e) => setPromptRaw(e.target.value)} />
        <label>Response summary</label>
        <textarea value={responseSummary} onChange={(e) => setResponseSummary(e.target.value)} required />
        <button type="submit">Save log</button>
      </form>
    </section>
  );
}
