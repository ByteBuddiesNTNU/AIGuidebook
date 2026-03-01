import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../app/providers/auth-provider";
import { api } from "../../lib/api";

export function AnalyticsPage() {
  const { accessToken } = useAuth();
  const usageOverTime = useQuery({
    queryKey: ["analytics", "time"],
    queryFn: () => api.usageOverTime(accessToken!).then((r) => r.data),
    enabled: Boolean(accessToken),
  });
  const usageByCategory = useQuery({
    queryKey: ["analytics", "category"],
    queryFn: () => api.usageByCategory(accessToken!).then((r) => r.data),
    enabled: Boolean(accessToken),
  });

  return (
    <section>
      <h2>Analytics</h2>
      <div className="grid">
        <article className="card">
          <h3>Usage over time</h3>
          <ul>
            {(usageOverTime.data ?? []).map((item) => (
              <li key={item.date}>
                {item.date}: {item.count}
              </li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h3>Usage by category</h3>
          <ul>
            {(usageByCategory.data ?? []).map((item) => (
              <li key={item.usagePurpose}>
                {item.usagePurpose}: {item.count}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
