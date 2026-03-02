import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/auth-provider";
import { ApiError, api } from "../../lib/api";

export function NewAssignmentPage() {
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState<Array<{ id: string; code: string; name: string; term: string }>>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !user) return;
    api
      .getCourses(accessToken, user.institutionId)
      .then((resp) => {
        setCourses(resp.data);
        setCourseId((current) => current || resp.data[0]?.id || "");
      })
      .catch(() => {
        setCourses([]);
        setCourseId("");
      });
  }, [accessToken, user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !user) return;
    setError(null);
    try {
      const resp = await api.createAssignment(accessToken, {
        institutionId: user.institutionId,
        courseId: courseId.trim(),
        title: title.trim(),
        dueDate,
      });
      navigate(`/assignments/${resp.data.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        return;
      }
      setError("Failed to create assignment.");
    }
  }

  return (
    <section className="card">
      <h2>New Assignment</h2>
      <form onSubmit={onSubmit}>
        {error ? <p style={{ color: "#b00020" }}>{error}</p> : null}
        <label>Course</label>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
          <option value="" disabled>
            Select course
          </option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.name} ({course.term})
            </option>
          ))}
        </select>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} required />
        <label>Due Date</label>
        <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" required />
        <button type="submit">Save</button>
      </form>
    </section>
  );
}
