import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api } from "../../lib/api";

export default function UserDashboard() {
  const router = useRouter();
  const [usage, setUsage] = useState<any[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem("orkio_u_token") : null;

  useEffect(() => {
    if (!token) {
      router.push("/u/login");
      return;
    }
    loadUsage();
  }, [token]);

  async function loadUsage() {
    try {
      const response = await api.get("/u/usage", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsage(response.data);
    } catch (err) {
      console.error("Failed to load usage", err);
    }
  }

  function logout() {
    // Clear all orkio tokens
    localStorage.removeItem("token");
    localStorage.removeItem("orkio_token");
    localStorage.removeItem("orkio_u_token");
    localStorage.removeItem("orkio_tenant_id");
    localStorage.removeItem("orkio_role");
    localStorage.removeItem("u_token");
    localStorage.removeItem("u_tenant_id");
    router.push("/u/login");
  }

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", padding: 20 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 30 }}>
        <div>
          <img src="/logo-orkio.png" width={120} />
          <h2 style={{ marginTop: 10 }}>Users Dashboard</h2>
        </div>
        <button className="btn secondary" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="row" style={{ gap: 16, marginBottom: 30 }}>
        <a href="/u/chat" className="btn primary">
          Chat
        </a>
        <a href="/u/apps" className="btn">
          Apps
        </a>
        <a href="/u/playground" className="btn">
          Playground
        </a>
        <a href="/u/billing" className="btn">
          Billing
        </a>
        <a href="/u/settings" className="btn secondary">
          Settings
        </a>
      </div>

      <div className="card">
        <h3>Usage Summary</h3>
        {usage.length === 0 ? (
          <p style={{ color: "#888" }}>No usage data yet</p>
        ) : (
          <table style={{ width: "100%", marginTop: 16 }}>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {usage.map((u, i) => (
                <tr key={i}>
                  <td>{u.metric}</td>
                  <td>{u.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

