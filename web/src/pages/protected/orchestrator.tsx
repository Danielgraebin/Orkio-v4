import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Run = {
  id: number;
  trace_id: string;
  status: string;
  root_agent_id: number;
  depth: number;
  note?: string;
  created_at: string;
};

export default function Orchestrator(){
  const [runs, setRuns] = useState<Run[]>([]);
  const [agentId, setAgentId] = useState("1");
  const token = typeof window !== 'undefined' ? localStorage.getItem("orkio_token") : null;

  async function load(){ 
    const r = await api.get("/orchestrator/runs"); 
    setRuns(r.data); 
  }
  
  useEffect(()=>{ 
    if(!token){ 
      location.href="/auth/login"; 
      return; 
    } 
    load(); 
  },[token]);

  async function create(){
    try {
      await api.post("/orchestrator/runs",{root_agent_id: Number(agentId), depth: 0});
      load();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e.message;
      alert(`Erro ao criar run: ${msg}`);
    }
  }

  async function approve(id: number){
    try {
      await api.post(`/orchestrator/runs/${id}/approve`, { note: "approved" });
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e.message;
      alert(`Não foi possível aprovar: ${msg}`);
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case "done": return "#4caf50";
      case "running": return "#2196f3";
      case "waiting_approval": return "#ff9800";
      case "failed": return "#f44336";
      default: return "#888";
    }
  };

  return (
    <div style={{maxWidth:900, margin:"40px auto"}}>
      <div className="row" style={{justifyContent:"space-between", marginBottom:16}}>
        <div className="row"><img src="/logo-orkio.svg" width={120}/></div>
        <div className="row" style={{gap:8}}>
          <a className="btn secondary" href="/protected/dashboard">Dashboard</a>
          <a className="btn secondary" href="/protected/agents">Agentes</a>
          <a className="btn secondary" href="/protected/links">Links</a>
          <a className="btn secondary" href="/protected/knowledge">Knowledge Base</a>
          <a className="btn secondary" href="/protected/orchestrator">Orquestrador</a>
        </div>
      </div>
      
      <div className="card">
        <h2>Orquestrador</h2>
        
        <div className="row" style={{gap:8, marginBottom:20}}>
          <input 
            className="input" 
            style={{maxWidth:160}} 
            placeholder="Agent ID"
            value={agentId} 
            onChange={e=>setAgentId(e.target.value)} 
          />
          <button className="btn" onClick={create}>Criar Run</button>
        </div>
        
        <ul style={{listStyle:"none", padding:0}}>
          {runs.map(r => (
            <li key={r.id} style={{
              background:"rgba(0,0,0,0.3)", 
              borderRadius:8, 
              padding:12, 
              marginBottom:8,
              display:"flex",
              alignItems:"center",
              gap:8
            }}>
              <span style={{flex:1}}>
                <strong>#{r.id}</strong> — {r.trace_id} — 
                <span style={{
                  color: getStatusColor(r.status),
                  fontWeight: "bold",
                  marginLeft: 8
                }}>
                  {r.status}
                </span>
                <span style={{color:"#888", marginLeft:8}}>
                  agent:{r.root_agent_id} depth:{r.depth}
                </span>
                {r.note && (
                  <div style={{
                    fontSize:"0.85em", 
                    color:"#aaa", 
                    marginTop:4,
                    maxWidth:500,
                    overflow:"hidden",
                    textOverflow:"ellipsis",
                    whiteSpace:"nowrap"
                  }}>
                    {r.note}
                  </div>
                )}
              </span>
              
              {r.status === "waiting_approval" && (
                <button 
                  className="btn" 
                  style={{padding:"6px 12px", background:"#ff9800"}}
                  onClick={() => approve(r.id)}
                >
                  Aprovar
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

