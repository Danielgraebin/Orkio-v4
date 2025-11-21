/**
 * ORKIO v4.0 Admin Console
 * Layout dark elegante conforme especificação
 */
import { useState, useEffect } from "react";

interface Auth {
  access_token: string;
  email: string;
  role: string;
}

interface User {
  id: number;
  email: string;
  role: string;
  created_at: string;
}

interface Agent {
  id: number;
  name: string;
  system_prompt: string;
  model: string;
  temperature: number;
  created_at: string;
}

interface Document {
  id: number;
  agent_id: number;
  agent_name: string;
  filename: string;
  status: string;
  size_kb: number;
  chunks: number;
  created_at: string;
}

interface AgentFormData {
  name: string;
  system_prompt: string;
  provider: string;
  model: string;
  temperature: number;
}

export default function AdminV4() {
  // Estilos globais para garantir contraste
  const inputStyle = {
    background: "#1E2435",
    borderColor: "#3BC3FF",
    color: "#FFFFFF",
  };
  
  const selectStyle = {
    background: "#1E2435",
    borderColor: "#3BC3FF",
    color: "#FFFFFF",
  };
  
  // CSS global para options
  if (typeof document !== 'undefined') {
    const styleId = 'orkio-select-options-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        select option {
          background: #1E2435 !important;
          color: #FFFFFF !important;
        }
        input[type="file"]::file-selector-button {
          background: #3BC3FF;
          color: #FFFFFF;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
        }
      `;
      document.head.appendChild(style);
    }
  }
  // Auth
  const [auth, setAuth] = useState<Auth | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [links, setLinks] = useState<any[]>([]);

  // UI
  const [activeTab, setActiveTab] = useState<"users" | "agents" | "documents" | "links" | "settings">("users");
  const [loading, setLoading] = useState(false);

  // Modals
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentForm, setAgentForm] = useState<AgentFormData>({
    name: "",
    system_prompt: "",
    provider: "openai",
    model: "gpt-4.1-mini",
    temperature: 0.7,
  });

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAgentId, setUploadAgentId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState({
    from_agent_id: 0,
    to_agent_id: 0,
    trigger_keywords: [] as string[],
    priority: 10,
    active: true,
  });
  const [keywordInput, setKeywordInput] = useState("");

  // Settings (API Keys)
  const [providers, setProviders] = useState<any[]>([]);
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [apiKeyForm, setApiKeyForm] = useState({ api_key: "", base_url: "" });
  const [savingAPIKey, setSavingAPIKey] = useState(false);

  // Load data on auth
  useEffect(() => {
    if (auth) {
      loadUsers();
      loadPendingUsers();
      loadAgents();
      loadDocuments();
      loadLinks();
      loadProviders();
    }
  }, [auth]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("orkio_admin_v4_token");
    if (stored) {
      try {
        setAuth(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem("orkio_admin_v4_token");
      }
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/u/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Login failed");
      }

      const data = await res.json();
      const authData = {
        access_token: data.access_token,
        email: data.email,
        role: data.role,
      };

      setAuth(authData);
      localStorage.setItem("orkio_admin_v4_token", JSON.stringify(authData));
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    if (!auth) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/users", {
        headers: { Authorization: `Bearer ${auth.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAgents() {
    if (!auth) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/agents", {
        headers: { Authorization: `Bearer ${auth.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to load agents");
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (err) {
      console.error("Failed to load agents:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadDocuments() {
    if (!auth) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/documents", {
        headers: { Authorization: `Bearer ${auth.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      const enriched = (data.documents || []).map((doc: Document) => ({
        ...doc,
        agent_name: agents.find((a) => a.id === doc.agent_id)?.name || "Unknown",
      }));
      setDocuments(enriched);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadLinks() {
    if (!auth) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/agent-links", {
        headers: { Authorization: `Bearer ${auth.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to load links");
      const data = await res.json();
      setLinks(data.links || []);
    } catch (err) {
      console.error("Failed to load links:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingUsers() {
    if (!auth) return;
    try {
      const res = await fetch("/api/v1/admin/users/pending", {
        headers: { Authorization: `Bearer ${auth.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to load pending users");
      const data = await res.json();
      setPendingUsers(data.users || []);
    } catch (err) {
      console.error("Failed to load pending users:", err);
    }
  }

  async function handleApproveUser(userId: number) {
    if (!auth) return;
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to approve user");
      alert("User approved successfully!");
      loadPendingUsers();
      loadUsers();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  async function handleRejectUser(userId: number) {
    if (!auth) return;
    if (!confirm("Are you sure you want to reject this user?")) return;
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to reject user");
      alert("User rejected successfully!");
      loadPendingUsers();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  // Agent CRUD
  function openCreateAgent() {
    setEditingAgent(null);
    setAgentForm({ name: "", system_prompt: "", provider: "openai", model: "gpt-4.1-mini", temperature: 0.7 });
    setShowAgentModal(true);
  }

  function openEditAgent(agent: Agent) {
    setEditingAgent(agent);
    // Inferir provider baseado no model
    let provider = "openai";
    if (agent.model.includes("gemini")) {
      provider = "google";
    }
    setAgentForm({
      name: agent.name,
      system_prompt: agent.system_prompt,
      provider: provider,
      model: agent.model,
      temperature: agent.temperature,
    });
    setShowAgentModal(true);
  }

  async function handleSaveAgent() {
    if (!auth) return;
    setLoading(true);

    try {
      const url = editingAgent
        ? `/api/v1/admin/agents/${editingAgent.id}`
        : "/api/v1/admin/agents";
      const method = editingAgent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.access_token}`,
        },
        body: JSON.stringify(agentForm),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(errorData.detail || errorData.message || "Failed to save agent");
      }

      setShowAgentModal(false);
      loadAgents();
      alert(editingAgent ? "Agent updated!" : "Agent created!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAgent(id: number) {
    if (!auth) return;
    if (!confirm("Delete this agent?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/agents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.access_token}` },
      });

      if (!res.ok) throw new Error("Failed to delete agent");

      loadAgents();
      alert("Agent deleted!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Document CRUD
  function openUploadModal() {
    if (agents.length === 0) {
      alert("Please create an agent first");
      return;
    }
    setUploadFile(null);
    setUploadAgentId(agents[0].id);
    setShowUploadModal(true);
  }

  async function handleUploadDocument() {
    if (!auth || !uploadFile || !uploadAgentId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("agent_id", uploadAgentId.toString());

      const res = await fetch("/api/v1/admin/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.access_token}` },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.detail || `Failed to upload document (${res.status})`;
        throw new Error(errorMsg);
      }

      setShowUploadModal(false);
      loadDocuments();
      alert("Document uploaded successfully!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDocument(id: number) {
    if (!auth) return;
    if (!confirm("Delete this document?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.access_token}` },
      });

      if (!res.ok) throw new Error("Failed to delete document");

      loadDocuments();
      alert("Document deleted!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Link CRUD
  function openCreateLink() {
    const firstAgent = agents[0]?.id || 0;
    const secondAgent = agents[1]?.id || 0;
    setLinkForm({
      from_agent_id: firstAgent,
      to_agent_id: secondAgent,
      trigger_keywords: [],
      priority: 10,
      active: true,
    });
    setKeywordInput("");
    setShowLinkModal(true);
  }

  function addKeyword() {
    if (!keywordInput.trim()) return;
    if (linkForm.trigger_keywords.includes(keywordInput.trim())) return;
    setLinkForm({
      ...linkForm,
      trigger_keywords: [...linkForm.trigger_keywords, keywordInput.trim()],
    });
    setKeywordInput("");
  }

  function removeKeyword(keyword: string) {
    setLinkForm({
      ...linkForm,
      trigger_keywords: linkForm.trigger_keywords.filter((k) => k !== keyword),
    });
  }

  async function handleSaveLink() {
    if (!auth) return;
    if (!linkForm.from_agent_id || !linkForm.to_agent_id) {
      alert("Please select both agents");
      return;
    }
    if (linkForm.trigger_keywords.length === 0) {
      alert("Please add at least one keyword");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/agent-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.access_token}`,
        },
        body: JSON.stringify(linkForm),
      });

      if (!res.ok) throw new Error("Failed to create link");

      setShowLinkModal(false);
      loadLinks();
      alert("Link created!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleLink(id: number) {
    if (!auth) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/agent-links/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${auth.access_token}` },
      });

      if (!res.ok) throw new Error("Failed to toggle link");

      loadLinks();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteLink(id: number) {
    if (!auth) return;
    if (!confirm("Delete this link?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/agent-links/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.access_token}` },
      });

      if (!res.ok) throw new Error("Failed to delete link");

      loadLinks();
      alert("Link deleted!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Settings: Load Providers
  async function loadProviders() {
    if (!auth) return;
    try {
      const res = await fetch("/api/v1/admin/llm/providers", {
        headers: { Authorization: `Bearer ${auth.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to load providers");
      const data = await res.json();
      
      // Para cada provider, verificar se tem API key configurada
      const providersWithStatus = await Promise.all(
        data.map(async (provider: any) => {
          try {
            const statusRes = await fetch(`/api/v1/admin/llm/api-keys/status/${provider.id}`, {
              headers: { Authorization: `Bearer ${auth.access_token}` },
            });
            const statusData = await statusRes.json();
            return { ...provider, configured: statusData.configured || false };
          } catch {
            return { ...provider, configured: false };
          }
        })
      );
      
      setProviders(providersWithStatus);
    } catch (err: any) {
      console.error("Error loading providers:", err);
    }
  }

  // Settings: Open API Key Modal
  function openAPIKeyModal(provider: any) {
    setSelectedProvider(provider);
    setApiKeyForm({ api_key: "", base_url: "" });
    setShowAPIKeyModal(true);
  }

  // Settings: Save API Key
  async function handleSaveAPIKey() {
    if (!auth || !selectedProvider) return;
    if (!apiKeyForm.api_key.trim()) {
      alert("API Key is required");
      return;
    }

    setSavingAPIKey(true);
    try {
      const res = await fetch("/api/v1/admin/llm/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.access_token}`,
        },
        body: JSON.stringify({
          provider_id: selectedProvider.id,
          api_key: apiKeyForm.api_key,
          base_url: apiKeyForm.base_url || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save API key");

      setShowAPIKeyModal(false);
      loadProviders();
      alert("API Key saved successfully!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSavingAPIKey(false);
    }
  }

  // Helper: Status badge
  function getStatusBadge(status: string) {
    const colors = {
      READY: "bg-green-600 text-green-100",
      PENDING: "bg-yellow-600 text-yellow-100",
      PROCESSING: "bg-blue-600 text-blue-100",
      ERROR: "bg-red-600 text-red-100",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status as keyof typeof colors] || "bg-gray-600 text-gray-100"}`}>
        {status}
      </span>
    );
  }

  // Login screen
  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#050814" }}>
        <div className="rounded-lg p-8 w-full max-w-md" style={{ background: "#0B1020", borderColor: "#1E2435", borderWidth: 1 }}>
          <h1 className="text-2xl font-bold text-white mb-6">ORKIO v4.0 Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded border focus:outline-none"
                style={{ background: "#1E2435", borderColor: "#3BC3FF", color: "#FFFFFF" }}
                placeholder="dangraebin@gmail.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded border focus:outline-none"
                style={{ background: "#1E2435", borderColor: "#3BC3FF", color: "#FFFFFF" }}
                placeholder="••••••••"
                required
              />
            </div>
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button
              type="submit"
              className="w-full text-white font-medium py-2 px-4 rounded transition"
              style={{ background: "#3BC3FF", borderRadius: "8px" }}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("dangraebin@gmail.com");
                setPassword("Patro@2025");
                setTimeout(() => {
                  const form = document.querySelector("form");
                  if (form) form.requestSubmit();
                }, 100);
              }}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition text-sm"
            >
              Login rápido (Dev)
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main admin interface
  return (
    <div className="min-h-screen text-white" style={{ background: "#050814" }}>
      {/* Header */}
      <div className="border-b p-4" style={{ background: "#0B1020", borderColor: "#1E2435" }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/logo-orkio.png" alt="ORKIO" className="h-12 w-12" />
            <div>
            <h1 className="text-2xl font-bold">ORKIO v4.0 Admin</h1>
            <p className="text-sm text-gray-400">
              {auth.email} · {auth.role}
            </p>
          </div>
          <button
            onClick={() => {
              setAuth(null);
              localStorage.removeItem("orkio_admin_v4_token");
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
            style={{ borderRadius: "8px" }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b" style={{ background: "#0B1020", borderColor: "#1E2435" }}>
        <div className="max-w-7xl mx-auto flex space-x-1 p-2">
          {["users", "agents", "documents", "links", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 rounded transition capitalize ${
                activeTab === tab ? "text-white" : "text-gray-300 hover:bg-gray-700"
              }`}
              style={{
                background: activeTab === tab ? "#3BC3FF" : "transparent",
                borderRadius: "8px",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {loading && <p className="text-gray-400">Loading...</p>}

        {/* Users Tab */}
        {activeTab === "users" && !loading && (
          <div>
            {/* Pending Users Section */}
            <div className="mb-8">
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Pending Users</h2>
                <p className="text-sm text-gray-400 mt-1">Aprove ou rejeite novos usuários que se cadastraram.</p>
              </div>
              <div className="rounded-lg overflow-hidden" style={{ background: "#0B1020", borderColor: "#1E2435", borderWidth: 1 }}>
                <table className="w-full">
                  <thead style={{ background: "#101526" }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Created</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "#1E2435" }}>
                    {pendingUsers.map((user: any) => (
                      <tr key={user.id} className="hover:bg-gray-800 transition">
                        <td className="px-4 py-3 text-sm">{user.id}</td>
                        <td className="px-4 py-3 text-sm">{user.email}</td>
                        <td className="px-4 py-3 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-center text-sm">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleApproveUser(user.id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition"
                              style={{ borderRadius: "8px" }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectUser(user.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition"
                              style={{ borderRadius: "8px" }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pendingUsers.length === 0 && <p className="text-center text-gray-400 py-8">No pending users</p>}
              </div>
            </div>
            
            {/* All Users Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold">All Users</h2>
              <p className="text-sm text-gray-400 mt-1">Gerenciar usuários do tenant PATRO.</p>
            </div>
            <div className="rounded-lg overflow-hidden" style={{ background: "#0B1020", borderColor: "#1E2435", borderWidth: 1 }}>
              <table className="w-full">
                <thead style={{ background: "#101526" }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "#1E2435" }}>
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-800 transition">
                      <td className="px-4 py-3 text-sm">{user.id}</td>
                      <td className="px-4 py-3 text-sm">{user.email}</td>
                      <td className="px-4 py-3 text-sm">{user.role}</td>
                      <td className="px-4 py-3 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p className="text-center text-gray-400 py-8">No users found</p>}
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === "agents" && !loading && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Agents</h2>
                <p className="text-sm text-gray-400 mt-1">Configure os agentes da sala de conselho.</p>
              </div>
              <button
                onClick={openCreateAgent}
                className="px-4 py-2 text-white font-medium rounded transition"
                style={{ background: "#3BC3FF", borderRadius: "8px" }}
              >
                + Create Agent
              </button>
            </div>
            <div className="rounded-lg overflow-hidden" style={{ background: "#0B1020", borderColor: "#1E2435", borderWidth: 1 }}>
              <table className="w-full">
                <thead style={{ background: "#101526" }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Model</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Temperature</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "#1E2435" }}>
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-800 transition">
                      <td className="px-4 py-3 text-sm">{agent.id}</td>
                      <td className="px-4 py-3 text-sm font-medium">{agent.name}</td>
                      <td className="px-4 py-3 text-sm">{agent.model}</td>
                      <td className="px-4 py-3 text-sm">{agent.temperature}</td>
                      <td className="px-4 py-3 text-center text-sm space-x-2">
                        <button
                          onClick={() => openEditAgent(agent)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition"
                          style={{ borderRadius: "8px" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition"
                          style={{ borderRadius: "8px" }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {agents.length === 0 && <p className="text-center text-gray-400 py-8">No agents found</p>}
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && !loading && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Documents</h2>
                <p className="text-sm text-gray-400 mt-1">Gerencie a base de conhecimento dos agentes da PATRO.</p>
              </div>
              <button
                onClick={openUploadModal}
                className="px-4 py-2 text-white font-medium rounded transition"
                style={{ background: "#3BC3FF", borderRadius: "8px" }}
              >
                + Upload Document
              </button>
            </div>
            <div className="rounded-lg overflow-hidden" style={{ background: "#0B1020", borderColor: "#1E2435", borderWidth: 1 }}>
              <table className="w-full">
                <thead style={{ background: "#101526" }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Filename</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Agent</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Chunks</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Created</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "#1E2435" }}>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-800 transition">
                      <td className="px-4 py-3 text-sm">{doc.id}</td>
                      <td className="px-4 py-3 text-sm">{doc.filename}</td>
                      <td className="px-4 py-3 text-sm">{doc.agent_name}</td>
                      <td className="px-4 py-3 text-center text-sm">{getStatusBadge(doc.status)}</td>
                      <td className="px-4 py-3 text-center text-sm">{doc.chunks || "—"}</td>
                      <td className="px-4 py-3 text-sm">{new Date(doc.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-center text-sm">
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition"
                          style={{ borderRadius: "8px" }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {documents.length === 0 && <p className="text-center text-gray-400 py-8">No documents found</p>}
            </div>
          </div>
        )}

        {/* Links Tab */}
        {activeTab === "links" && !loading && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Links entre Agentes</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Defina quando e como um agente deve acionar outro durante a conversa.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Ex: Daniel → CFO quando o assunto envolver finanças, caixa ou orçamento.
                </p>
              </div>
              <button
                onClick={openCreateLink}
                className="px-4 py-2 text-white font-medium rounded transition"
                style={{ background: "#3BC3FF", borderRadius: "8px" }}
              >
                + Novo Link
              </button>
            </div>
            <div className="rounded-lg overflow-hidden" style={{ background: "#0B1020", borderColor: "#1E2435", borderWidth: 1 }}>
              <table className="w-full">
                <thead style={{ background: "#101526" }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Origem</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">→</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Destino</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Gatilhos</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Prioridade</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Ativo</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "#1E2435" }}>
                  {links.map((link: any) => {
                    const fromAgent = agents.find((a) => a.id === link.from_agent_id);
                    const toAgent = agents.find((a) => a.id === link.to_agent_id);
                    const keywords = Array.isArray(link.trigger_keywords)
                      ? link.trigger_keywords
                      : typeof link.trigger_keywords === "string"
                      ? JSON.parse(link.trigger_keywords || "[]")
                      : [];
                    return (
                      <tr key={link.id} className="hover:bg-gray-800 transition">
                        <td className="px-4 py-3 text-sm">{fromAgent?.name || "Unknown"}</td>
                        <td className="px-4 py-3 text-center text-sm" style={{ color: "#3BC3FF" }}>
                          →
                        </td>
                        <td className="px-4 py-3 text-sm">{toAgent?.name || "Unknown"}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {keywords.map((kw: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-1 rounded text-xs"
                                style={{ background: "#1E2435", color: "#3BC3FF" }}
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">{link.priority}</td>
                        <td className="px-4 py-3 text-center text-sm">
                          <button
                            onClick={() => handleToggleLink(link.id)}
                            className={`px-3 py-1 rounded text-xs font-medium transition ${
                              link.active ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"
                            }`}
                            style={{ borderRadius: "8px" }}
                          >
                            {link.active ? "Ativo" : "Inativo"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition"
                            style={{ borderRadius: "8px" }}
                          >
                            Deletar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {links.length === 0 && (
                <p className="text-center text-gray-400 py-8">Nenhum link configurado</p>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && !loading && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Provedores de IA</h2>
              <p className="text-sm text-gray-400 mt-1">
                Configure as chaves API para os provedores de IA disponíveis.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="rounded-lg p-6 border transition hover:border-blue-500"
                  style={{ background: "#0B1020", borderColor: "#1E2435", borderWidth: 1 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{provider.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{provider.slug}</p>
                    </div>
                    {provider.configured ? (
                      <span className="px-2 py-1 bg-green-600 text-green-100 rounded text-xs font-medium">
                        ✅ Configurado
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-600 text-yellow-100 rounded text-xs font-medium">
                        ⚠️ Não configurado
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => openAPIKeyModal(provider)}
                    className="w-full px-4 py-2 text-white rounded transition font-medium"
                    style={{ background: "#3BC3FF", borderRadius: "8px" }}
                  >
                    {provider.configured ? "Atualizar chave" : "Configurar chave"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Agent Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="rounded-lg p-6 w-full max-w-2xl" style={{ background: "#0B1020", borderColor: "#1E2435", borderWidth: 1 }}>
            <h3 className="text-xl font-bold mb-4">{editingAgent ? "Edit Agent" : "Create Agent"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  className="w-full px-4 py-2 rounded border focus:outline-none"
                  style={inputStyle}
                  placeholder="Controller"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">System Prompt</label>
                <textarea
                  value={agentForm.system_prompt}
                  onChange={(e) => setAgentForm({ ...agentForm, system_prompt: e.target.value })}
                  className="w-full px-4 py-2 rounded border focus:outline-none"
                  style={inputStyle}
                  rows={8}
                  placeholder="Você é o Controller da PATRO..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Provider</label>
                <select
                  value={agentForm.provider || 'openai'}
                  onChange={(e) => {
                    const provider = e.target.value;
                    // Definir modelo padrão por provider
                    const defaultModels: Record<string, string> = {
                      openai: 'gpt-4.1-mini',
                      google: 'gemini-2.5-flash'
                    };
                    setAgentForm({ ...agentForm, provider, model: defaultModels[provider] || 'gpt-4.1-mini' });
                  }}
                  className="w-full px-4 py-2 rounded border focus:outline-none"
                  style={selectStyle}
                >
                  <option value="openai">OpenAI</option>
                  <option value="google">Google Gemini</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                <select
                  value={agentForm.model}
                  onChange={(e) => setAgentForm({ ...agentForm, model: e.target.value })}
                  className="w-full px-4 py-2 rounded border focus:outline-none"
                  style={selectStyle}
                >
                  {agentForm.provider === 'openai' && (
                    <>
                      <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                      <option value="gpt-4.1-nano">gpt-4.1-nano</option>
                    </>
                  )}
                  {agentForm.provider === 'google' && (
                    <>
                      <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Temperature ({agentForm.temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={agentForm.temperature}
                  onChange={(e) => setAgentForm({ ...agentForm, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveAgent}
                disabled={loading}
                className="flex-1 px-4 py-2 text-white rounded transition font-medium disabled:opacity-50"
                style={{ background: "#3BC3FF", borderRadius: "8px" }}
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setShowAgentModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition font-medium"
                style={{ borderRadius: "8px" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="rounded-lg p-6 w-full max-w-md" style={{ background: "#0B1020", borderColor: "#1E2435", borderWidth: 1 }}>
            <h3 className="text-xl font-bold mb-4">Upload de documento</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Arquivo</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 rounded border focus:outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Vincular ao agente</label>
                <select
                  value={uploadAgentId || ""}
                  onChange={(e) => setUploadAgentId(parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded border focus:outline-none"
                  style={selectStyle}
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleUploadDocument}
                disabled={uploading || !uploadFile}
                className="flex-1 px-4 py-2 text-white rounded transition font-medium disabled:opacity-50"
                style={{ background: "#3BC3FF", borderRadius: "8px" }}
              >
                {uploading ? "Uploading..." : "Enviar para processamento"}
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition font-medium"
                style={{ borderRadius: "8px" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="rounded-lg p-6 w-full max-w-2xl" style={{ background: "#0B1020", borderColor: "#1E2435", borderWidth: 1 }}>
            <h3 className="text-xl font-bold mb-4">Criar link entre agentes</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quando este agente estiver atendendo...
                </label>
                <select
                  value={linkForm.from_agent_id}
                  onChange={(e) => setLinkForm({ ...linkForm, from_agent_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded border focus:outline-none"
                  style={selectStyle}
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ...ele poderá acionar este agente:
                </label>
                <select
                  value={linkForm.to_agent_id}
                  onChange={(e) => setLinkForm({ ...linkForm, to_agent_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded border focus:outline-none"
                  style={selectStyle}
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Palavras-chave (gatilhos)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addKeyword();
                      }
                    }}
                    placeholder="financeiro, caixa, runway, orçamento..."
                    className="flex-1 px-4 py-2 rounded border focus:outline-none"
                    style={inputStyle}
                  />
                  <button
                    onClick={addKeyword}
                    className="px-4 py-2 text-white rounded transition"
                    style={{ background: "#3BC3FF", borderRadius: "8px" }}
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {linkForm.trigger_keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded text-sm flex items-center gap-2"
                      style={{ background: "#1E2435", color: "#3BC3FF" }}
                    >
                      {kw}
                      <button onClick={() => removeKeyword(kw)} className="hover:text-white">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prioridade (quanto maior, mais forte o gatilho)
                </label>
                <input
                  type="number"
                  value={linkForm.priority}
                  onChange={(e) => setLinkForm({ ...linkForm, priority: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded border focus:outline-none"
                  style={inputStyle}
                  min="1"
                  max="100"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-300">Ativo</label>
                <button
                  onClick={() => setLinkForm({ ...linkForm, active: !linkForm.active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    linkForm.active ? "bg-green-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      linkForm.active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveLink}
                disabled={loading}
                className="flex-1 px-4 py-2 text-white rounded transition font-medium disabled:opacity-50"
                style={{ background: "#3BC3FF", borderRadius: "8px" }}
              >
                {loading ? "Salvando..." : "Salvar link"}
              </button>
              <button
                onClick={() => setShowLinkModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition font-medium"
                style={{ borderRadius: "8px" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showAPIKeyModal && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="rounded-lg p-6 w-full max-w-md" style={{ background: "#0B1020", borderColor: "#1E2435", borderWidth: 1 }}>
            <h3 className="text-xl font-bold mb-4">Configurar API Key</h3>
            <p className="text-sm text-gray-400 mb-4">
              Provider: <span className="text-white font-medium">{selectedProvider.name}</span>
            </p>
            {selectedProvider.configured && (
              <div className="mb-4 p-3 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded">
                <p className="text-sm text-yellow-200">
                  ⚠️ Este provider já está configurado. Salvar novamente irá substituir a chave anterior.
                </p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">API Key *</label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={apiKeyForm.api_key}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, api_key: e.target.value })}
                  className="w-full px-4 py-2 rounded border focus:outline-none"
                  style={inputStyle}
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sua chave será criptografada com AES-256-GCM antes de ser salva.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Base URL (opcional)</label>
                <input
                  type="text"
                  placeholder="https://api.openai.com/v1"
                  value={apiKeyForm.base_url}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, base_url: e.target.value })}
                  className="w-full px-4 py-2 rounded border focus:outline-none"
                  style={inputStyle}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deixe em branco para usar o endpoint padrão do provider.
                </p>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveAPIKey}
                disabled={savingAPIKey || !apiKeyForm.api_key.trim()}
                className="flex-1 px-4 py-2 text-white rounded transition font-medium disabled:opacity-50"
                style={{ background: "#3BC3FF", borderRadius: "8px" }}
              >
                {savingAPIKey ? "Salvando..." : "Salvar"}
              </button>
              <button
                onClick={() => setShowAPIKeyModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition font-medium"
                style={{ borderRadius: "8px" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}

