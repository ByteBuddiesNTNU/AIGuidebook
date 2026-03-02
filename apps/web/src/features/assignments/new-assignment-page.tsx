import { FormEvent, useState } from "react";
import type { CourseDto } from "@aiguidebook/shared";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/auth-provider";
import { ApiError, api } from "../../lib/api";

export function NewAssignmentPage() {
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
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

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !user) return;
    if (!resolvedCourseId) {
      setError("Please select a course.");
      return;
    }
    setError(null);
    try {
      const resp = await api.createAssignment(accessToken, {
        institutionId: user.institutionId,
        courseId: resolvedCourseId,
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
        <select
          value={resolvedCourseId}
          onChange={(e) => setCourseId(e.target.value)}
          required
        >
          <option value="" disabled>
            {coursesQuery.isLoading ? "Loading courses..." : "Select course"}
          </option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.name} ({course.term})
            </option>
          ))}
        </select>
        <label>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          minLength={3}
          required
        />
        <label>Due Date</label>
        <input
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          type="date"
          required
        />
        <button type="submit">Save</button>
      </form>
    </section>
  );
}
