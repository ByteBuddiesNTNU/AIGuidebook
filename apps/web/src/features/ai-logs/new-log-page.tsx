import { SubmitEvent, useState } from "react";
import type { AssignmentListItemDto, UsagePurpose } from "@aiguidebook/shared";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../app/providers/auth-provider";
import { ApiError, api } from "../../lib/api";

export function NewLogPage() {
  const { assignmentId = "" } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(assignmentId);
  const [toolName, setToolName] = useState("");
  const [usagePurpose, setUsagePurpose] = useState<UsagePurpose>("brainstorming");
  const [responseSummary, setResponseSummary] = useState("");
  const [promptRaw, setPromptRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const assignmentsQuery = useQuery({
    queryKey: ["assignments", accessToken],
    enabled: Boolean(accessToken),
    queryFn: async (): Promise<AssignmentListItemDto[]> => {
      if (!accessToken) return [];
      return (await api.getAssignments(accessToken)).data;
    },
  });
  const assignments = assignmentsQuery.data ?? [];
  const resolvedAssignmentId =
    assignments.length === 0
      ? ""
      : selectedAssignmentId && assignments.some((item) => item.id === selectedAssignmentId)
        ? selectedAssignmentId
        : (assignments[0]?.id ?? "");

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!accessToken || !resolvedAssignmentId) return;
    setError(null);
    try {
      await api.createAssignmentLog(accessToken, resolvedAssignmentId, {
        toolName,
        usagePurpose,
        responseSummary,
        promptRaw,
      });
      navigate(`/assignments/${resolvedAssignmentId}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        return;
      }
      setError("Failed to save log.");
    }
  }

  return (
    <section className="card">
      <h2>New AI Log</h2>
      <form onSubmit={onSubmit}>
        {error ? <p style={{ color: "#b00020" }}>{error}</p> : null}
        <label>Assignment</label>
        <select value={resolvedAssignmentId} onChange={(e) => setSelectedAssignmentId(e.target.value)} required>
          <option value="" disabled>
            {assignmentsQuery.isLoading ? "Loading assignments..." : "Select assignment"}
          </option>
          {assignments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} ({item.status})
            </option>
          ))}
        </select>
        <label>Tool name</label>
        <input value={toolName} onChange={(e) => setToolName(e.target.value)} required />
        <label>Purpose</label>
        <select value={usagePurpose} onChange={(e) => setUsagePurpose(e.target.value as UsagePurpose)}>
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
