import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: any) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    
    try {
      const res = await fetch("/api/v1/admin/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Erro ao criar conta");
      }
      
      // Redirecionar para login após sucesso
      alert("Conta criada com sucesso! Faça login para continuar.");
      router.push("/auth/login");
    } catch (ex: any) {
      setErr(ex.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#050814" }}
    >
      <div
        className="w-full max-w-md p-8 rounded-lg"
        style={{ background: "#0B1020", border: "1px solid #1E2435" }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/logo-orkio.png" alt="ORKIO" className="h-20 w-20" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-2" style={{ color: "#FFFFFF" }}>
          Criar Conta no ORKIO
        </h1>
        <p className="text-center mb-6" style={{ color: "#9CA3AF" }}>
          Cadastre-se gratuitamente e comece a usar
        </p>

        {/* Error */}
        {err && (
          <div
            className="p-3 rounded mb-4 text-sm"
            style={{ background: "#7F1D1D", color: "#FCA5A5" }}
          >
            {err}
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#D1D5DB" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded focus:outline-none"
              style={{
                background: "#1E2435",
                border: "1px solid #3BC3FF",
                color: "#FFFFFF",
              }}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#D1D5DB" }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded focus:outline-none"
              style={{
                background: "#1E2435",
                border: "1px solid #3BC3FF",
                color: "#FFFFFF",
              }}
              placeholder="••••••••"
              required
              minLength={6}
            />
            <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
              Mínimo de 6 caracteres
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded font-medium transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "#3BC3FF", color: "#FFFFFF", borderRadius: "8px" }}
          >
            {loading ? "Criando conta..." : "Criar Conta"}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm" style={{ color: "#9CA3AF" }}>
          Já tem conta?{" "}
          <Link href="/auth/login" className="hover:underline" style={{ color: "#3BC3FF" }}>
            Faça login
          </Link>
        </div>
      </div>
    </div>
  );
}

