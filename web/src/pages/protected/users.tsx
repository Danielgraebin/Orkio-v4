import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type User = {
  id: number;
  email: string;
  role: string;
  is_approved: boolean;
  created_at?: string;
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem("orkio_token") : null;

  async function loadUsers() {
    try {
      const [allResp, pendingResp] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/users/pending")
      ]);
      setUsers(allResp.data);
      setPendingUsers(pendingResp.data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  }

  useEffect(() => {
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }
    loadUsers();
  }, [token]);

  async function approveUser(userId: number) {
    if (!confirm("Aprovar este usuário?")) return;
    
    setLoading(true);
    try {
      await api.post(`/admin/users/${userId}/approve`);
      alert("Usuário aprovado com sucesso!");
      loadUsers();
    } catch (err: any) {
      alert(`Erro ao aprovar: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(userId: number, email: string) {
    if (!confirm(`Excluir usuário ${email}?`)) return;
    
    setLoading(true);
    try {
      await api.delete(`/admin/users/${userId}`);
      alert("Usuário excluído com sucesso!");
      loadUsers();
    } catch (err: any) {
      alert(`Erro ao excluir: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: "40px auto", padding: 20 }}>
      {/* Header */}
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div className="row"><img src="/logo-orkio.svg" width={120} /></div>
        <div className="row" style={{ gap: 8 }}>
          <a className="btn secondary" href="/protected/dashboard">Dashboard</a>
          <a className="btn secondary" href="/protected/agents">Agentes</a>
          <a className="btn secondary" href="/protected/links">Links</a>
          <a className="btn secondary" href="/protected/knowledge">Knowledge Base</a>
          <a className="btn secondary" href="/protected/users">Usuários</a>
          <a className="btn secondary" href="/protected/orchestrator">Orquestrador</a>
          <button
            className="btn"
            style={{ background: "#d32f2f" }}
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("orkio_token");
              localStorage.removeItem("orkio_u_token");
              localStorage.removeItem("orkio_tenant_id");
              localStorage.removeItem("orkio_role");
              window.location.href = "/auth/login";
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 30 }}>
        <h2>Usuários Pendentes de Aprovação</h2>
        
        {pendingUsers.length === 0 ? (
          <p style={{ color: "#888" }}>Nenhum usuário pendente</p>
        ) : (
          <table style={{ width: "100%", marginTop: 16 }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Data de Criação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleString('pt-BR') : '-'}</td>
                  <td>
                    <button
                      className="btn primary"
                      style={{ padding: "6px 12px", marginRight: 8 }}
                      onClick={() => approveUser(u.id)}
                      disabled={loading}
                    >
                      Aprovar
                    </button>
                    <button
                      className="btn"
                      style={{ padding: "6px 12px", background: "#d32f2f" }}
                      onClick={() => deleteUser(u.id, u.email)}
                      disabled={loading}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>Todos os Usuários</h2>
        
        {users.length === 0 ? (
          <p style={{ color: "#888" }}>Nenhum usuário cadastrado</p>
        ) : (
          <table style={{ width: "100%", marginTop: 16 }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Data de Criação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      background: u.is_approved ? "#4caf50" : "#ff9800",
                      color: "white",
                      fontSize: "0.85em"
                    }}>
                      {u.is_approved ? "Aprovado" : "Pendente"}
                    </span>
                  </td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleString('pt-BR') : '-'}</td>
                  <td>
                    {!u.is_approved && (
                      <button
                        className="btn primary"
                        style={{ padding: "6px 12px", marginRight: 8 }}
                        onClick={() => approveUser(u.id)}
                        disabled={loading}
                      >
                        Aprovar
                      </button>
                    )}
                    <button
                      className="btn"
                      style={{ padding: "6px 12px", background: "#d32f2f" }}
                      onClick={() => deleteUser(u.id, u.email)}
                      disabled={loading}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

