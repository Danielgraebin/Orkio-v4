import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api } from "../../lib/api";

export default function UserSettings() {
  const router = useRouter();
  const [keys, setKeys] = useState<any[]>([]);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem("orkio_u_token") : null;

  useEffect(() => {
    if (!token) {
      router.push("/u/login");
      return;
    }
    loadKeys();
  }, [token]);

  async function loadKeys() {
    try {
      const response = await api.get("/u/keys", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKeys(response.data);
    } catch (err) {
      console.error("Failed to load keys", err);
    }
  }

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await api.post("/u/keys", { name: keyName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewKey(response.data.plaintext_key);
      setKeyName("");
      loadKeys();
    } catch (err) {
      alert("Failed to create key");
    }
  }

  async function revokeKey(id: number) {
    if (!confirm("Revoke this key?")) return;
    try {
      await api.delete(`/u/keys/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadKeys();
    } catch (err) {
      alert("Failed to revoke key");
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", padding: 20 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 30 }}>
        <div>
          <a href="/u/dashboard" className="btn secondary">← Back</a>
          <h2 style={{ marginTop: 10 }}>Settings & API Keys</h2>
        </div>
        <img src="/logo-orkio.png" width={120} />
      </div>

      {newKey && (
        <div className="card" style={{ marginBottom: 20, background: "#2e7d32" }}>
          <h3>⚠️ Save this key - it won't be shown again!</h3>
          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              borderRadius: 8,
              padding: 12,
              marginTop: 12,
              fontFamily: "monospace",
              fontSize: "0.9em",
              wordBreak: "break-all"
            }}
          >
            {newKey}
          </div>
          <button
            className="btn secondary"
            style={{ marginTop: 12 }}
            onClick={() => setNewKey(null)}
          >
            Got it
          </button>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Create New API Key</h3>
        <form onSubmit={createKey}>
          <div className="row" style={{ gap: 12, marginTop: 16 }}>
            <input
              className="input"
              placeholder="Key name (e.g. Production)"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              required
            />
            <button type="submit" className="btn">
              Generate Key
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Your API Keys</h3>
        {keys.length === 0 ? (
          <p style={{ color: "#888", marginTop: 16 }}>No keys yet</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
            {keys.map((key) => (
              <li
                key={key.id}
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
                  <strong>{key.name}</strong>
                  <p style={{ color: "#888", fontSize: "0.85em", margin: "4px 0 0", fontFamily: "monospace" }}>
                    {key.prefix}***
                  </p>
                  <p style={{ color: "#666", fontSize: "0.8em", margin: "4px 0 0" }}>
                    Created: {new Date(key.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  className="btn secondary"
                  onClick={() => revokeKey(key.id)}
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

