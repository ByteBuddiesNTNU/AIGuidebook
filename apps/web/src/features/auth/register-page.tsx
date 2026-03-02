import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, api } from "../../lib/api";
import { useAuth } from "../../app/providers/auth-provider";

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAccessToken, setUser } = useAuth();
  const [institutionId, setInstitutionId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const institutionsQuery = useQuery({
    queryKey: ["institutions"],
    queryFn: async () => (await api.getInstitutions()).data,
  });
  const institutions = institutionsQuery.data ?? [];

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const resp = await api.register({ institutionId, email, password });
      setAccessToken(resp.data.accessToken);
      setUser(resp.data.user);
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        return;
      }
      setError("Failed to register.");
    }
  }

  return (
    <section className="card narrow">
      <h2>Register</h2>
      <form onSubmit={onSubmit}>
        <label>Institution</label>
        <select
          value={institutionId}
          onChange={(e) => setInstitutionId(e.target.value)}
          required
        >
          <option value="" disabled>
            {institutionsQuery.isLoading
              ? "Loading institutions..."
              : "Select institution"}
          </option>
          {institutions.map((institution) => (
            <option key={institution.id} value={institution.id}>
              {institution.name} ({institution.code})
            </option>
          ))}
        </select>
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <label>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          minLength={10}
          required
        />
        {error ? <p className="error">{error}</p> : null}
        <button type="submit">Create account</button>
      </form>
      <p>
        Already registered? <Link to="/login">Login</Link>
      </p>
    </section>
  );
}
