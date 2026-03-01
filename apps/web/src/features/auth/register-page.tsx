import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../app/providers/auth-provider";

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAccessToken, setUser } = useAuth();
  const [institutionId, setInstitutionId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const resp = await api.register({ institutionId, email, password });
    setAccessToken(resp.data.accessToken);
    setUser(resp.data.user);
    navigate("/dashboard");
  }

  return (
    <section className="card narrow">
      <h2>Register</h2>
      <form onSubmit={onSubmit}>
        <label>Institution ID</label>
        <input value={institutionId} onChange={(e) => setInstitutionId(e.target.value)} required />
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label>Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={10} required />
        <button type="submit">Create account</button>
      </form>
      <p>
        Already registered? <Link to="/login">Login</Link>
      </p>
    </section>
  );
}
