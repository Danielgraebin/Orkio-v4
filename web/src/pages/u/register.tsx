import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "../../lib/api";

export default function UserRegister() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/u/auth/register", { email, password, name });
      localStorage.setItem("orkio_u_token", response.data.access_token);
      localStorage.setItem("orkio_u_tenant", response.data.tenant_id);
      router.push("/u/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Registration failed");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 20 }}>
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <img src="/logo-orkio.png" width={100} style={{ marginBottom: 10 }} />
        <h2>ORKIO Users</h2>
        <p style={{ color: "#888" }}>Create your account</p>
      </div>

      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Name</label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

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
            minLength={6}
          />
        </div>

        {error && (
          <div style={{ color: "#f44336", marginBottom: 16, fontSize: "0.9em" }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn" style={{ width: "100%" }}>
          Register
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <a href="/u/login" style={{ color: "#F6C453" }}>
          Already have an account? Login
        </a>
      </div>
    </div>
  );
}

