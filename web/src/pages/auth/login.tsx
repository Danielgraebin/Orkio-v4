import { useState } from "react";
import { api } from "../../lib/api";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: any) {
    e.preventDefault();
    setErr("");
    try {
      console.log('[LOGIN] Enviando requisição...');
      
      // Tentar login de usuário primeiro
      let data;
      try {
        const response = await api.post("/u/auth/login", { email, password });
        data = response.data;
        console.log('[LOGIN] Login de usuário bem-sucedido:', data);
      } catch (userErr: any) {
        // Se falhar, tentar admin
        console.log('[LOGIN] Tentando login admin...');
        const response = await api.post("/admin/auth/login", { email, password });
        data = response.data;
        console.log('[LOGIN] Login admin bem-sucedido:', data);
      }

      // Save token based on role (rename access_token to token for compatibility)
      const tokenData = { ...data, token: data.access_token };
      
      if (data.role === "ADMIN" || data.role === "OWNER") {
        localStorage.setItem("orkio_admin_v4_token", JSON.stringify(tokenData));
        window.location.href = "/admin/v4";
      } else {
        localStorage.setItem("orkio_u_v4_token", JSON.stringify(tokenData));
        window.location.href = "/u/v4/chat";
      }
    } catch (ex: any) {
      console.error('[LOGIN] Erro:', ex);
      console.error('[LOGIN] Response:', ex?.response);
      setErr(ex?.response?.data?.detail || "Erro ao fazer login");
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
          <img src="/logo-orkio.png" alt="ORKIO" className="h-16 w-16" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-2" style={{ color: "#FFFFFF" }}>
          Bem-vindo ao ORKIO
        </h1>
        <p className="text-center mb-6" style={{ color: "#9CA3AF" }}>
          Entre com sua conta para continuar
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
            />
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-sm hover:underline"
              style={{ color: "#3BC3FF" }}
            >
              Esqueci minha senha
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded font-medium transition hover:opacity-90"
            style={{ background: "#3BC3FF", color: "#FFFFFF", borderRadius: "8px" }}
          >
            Entrar
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center text-sm" style={{ color: "#9CA3AF" }}>
          Não tem conta?{" "}
          <Link href="/auth/register" className="hover:underline" style={{ color: "#3BC3FF" }}>
            Cadastre-se gratuitamente
          </Link>
        </div>
      </div>
    </div>
  );
}

