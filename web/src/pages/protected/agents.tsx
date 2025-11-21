import { useState, useEffect } from "react";
import { api } from "../../lib/api";

type Agent = { 
  id: number; 
  name: string; 
  purpose?: string; 
  temperature?: number; 
  use_rag?: boolean; 
  provider?: string;
  llm_model?: string;
  owner_id: number 
};

// Model lists by provider
const MODELS_BY_PROVIDER = {
  openai: [
    "gpt-4o-mini",
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "gpt-5",
    "gpt-5-turbo",
    "gpt-5-large"
  ],
  anthropic: [
    "claude-3.5-haiku",
    "claude-3.5-sonnet",
    "claude-3-opus"
  ],
  google: [
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-2.0-flash"
  ]
};

export default function Agents(){
  const [agents, setAgents] = useState<Agent[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number|null>(null);
  const [editName, setEditName] = useState("");
  const [editPurpose, setEditPurpose] = useState("");
  const [editTemp, setEditTemp] = useState<number>(0.2);
  const [editUseRag, setEditUseRag] = useState<boolean>(false);
  const [editProvider, setEditProvider] = useState<string>("openai");
  const [editModel, setEditModel] = useState<string>("gpt-4o-mini");
  
  const token = typeof window !== 'undefined' ? localStorage.getItem("orkio_token") : null;

  async function load(){ 
    const r = await api.get("/agents"); 
    setAgents(r.data); 
  }

  async function handleLogout() {
    localStorage.removeItem("orkio_token");
    localStorage.removeItem("orkio_u_token");
    window.location.href = "/auth/login";
  }

  useEffect(()=>{ 
    if(!token){ 
      window.location.href="/auth/login"; 
      return; 
    } 
    load(); 
  },[token]);

  async function create(){
    if (!newName.trim()) return;
    await api.post("/agents",{
      owner_id:1, 
      name: newName, 
      purpose:"", 
      temperature:0.2,
      use_rag: false,
      provider: "openai",
      llm_model: "gpt-4o-mini"
    });
    setNewName(""); 
    load();
  }

  function startEdit(a: Agent) {
    setEditingId(a.id);
    setEditName(a.name);
    setEditPurpose(a.purpose || "");
    setEditTemp(a.temperature ?? 0.2);
    setEditUseRag(a.use_rag ?? false);
    setEditProvider(a.provider || "openai");
    setEditModel(a.llm_model || "gpt-4o-mini");
  }

  async function saveEdit(id: number) {
    await api.put(`/admin/agents/${id}`, {
      name: editName,
      purpose: editPurpose,
      temperature: editTemp,
      rag_enabled: editUseRag,
      provider: editProvider,
      llm_model: editModel
    });
    setEditingId(null);
    load();
  }

  async function remove(id: number) {
    if (!confirm("Excluir agente?")) return;
    await api.delete(`/agents/${id}`);
    load();
  }

  // Get available models for selected provider
  const availableModels = MODELS_BY_PROVIDER[editProvider as keyof typeof MODELS_BY_PROVIDER] || [];

  return (
    <div style={{maxWidth:1200, margin:"40px auto"}}>
      <div className="row" style={{justifyContent:"space-between", marginBottom:16}}>
        <div className="row"><img src="/logo-orkio.svg" width={120}/></div>
        <div className="row" style={{gap:8}}>
          <a className="btn secondary" href="/protected/dashboard">Dashboard</a>
          <a className="btn secondary" href="/protected/agents">Agentes</a>
          <a className="btn secondary" href="/protected/links">Links</a>
          <a className="btn secondary" href="/protected/knowledge">Knowledge Base</a>
          <a className="btn secondary" href="/protected/users">Usuários</a>
          <a className="btn secondary" href="/protected/orchestrator">Orquestrador</a>
          <button className="btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      
      <div className="card">
        <h2>Agentes</h2>
        
        <div className="row" style={{marginBottom:20}}>
          <input 
            className="input" 
            placeholder="Nome do agente" 
            value={newName} 
            onChange={e=>setNewName(e.target.value)} 
          />
          <button className="btn" onClick={create}>Criar</button>
        </div>

        <ul style={{listStyle:"none", padding:0}}>
          {agents.map(a => (
            <li key={a.id} style={{
              background:"rgba(0,0,0,0.3)", 
              borderRadius:8, 
              padding:12, 
              marginBottom:8,
              display:"flex",
              flexDirection: editingId === a.id ? "column" : "row",
              alignItems: editingId === a.id ? "stretch" : "center",
              gap:8
            }}>
              {editingId === a.id ? (
                <>
                  <div className="row" style={{gap:8, marginBottom:8}}>
                    <input 
                      className="input" 
                      style={{flex:"0 0 200px"}}
                      placeholder="Nome"
                      value={editName} 
                      onChange={e=>setEditName(e.target.value)} 
                    />
                    <input 
                      className="input" 
                      style={{flex:1}}
                      placeholder="Purpose"
                      value={editPurpose} 
                      onChange={e=>setEditPurpose(e.target.value)} 
                    />
                  </div>
                  
                  <div className="row" style={{gap:8, marginBottom:8}}>
                    <div style={{display:"flex", flexDirection:"column", gap:4}}>
                      <label style={{fontSize:12, color:"#aaa"}}>Temperature</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        min="0" 
                        max="1"
                        className="input"
                        style={{width:100}}
                        value={editTemp} 
                        onChange={e=>setEditTemp(parseFloat(e.target.value))} 
                      />
                    </div>
                    
                    <div style={{display:"flex", flexDirection:"column", gap:4}}>
                      <label style={{fontSize:12, color:"#aaa"}}>Provider</label>
                      <select 
                        className="input"
                        style={{width:150}}
                        value={editProvider}
                        onChange={e=>{
                          setEditProvider(e.target.value);
                          // Reset model to first available for new provider
                          const newModels = MODELS_BY_PROVIDER[e.target.value as keyof typeof MODELS_BY_PROVIDER];
                          if (newModels && newModels.length > 0) {
                            setEditModel(newModels[0]);
                          }
                        }}
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="google">Google</option>
                      </select>
                    </div>
                    
                    <div style={{display:"flex", flexDirection:"column", gap:4, flex:1}}>
                      <label style={{fontSize:12, color:"#aaa"}}>Model</label>
                      <select 
                        className="input"
                        value={editModel}
                        onChange={e=>setEditModel(e.target.value)}
                      >
                        {availableModels.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div style={{display:"flex", flexDirection:"column", gap:4, justifyContent:"flex-end"}}>
                      <label style={{display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap"}}>
                        <input 
                          type="checkbox" 
                          checked={editUseRag} 
                          onChange={e=>setEditUseRag(e.target.checked)} 
                        />
                        RAG Enabled
                      </label>
                    </div>
                  </div>
                  
                  <div className="row" style={{gap:8, justifyContent:"flex-end"}}>
                    <button 
                      className="btn" 
                      onClick={()=>saveEdit(a.id)}
                    >
                      Salvar
                    </button>
                    <button 
                      className="btn secondary" 
                      onClick={()=>setEditingId(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span style={{flex:1}}>
                    <strong>#{a.id}</strong> — {a.name} 
                    {a.purpose && <span style={{color:"#888"}}> · {a.purpose}</span>}
                    <br/>
                    <span style={{fontSize:12, color:"#666"}}>
                      {a.provider || "openai"} / {a.llm_model || "gpt-4o-mini"} · 
                      temp: {a.temperature} · 
                      RAG: {a.use_rag ? "✓" : "✗"}
                    </span>
                  </span>
                  <button 
                    className="btn secondary" 
                    style={{padding:"6px 12px"}}
                    onClick={()=>startEdit(a)}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn" 
                    style={{padding:"6px 12px", background:"#d32f2f"}}
                    onClick={()=>remove(a.id)}
                  >
                    Excluir
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

