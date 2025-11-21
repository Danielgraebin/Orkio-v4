import { useState } from "react";
import { api } from "../../lib/api";
import Link from "next/link";
import { useRouter } from "next/router";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [resetToken, setResetToken] = useState("");
  const router = useRouter();

  async function submit(e: any) {
    e.preventDefault();
    setErr("");
    setOk("");
    try {
      const { data } = await api.post("/u/password-reset/forgot", { email });
      setOk(data.message);
      
      // For development: auto-redirect to reset page with token
      if (data.token) {
        setTimeout(() => {
          router.push(`/auth/reset-password?token=${data.token}`);
        }, 2000);
      }
    } catch (ex: any) {
      setErr(ex?.response?.data?.detail || "Erro ao solicitar recuperação");
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
          Recuperar Senha
        </h1>
        <p className="text-center mb-6" style={{ color: "#9CA3AF" }}>
          Digite seu email para receber o link de recuperação
        </p>

        {/* Success */}
        {ok && (
          <div
            className="p-3 rounded mb-4 text-sm"
            style={{ background: "#14532D", color: "#86EFAC" }}
          >
            {ok}
            <p className="mt-2 text-xs">Redirecionando para redefinição de senha...</p>
          </div>
        )}

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

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded font-medium transition hover:opacity-90"
            style={{ background: "#3BC3FF", color: "#FFFFFF", borderRadius: "8px" }}
          >
            Enviar Link de Recuperação
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center text-sm" style={{ color: "#9CA3AF" }}>
          Lembrou sua senha?{" "}
          <Link href="/auth/login" className="hover:underline" style={{ color: "#3BC3FF" }}>
            Voltar para login
          </Link>
        </div>
      </div>
    </div>
  );
}

