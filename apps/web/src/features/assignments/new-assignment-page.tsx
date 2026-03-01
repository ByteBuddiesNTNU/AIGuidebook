import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/auth-provider";
import { api } from "../../lib/api";

export function NewAssignmentPage() {
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !user) return;
    const resp = await api.createAssignment(accessToken, {
      institutionId: user.institutionId,
      courseId,
      title,
      dueDate,
    });
    navigate(`/assignments/${resp.data.id}`);
  }

  return (
    <section className="card">
      <h2>New Assignment</h2>
      <form onSubmit={onSubmit}>
        <label>Course ID</label>
        <input value={courseId} onChange={(e) => setCourseId(e.target.value)} required />
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        <label>Due Date</label>
        <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" required />
        <button type="submit">Save</button>
      </form>
    </section>
  );
}
