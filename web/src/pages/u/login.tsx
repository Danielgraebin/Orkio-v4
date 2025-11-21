import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "../../lib/api";

export default function UserLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/u/auth/login", { email, password });
      localStorage.setItem("orkio_u_token", response.data.access_token);
      localStorage.setItem("orkio_u_tenant", response.data.tenant_id);
      router.push("/u/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Login failed");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 20 }}>
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <img src="/logo-orkio.png" width={100} style={{ marginBottom: 10 }} />
        <h2>ORKIO Users</h2>
        <p style={{ color: "#888" }}>Login to your account</p>
      </div>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Email</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div style={{ color: "#f44336", marginBottom: 16, fontSize: "0.9em" }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn" style={{ width: "100%" }}>
          Login
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <a href="/u/register" style={{ color: "#F6C453" }}>
          Don't have an account? Register
        </a>
      </div>
    </div>
  );
}

