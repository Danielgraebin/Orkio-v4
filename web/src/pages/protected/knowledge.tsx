import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import api from "../../lib/api";

export default function KnowledgePage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [agents, setAgents] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [tags, setTags] = useState("");
  const [selectedAgents, setSelectedAgents] = useState([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem("orkio_token") : null;

  const handleLogout = () => {
    localStorage.removeItem("orkio_token");
    localStorage.removeItem("orkio_u_token");
    window.location.href = "/auth/login";
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }
    loadAgents();
    loadKnowledge();
  }, [token]);

  const loadAgents = async () => {
    try {
      const resp = await api.get("/agents");
      setAgents(resp.data || []);
      console.log("Agents loaded:", resp.data?.length || 0);
    } catch (err) {
      console.error("Failed to load agents", err);
      setAgents([]);
    }
  };

  const loadKnowledge = async () => {
    try {
      console.log("[KNOWLEDGE] Loading list...");
      const resp = await api.get("/admin/knowledge/list");
      console.log("[KNOWLEDGE] API Response:", resp.data);
      const items = resp.data?.items || resp.data || [];
      console.log(`[KNOWLEDGE] Setting ${items.length} items`);
      setItems(items);
    } catch (err) {
      console.error("[KNOWLEDGE] Failed to load:", err);
      setItems([]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tags", tags);
    formData.append("link_agent_ids", selectedAgents.join(","));

    try {
      await api.post("/admin/knowledge/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("File uploaded successfully!");
      setFile(null);
      setTags("");
      setSelectedAgents([]);
      // Wait for DB commit and vectorization, then force refresh
      console.log("[KNOWLEDGE] Upload successful, refreshing in 2s...");
      setTimeout(() => {
        console.log("[KNOWLEDGE] Reloading list now...");
        loadKnowledge();
      }, 2000);
    } catch (err) {
      console.error("Upload error:", err);
      const errorDetail = err.response?.data?.detail;
      
      // Handle structured error responses
      if (errorDetail && typeof errorDetail === 'object') {
        const reason = errorDetail.reason || errorDetail.error || 'unknown';
        const message = errorDetail.message || JSON.stringify(errorDetail);
        alert(`Upload failed: ${reason}\n${message}`);
      } else if (errorDetail) {
        alert(`Upload failed: ${errorDetail}`);
      } else {
        alert(`Upload failed: ${err.message}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this knowledge item?")) return;
    try {
      await api.delete(`/admin/knowledge/${id}`);
      loadKnowledge();
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }}>
      {/* Header com menu de navegação */}
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div className="row"><img src="/logo-orkio.svg" width={120} /></div>
        <div className="row" style={{ gap: 8 }}>
          <a className="btn secondary" href="/protected/dashboard">Dashboard</a>
          <a className="btn secondary" href="/protected/agents">Agentes</a>
          <a className="btn secondary" href="/protected/links">Links</a>
          <a className="btn secondary" href="/protected/knowledge">Knowledge Base</a>
          <a className="btn secondary" href="/protected/users">Usuários</a>
          <a className="btn secondary" href="/protected/orchestrator">Orquestrador</a>
          <button className="btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Upload Card */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2>Upload Document</h2>
        <input
          type="file"
          accept=".pdf,.docx,.md,.txt"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ display: "block", marginBottom: "1rem" }}
        />
        <input
          type="text"
          placeholder="Tags (comma-separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          style={{ display: "block", width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
        />
        <label style={{ display: "block", marginBottom: "0.5rem" }}>Link to Agents (optional):</label>
        <select
          multiple
          value={selectedAgents}
          onChange={(e) => setSelectedAgents(Array.from(e.target.selectedOptions, opt => opt.value))}
          style={{ display: "block", width: "100%", padding: "0.5rem", marginBottom: "1rem", minHeight: "80px" }}
        >
          {agents.map(agent => (
            <option key={agent.id} value={agent.id}>{agent.name}</option>
          ))}
        </select>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="btn primary"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* Knowledge Items Table */}
      <div className="card">
        <h2>Documents</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #333" }}>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Filename</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Size</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Chunks</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Tags</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Linked Agents</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "0.5rem" }}>{item.filename}</td>
                <td style={{ padding: "0.5rem" }}>{(item.size / 1024).toFixed(1)} KB</td>
                <td style={{ padding: "0.5rem" }}>
                  <span style={{ color: item.status === "vectorized" ? "#4ade80" : "#fbbf24" }}>
                    {item.status}
                  </span>
                </td>
                <td style={{ padding: "0.5rem" }}>{item.chunks_count}</td>
                <td style={{ padding: "0.5rem" }}>{item.tags?.join(", ") || "-"}</td>
                <td style={{ padding: "0.5rem" }}>
                  {item.linked_agents && item.linked_agents.length > 0 ? (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {item.linked_agents.map(agent => (
                        <span
                          key={agent.id}
                          style={{
                            background: "#1e40af",
                            color: "white",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem"
                          }}
                        >
                          {agent.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: "#666" }}>-</span>
                  )}
                </td>
                <td style={{ padding: "0.5rem" }}>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="btn secondary"
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.875rem" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p style={{ textAlign: "center", padding: "2rem", color: "#666" }}>No documents uploaded yet.</p>
        )}
      </div>
    </div>
  );
}

