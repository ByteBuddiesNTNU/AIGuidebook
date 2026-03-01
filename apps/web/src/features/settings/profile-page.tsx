import { useAuth } from "../../app/providers/auth-provider";

export function ProfilePage() {
  const { user } = useAuth();
  return (
    <section className="card">
      <h2>Profile</h2>
      <p>Email: {user?.email}</p>
      <p>Role: {user?.role}</p>
      <p>Institution ID: {user?.institutionId}</p>
    </section>
  );
}
