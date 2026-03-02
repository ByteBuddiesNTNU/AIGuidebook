import { useState } from "react";
import type { SubmitEvent } from "react";
import type {
  CourseDto,
  GuidelineCondition,
  GuidelineScopeType,
  RuleSeverity,
} from "@aiguidebook/shared";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../app/providers/auth-provider";
import { ApiError, api } from "../../lib/api";

export function AdminGuidelinesPage() {
  const { accessToken, user } = useAuth();
  const [scopeType, setScopeType] = useState<GuidelineScopeType>("institution");
  const [courseId, setCourseId] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [version, setVersion] = useState(1);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");

  const [ruleCode, setRuleCode] = useState("CUSTOM-AI-001");
  const [title, setTitle] = useState("New guideline");
  const [description, setDescription] = useState(
    "Describe what this guideline checks.",
  );
  const [severity, setSeverity] = useState<RuleSeverity>("warning");
  const [adviceText, setAdviceText] = useState(
    "Adjust your workflow to comply with guideline policy.",
  );
  const [maxLogs, setMaxLogs] = useState("");
  const [disallowedPurpose, setDisallowedPurpose] = useState("");
  const [requireReflection, setRequireReflection] = useState(false);

  const [createdSetId, setCreatedSetId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const coursesQuery = useQuery({
    queryKey: ["courses", user?.institutionId],
    enabled: Boolean(accessToken && user?.institutionId),
    queryFn: async (): Promise<CourseDto[]> => {
      if (!accessToken || !user) return [];
      return (await api.getCourses(accessToken, user.institutionId)).data;
    },
  });
  const courses = coursesQuery.data ?? [];
  const resolvedCourseId =
    courses.length === 0
      ? ""
      : courseId && courses.some((course) => course.id === courseId)
        ? courseId
        : (courses[0]?.id ?? "");

  const canSubmit =
    !!accessToken &&
    !!user &&
    user.role === "admin" &&
    (scopeType !== "course" || !!resolvedCourseId) &&
    (scopeType !== "assignment" || !!assignmentId.trim()) &&
    !!effectiveFrom;

  async function onCreate(event: SubmitEvent) {
    event.preventDefault();
    if (!accessToken || !user || user.role !== "admin") return;
    if (scopeType === "course" && !resolvedCourseId) {
      setError("Please select a course.");
      return;
    }
    setError(null);
    setStatus("");

    const conditionJson: GuidelineCondition = {};
    if (maxLogs.trim()) {
      conditionJson.maxLogs = Number(maxLogs);
    }
    if (disallowedPurpose.trim()) {
      conditionJson.disallowedPurpose = disallowedPurpose.trim();
    }
    if (requireReflection) {
      conditionJson.requireReflection = true;
    }

    try {
      const resp = await api.createGuidelineSet(accessToken, {
        institutionId: user.institutionId,
        scopeType,
        courseId: scopeType === "course" ? resolvedCourseId : undefined,
        assignmentId:
          scopeType === "assignment" ? assignmentId.trim() : undefined,
        version,
        sourceType: "manual",
        effectiveFrom: new Date(effectiveFrom).toISOString(),
        effectiveTo: effectiveTo
          ? new Date(effectiveTo).toISOString()
          : undefined,
        rules: [
          {
            ruleCode: ruleCode.trim(),
            title: title.trim(),
            description: description.trim(),
            severity,
            conditionJson,
            adviceText: adviceText.trim(),
          },
        ],
      });
      setCreatedSetId(resp.data.id);
      setStatus("Guideline set created (draft).");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        return;
      }
      setError("Failed to create guideline set.");
    }
  }

  async function onPublish() {
    if (!accessToken || !createdSetId) return;
    setError(null);
    try {
      await api.publishGuidelineSet(accessToken, createdSetId);
      setStatus("Guideline set published.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        return;
      }
      setError("Failed to publish guideline set.");
    }
  }

  if (user?.role !== "admin") {
    return (
      <section className="card">
        <h2>Admin Guidelines</h2>
        <p>Admin role required.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Admin Guidelines</h2>
      <form onSubmit={onCreate}>
        <label>Scope</label>
        <select
          value={scopeType}
          onChange={(e) => {
            const value = e.target.value;
            if (isGuidelineScopeType(value)) {
              setScopeType(value);
            }
          }}
        >
          <option value="institution">institution</option>
          <option value="course">course</option>
          <option value="assignment">assignment</option>
        </select>

        {scopeType === "course" ? (
          <>
            <label>Course</label>
            <select
              value={resolvedCourseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
            >
              <option value="" disabled>
                {coursesQuery.isLoading
                  ? "Loading courses..."
                  : "Select course"}
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name} ({course.term})
                </option>
              ))}
            </select>
          </>
        ) : null}

        {scopeType === "assignment" ? (
          <>
            <label>Assignment ID</label>
            <input
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value)}
              required
            />
          </>
        ) : null}

        <label>Version</label>
        <input
          type="number"
          min={1}
          value={version}
          onChange={(e) => setVersion(Number(e.target.value))}
          required
        />

        <label>Effective from</label>
        <input
          type="datetime-local"
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
          required
        />

        <label>Effective to (optional)</label>
        <input
          type="datetime-local"
          value={effectiveTo}
          onChange={(e) => setEffectiveTo(e.target.value)}
        />

        <label>Rule code</label>
        <input
          value={ruleCode}
          onChange={(e) => setRuleCode(e.target.value)}
          required
        />

        <label>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <label>Severity</label>
        <select
          value={severity}
          onChange={(e) => {
            const value = e.target.value;
            if (isRuleSeverity(value)) {
              setSeverity(value);
            }
          }}
        >
          <option value="info">info</option>
          <option value="warning">warning</option>
          <option value="high">high</option>
        </select>

        <label>Advice text</label>
        <textarea
          value={adviceText}
          onChange={(e) => setAdviceText(e.target.value)}
          required
        />

        <label>Condition: maxLogs (optional)</label>
        <input
          type="number"
          min={1}
          value={maxLogs}
          onChange={(e) => setMaxLogs(e.target.value)}
        />

        <label>Condition: disallowedPurpose (optional)</label>
        <input
          value={disallowedPurpose}
          onChange={(e) => setDisallowedPurpose(e.target.value)}
        />

        <label>
          <input
            type="checkbox"
            checked={requireReflection}
            onChange={(e) => setRequireReflection(e.target.checked)}
          />
          Condition: requireReflection
        </label>

        <button type="submit" disabled={!canSubmit}>
          Create set
        </button>
      </form>

      {createdSetId ? (
        <p>
          Created set: <code>{createdSetId}</code>
        </p>
      ) : null}
      {createdSetId ? (
        <button type="button" onClick={onPublish}>
          Publish latest created set
        </button>
      ) : null}
      {status ? <p>{status}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}

function isGuidelineScopeType(value: string): value is GuidelineScopeType {
  return value === "institution" || value === "course" || value === "assignment";
}

function isRuleSeverity(value: string): value is RuleSeverity {
  return value === "info" || value === "warning" || value === "high";
}
