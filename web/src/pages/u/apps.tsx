import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api } from "../../lib/api";

export default function UserApps() {
  const router = useRouter();
  const [apps, setApps] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const token = typeof window !== 'undefined' ? localStorage.getItem("orkio_u_token") : null;

  useEffect(() => {
    if (!token) {
      router.push("/u/login");
      return;
    }
    loadApps();
  }, [token]);

  async function loadApps() {
    try {
      const response = await api.get("/u/apps", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApps(response.data);
    } catch (err) {
      console.error("Failed to load apps", err);
    }
  }

  async function createApp(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/u/apps", { name, description }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setName("");
      setDescription("");
      loadApps();
    } catch (err) {
      alert("Failed to create app");
    }
  }

  async function deleteApp(id: number) {
    if (!confirm("Delete this app?")) return;
    try {
      await api.delete(`/u/apps/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadApps();
    } catch (err) {
      alert("Failed to delete app");
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", padding: 20 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 30 }}>
        <div>
          <a href="/u/dashboard" className="btn secondary">← Back</a>
          <h2 style={{ marginTop: 10 }}>Apps</h2>
        </div>
        <img src="/logo-orkio.png" width={120} />
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Create New App</h3>
        <form onSubmit={createApp}>
          <div className="row" style={{ gap: 12, marginTop: 16 }}>
            <input
              className="input"
              placeholder="App name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="input"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button type="submit" className="btn">
              Create
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Your Apps</h3>
        {apps.length === 0 ? (
          <p style={{ color: "#888", marginTop: 16 }}>No apps yet</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
            {apps.map((app) => (
              <li
                key={app.id}
                style={{
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <strong>{app.name}</strong>
                  {app.description && (
                    <p style={{ color: "#888", fontSize: "0.9em", margin: "4px 0 0" }}>
                      {app.description}
                    </p>
                  )}
                </div>
                <button
                  className="btn secondary"
                  onClick={() => deleteApp(app.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

