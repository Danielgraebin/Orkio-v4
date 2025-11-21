import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api } from "../../lib/api";

type Agent = {
  id: number;
  name: string;
  purpose?: string;
  temperature?: number;
  use_rag?: boolean;
  has_rag?: boolean;
};

export default function UserPlayground() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [runId, setRunId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem("orkio_u_token") : null;

  useEffect(() => {
    if (!token) {
      router.push("/u/login");
      return;
    }
    loadAgents();
  }, [token]);

  async function loadAgents() {
    try {
      const result = await api.get("/u/agents", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgents(result.data);
      // Select first agent by default
      if (result.data.length > 0) {
        setSelectedAgentId(result.data[0].id);
      }
    } catch (err: any) {
      console.error("Failed to load agents:", err);
    }
  }

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedAgentId) {
      alert("Please select an agent");
      return;
    }

    setLoading(true);
    setResponse("");
    setRunId(null);

    try {
      const result = await api.post("/u/playground/run", 
        { 
          prompt,
          agent_id: selectedAgentId
        }, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setResponse(result.data.output_text || result.data.response || "No response");
      setRunId(result.data.trace_id || result.data.run_id);
    } catch (err: any) {
      setResponse(`Error: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", padding: 20 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 30 }}>
        <div>
          <a href="/u/dashboard" className="btn secondary">← Back</a>
          <h2 style={{ marginTop: 10 }}>Playground</h2>
        </div>
        <img src="/logo-orkio.png" width={120} />
      </div>

      <div className="card">
        <h3>Test your agents</h3>
        
        {/* Agent Selection */}
        <div style={{ marginTop: 16, marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
            Select Agent
          </label>
          <select
            className="input"
            value={selectedAgentId || ""}
            onChange={(e) => setSelectedAgentId(Number(e.target.value))}
            style={{ width: "100%", padding: "10px" }}
          >
            <option value="">-- Select an agent --</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name} {agent.use_rag || agent.has_rag ? "🧠 (RAG)" : ""}
              </option>
            ))}
          </select>
          
          {selectedAgent && (
            <div style={{ 
              marginTop: 12, 
              padding: 12, 
              background: "rgba(0,0,0,0.2)", 
              borderRadius: 6,
              fontSize: "0.9em"
            }}>
              <p style={{ margin: 0, marginBottom: 6 }}>
                <strong>Purpose:</strong> {selectedAgent.purpose || "No purpose defined"}
              </p>
              <p style={{ margin: 0, marginBottom: 6 }}>
                <strong>Temperature:</strong> {selectedAgent.temperature ?? 0.2}
              </p>
              <p style={{ margin: 0 }}>
                <strong>RAG Enabled:</strong> {selectedAgent.use_rag || selectedAgent.has_rag ? "✓ Yes" : "✗ No"}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleRun}>
          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", marginBottom: 8 }}>Prompt</label>
            <textarea
              className="input"
              rows={6}
              placeholder="Enter your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading || !selectedAgentId}
            style={{ marginTop: 16 }}
          >
            {loading ? "Thinking..." : "Run"}
          </button>
        </form>

        {response && (
          <div style={{ marginTop: 30 }}>
            <h4>Response</h4>
            {runId && (
              <p style={{ color: "#888", fontSize: "0.9em" }}>
                Run ID: {runId}
              </p>
            )}
            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                borderRadius: 8,
                padding: 16,
                marginTop: 12,
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
                fontSize: "0.9em"
              }}
            >
              {response}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

