import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../app/providers/auth-provider";

export function AppLayout() {
  const { user, setAccessToken, setUser } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>AIGuidebook</h1>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/assignments">Assignments</Link>
          <Link to="/analytics">Analytics</Link>
          <Link to="/settings/privacy">Privacy</Link>
          {user?.role === "admin" ? <Link to="/admin/guidelines">Admin</Link> : null}
        </nav>
        <button
          type="button"
          onClick={() => {
            setAccessToken(null);
            setUser(null);
          }}
        >
          Logout
        </button>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
