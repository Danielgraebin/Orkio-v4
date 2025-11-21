import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function Dashboard(){
  const [usage,setUsage] = useState<any>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem("orkio_token") : null;

  useEffect(()=>{
    if(!token){ window.location.href="/auth/login"; return; }
    api.get("/usage/summary?period=2025-10", {headers:{Authorization:`Bearer ${token}`}})
      .then(r=>setUsage(r.data))
      .catch(()=>setUsage({error:true}));
  },[token]);

  return (
    <div style={{maxWidth:900, margin:"40px auto"}}>
      <div className="row" style={{justifyContent:"space-between", marginBottom:16}}>
        <div className="row"><img src="/logo-orkio.svg" width={120}/></div>
        <div className="row" style={{gap:8}}>
          <a className="btn secondary" href="/protected/agents">Agentes</a>
          <a className="btn secondary" href="/protected/links">Links</a>
          <a className="btn secondary" href="/protected/knowledge">Knowledge Base</a>
          <a className="btn secondary" href="/protected/users">Usuários</a>
          <a className="btn secondary" href="/protected/orchestrator">Orquestrador</a>
          <button 
            className="btn" 
            style={{background:"#d32f2f"}}
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("orkio_token");
              localStorage.removeItem("orkio_u_token");
              localStorage.removeItem("orkio_tenant_id");
              localStorage.removeItem("orkio_role");
              window.location.href="/auth/login";
            }}
          >
            Logout
          </button>
        </div>
      </div>
      <div className="card">
        <h2>Dashboard</h2>
        <pre>{JSON.stringify(usage,null,2)}</pre>
      </div>
    </div>
  )
}
