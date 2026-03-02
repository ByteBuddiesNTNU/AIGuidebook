import { SubmitEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../app/providers/auth-provider";

export function LoginPage() {
  const navigate = useNavigate();
  const { setAccessToken, setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    try {
      const resp = await api.login({ email, password });
      setAccessToken(resp.data.accessToken);
      setUser(resp.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <section className="card narrow">
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label>Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        {error ? <p className="error">{error}</p> : null}
        <button type="submit">Sign in</button>
      </form>
      <p>
        New student? <Link to="/register">Register</Link>
      </p>
    </section>
  );
}
