import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Link = {
  id: number;
  source_agent_id: number;
  target_agent_id: number;
  trigger: string;
  autonomy: string;
  max_depth: number;
  enabled: boolean;
};

type Agent = { id: number; name: string };

export default function Links(){
  const [links, setLinks] = useState<Link[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sourceId, setSourceId] = useState<number>(0);
  const [targetId, setTargetId] = useState<number>(0);
  const [trigger, setTrigger] = useState("on_result");
  const [autonomy, setAutonomy] = useState("auto_safe");
  const [maxDepth, setMaxDepth] = useState(2);
  
  const token = typeof window !== 'undefined' ? localStorage.getItem("orkio_token") : null;

  async function loadLinks(){ 
    const r = await api.get("/links"); 
    setLinks(r.data); 
  }

  async function loadAgents(){ 
    const r = await api.get("/agents"); 
    setAgents(r.data); 
  }

  useEffect(()=>{ 
    if(!token){ 
      location.href="/auth/login"; 
      return; 
    } 
    loadLinks();
    loadAgents();
  },[token]);

  async function create(){
    if (!sourceId || !targetId) {
      alert("Selecione source e target");
      return;
    }
    await api.post("/links",{
      source_agent_id: sourceId,
      target_agent_id: targetId,
      trigger,
      autonomy,
      max_depth: maxDepth,
      enabled: true
    });
    loadLinks();
  }

  async function remove(id: number) {
    if (!confirm("Excluir link?")) return;
    await api.delete(`/links/${id}`);
    loadLinks();
  }

  const getAgentName = (id: number) => {
    const agent = agents.find(a => a.id === id);
    return agent ? agent.name : `#${id}`;
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
        <h2>Links entre Agentes</h2>
        
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20}}>
          <div>
            <label style={{display:"block", marginBottom:4}}>Source Agent</label>
            <select className="input" value={sourceId} onChange={e=>setSourceId(parseInt(e.target.value))}>
              <option value={0}>Selecione...</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          
          <div>
            <label style={{display:"block", marginBottom:4}}>Target Agent</label>
            <select className="input" value={targetId} onChange={e=>setTargetId(parseInt(e.target.value))}>
              <option value={0}>Selecione...</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          
          <div>
            <label style={{display:"block", marginBottom:4}}>Trigger</label>
            <select className="input" value={trigger} onChange={e=>setTrigger(e.target.value)}>
              <option value="on_result">on_result</option>
              <option value="on_event">on_event</option>
              <option value="on_schedule">on_schedule</option>
            </select>
          </div>
          
          <div>
            <label style={{display:"block", marginBottom:4}}>Autonomy</label>
            <select className="input" value={autonomy} onChange={e=>setAutonomy(e.target.value)}>
              <option value="manual">manual</option>
              <option value="assisted">assisted</option>
              <option value="auto_safe">auto_safe</option>
            </select>
          </div>
          
          <div>
            <label style={{display:"block", marginBottom:4}}>Max Depth</label>
            <input 
              type="number" 
              className="input" 
              value={maxDepth} 
              onChange={e=>setMaxDepth(parseInt(e.target.value))}
              min={1}
              max={10}
            />
          </div>
          
          <div style={{display:"flex", alignItems:"end"}}>
            <button className="btn" style={{width:"100%"}} onClick={create}>Criar Link</button>
          </div>
        </div>

        <ul style={{listStyle:"none", padding:0}}>
          {links.map(link => (
            <li key={link.id} style={{
              background:"rgba(0,0,0,0.3)", 
              borderRadius:8, 
              padding:12, 
              marginBottom:8,
              display:"flex",
              alignItems:"center",
              gap:8
            }}>
              <span style={{flex:1}}>
                <strong>#{link.id}</strong> — 
                <span style={{color:"#4fc3f7"}}> {getAgentName(link.source_agent_id)}</span> → 
                <span style={{color:"#81c784"}}> {getAgentName(link.target_agent_id)}</span>
                <span style={{color:"#888", marginLeft:8}}>
                  {link.trigger} · {link.autonomy} · depth:{link.max_depth}
                </span>
                {!link.enabled && <span style={{color:"#f44336", marginLeft:8}}>[disabled]</span>}
              </span>
              <button 
                className="btn" 
                style={{padding:"6px 12px", background:"#d32f2f"}}
                onClick={()=>remove(link.id)}
              >
                Excluir
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
