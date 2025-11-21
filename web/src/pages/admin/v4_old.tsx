/**
 * ORKIO v4.0 - Admin Console COMPLETO
 * /admin/v4
 */
import { useState, useEffect } from "react";
import type { AuthLoginResponse } from "@/types";
import { login } from "@/lib/api-v4";

interface User {
  id: number;
  email: string;
  role: string;
  tenant_id: number;
  tenant_name: string;
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
  filename: string;
  agent_id: number;
  agent_name?: string;
  status: string;
  chunk_count: number;
  created_at: string;
}

interface AgentFormData {
  name: string;
  system_prompt: string;
  model: string;
  temperature: number;
}

export default function AdminV4() {
  // Auth
  const [auth, setAuth] = useState<AuthLoginResponse | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [links, setLinks] = useState<any[]>([]);

  // UI
  const [activeTab, setActiveTab] = useState<"users" | "agents" | "documents" | "links">("users");
  const [loading, setLoading] = useState(false);

  // Modals
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentForm, setAgentForm] = useState<AgentFormData>({
    name: "",
    system_prompt: "",
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

  // Load data on auth
  useEffect(() => {
    if (auth) {
      loadUsers();
      loadAgents();
      loadDocuments();
      loadLinks();
    }
  }, [auth]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await login({ email, password });
      setAuth(res);
      localStorage.setItem("orkio_admin_v4_token", res.access_token);
    } catch (err: any) {
      setLoginError(err.message || "Login failed");
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
      // Enrich documents with agent names
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

  // Agent CRUD
  function openCreateAgent() {
    setEditingAgent(null);
    setAgentForm({ name: "", system_prompt: "", model: "gpt-4.1-mini", temperature: 0.7 });
    setShowAgentModal(true);
  }

  function openEditAgent(agent: Agent) {
    setEditingAgent(agent);
    setAgentForm({
      name: agent.name,
      system_prompt: agent.system_prompt,
      model: agent.model,
      temperature: agent.temperature,
    });
    setShowAgentModal(true);
  }

  async function handleSaveAgent() {
    if (!auth) return;
    if (!agentForm.name || !agentForm.system_prompt) {
      alert("Name and System Prompt are required");
      return;
    }

    setLoading(true);
    try {
      const url = editingAgent
        ? `/api/v1/admin/agents/${editingAgent.id}`
        : "/api/v1/admin/agents";
      const method = editingAgent ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.access_token}`,
        },
        body: JSON.stringify(agentForm),
      });

      if (!res.ok) throw new Error("Failed to save agent");

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

  // Document Upload
  function openUploadModal() {
    setUploadFile(null);
    setUploadAgentId(agents[0]?.id || null);
    setShowUploadModal(true);
  }

  async function handleUploadDocument() {
    if (!auth || !uploadFile || !uploadAgentId) {
      alert("Please select a file and an agent");
      return;
    }

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
      alert("Document uploaded! Processing...");
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

  // Login screen
  if (!auth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-6">ORKIO v4.0 Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
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
                className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">ORKIO v4.0 Admin</h1>
            <p className="text-sm text-gray-400">
              {auth.email} - {auth.role}
            </p>
          </div>
          <button
            onClick={() => {
              setAuth(null);
              localStorage.removeItem("orkio_admin_v4_token");
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex space-x-1 p-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 rounded transition ${
              activeTab === "users"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("agents")}
            className={`px-6 py-3 rounded transition ${
              activeTab === "agents"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Agents
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-6 py-3 rounded transition ${
              activeTab === "documents"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setActiveTab("links")}
            className={`px-6 py-3 rounded transition ${
              activeTab === "links"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Links
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {loading && <p className="text-gray-400">Loading...</p>}

        {/* Users Tab */}
        {activeTab === "users" && !loading && (
          <div>
            <h2 className="text-xl font-bold mb-4">Users</h2>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Tenant</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700 transition">
                      <td className="px-4 py-3 text-sm">{user.id}</td>
                      <td className="px-4 py-3 text-sm">{user.email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-600 rounded text-xs font-medium">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{user.tenant_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Agents</h2>
              <button
                onClick={openCreateAgent}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition font-medium"
              >
                + New Agent
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{agent.name}</h3>
                      <p className="text-sm text-gray-400">ID: {agent.id}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-600 rounded text-xs font-medium">Active</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">System Prompt</p>
                      <p className="text-sm bg-gray-700 p-3 rounded">
                        {agent.system_prompt.substring(0, 150)}...
                      </p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Temperature:</span>
                      <span>{agent.temperature}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Created:</span>
                      <span>{new Date(agent.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => openEditAgent(agent)}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAgent(agent.id)}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {agents.length === 0 && <p className="text-center text-gray-400 py-8">No agents found</p>}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && !loading && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Documents</h2>
              <button
                onClick={openUploadModal}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition font-medium"
              >
                Upload Document
              </button>
            </div>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Filename</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Agent</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Chunks</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-700 transition">
                      <td className="px-4 py-3 text-sm">{doc.id}</td>
                      <td className="px-4 py-3 text-sm">{doc.filename}</td>
                      <td className="px-4 py-3 text-sm">{doc.agent_name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            doc.status === "READY"
                              ? "bg-green-600"
                              : doc.status === "PROCESSING"
                              ? "bg-yellow-600"
                              : doc.status === "ERROR"
                              ? "bg-red-600"
                              : "bg-gray-600"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{doc.chunk_count}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {documents.length === 0 && (
                <p className="text-center text-gray-400 py-8">No documents found</p>
              )}
            </div>
          </div>
        )}

        {/* Links Tab */}
        {activeTab === "links" && !loading && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold">Links entre Agentes</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Defina quando e como um agente deve acionar outro durante a conversa.
                </p>
              </div>
              <button
                onClick={openCreateLink}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition font-medium"
              >
                + Novo Link
              </button>
            </div>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
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
                <tbody className="divide-y divide-gray-700">
                  {links.map((link: any) => {
                    const fromAgent = agents.find((a) => a.id === link.from_agent_id);
                    const toAgent = agents.find((a) => a.id === link.to_agent_id);
                    const keywords = Array.isArray(link.trigger_keywords) 
                      ? link.trigger_keywords 
                      : (typeof link.trigger_keywords === 'string' ? JSON.parse(link.trigger_keywords || "[]") : []);
                    return (
                      <tr key={link.id} className="hover:bg-gray-700 transition">
                        <td className="px-4 py-3 text-sm">{fromAgent?.name || "Unknown"}</td>
                        <td className="px-4 py-3 text-center text-sm text-blue-400">→</td>
                        <td className="px-4 py-3 text-sm">{toAgent?.name || "Unknown"}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {keywords.map((kw: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs"
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
                              link.active
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-gray-600 hover:bg-gray-700"
                            }`}
                          >
                            {link.active ? "Ativo" : "Inativo"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition"
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
      </div>

      {/* Agent Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">
              {editingAgent ? "Edit Agent" : "Create Agent"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Controller"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">System Prompt</label>
                <textarea
                  value={agentForm.system_prompt}
                  onChange={(e) => setAgentForm({ ...agentForm, system_prompt: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  rows={8}
                  placeholder="Você é o Controller da PATRO..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                <select
                  value={agentForm.model}
                  onChange={(e) => setAgentForm({ ...agentForm, model: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                  <option value="gpt-4.1-nano">GPT-4.1 Nano</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
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
                  onChange={(e) =>
                    setAgentForm({ ...agentForm, temperature: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveAgent}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition font-medium disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setShowAgentModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition font-medium"
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
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Upload Document</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">File</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Agent</label>
                <select
                  value={uploadAgentId || ""}
                  onChange={(e) => setUploadAgentId(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
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
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition font-medium disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Criar link entre agentes</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Agente de origem
                </label>
                <select
                  value={linkForm.from_agent_id}
                  onChange={(e) =>
                    setLinkForm({ ...linkForm, from_agent_id: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
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
                  Agente de destino
                </label>
                <select
                  value={linkForm.to_agent_id}
                  onChange={(e) =>
                    setLinkForm({ ...linkForm, to_agent_id: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
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
                  Palavras-chave (gatilhos)
                </label>
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
                    placeholder="Digite e pressione Enter"
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={addKeyword}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {linkForm.trigger_keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-900 text-blue-200 rounded text-sm flex items-center gap-2"
                    >
                      {kw}
                      <button
                        onClick={() => removeKeyword(kw)}
                        className="text-blue-400 hover:text-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prioridade
                </label>
                <input
                  type="number"
                  value={linkForm.priority}
                  onChange={(e) =>
                    setLinkForm({ ...linkForm, priority: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
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
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition font-medium disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Salvar link"}
              </button>
              <button
                onClick={() => setShowLinkModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

