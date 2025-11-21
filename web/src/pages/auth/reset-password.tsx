import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import Link from "next/link";
import { useRouter } from "next/router";

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  async function validateToken() {
    try {
      const { data } = await api.get(`/u/password-reset/validate-token/${token}`);
      setTokenValid(true);
      setUserEmail(data.email);
    } catch (ex: any) {
      setErr("Link inválido ou expirado");
      setTokenValid(false);
    } finally {
      setValidating(false);
    }
  }

  async function submit(e: any) {
    e.preventDefault();
    setErr("");
    setOk("");

    if (password !== confirmPassword) {
      setErr("As senhas não coincidem");
      return;
    }

    if (password.length < 8) {
      setErr("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    try {
      await api.post("/u/password-reset/reset", {
        token,
        new_password: password,
      });
      setOk("Senha redefinida com sucesso! Redirecionando para login...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (ex: any) {
      setErr(ex?.response?.data?.detail || "Erro ao redefinir senha");
    }
  }

  if (validating) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#050814" }}
      >
        <div style={{ color: "#FFFFFF" }}>Validando link...</div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#050814" }}
      >
        <div
          className="w-full max-w-md p-8 rounded-lg text-center"
          style={{ background: "#0B1020", border: "1px solid #1E2435" }}
        >
          <div className="flex justify-center mb-6">
            <img src="/logo-orkio.png" alt="ORKIO" className="h-20 w-20" />
          </div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: "#FFFFFF" }}>
            Link Inválido
          </h1>
          <p className="mb-6" style={{ color: "#9CA3AF" }}>
            Este link de recuperação é inválido ou já expirou.
          </p>
          <Link
            href="/auth/forgot-password"
            className="inline-block px-6 py-3 rounded font-medium transition hover:opacity-90"
            style={{ background: "#3BC3FF", color: "#FFFFFF", borderRadius: "8px" }}
          >
            Solicitar Novo Link
          </Link>
        </div>
      </div>
    );
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
          Redefinir Senha
        </h1>
        <p className="text-center mb-2" style={{ color: "#9CA3AF" }}>
          Digite sua nova senha
        </p>
        <p className="text-center mb-6 text-sm" style={{ color: "#6B7280" }}>
          Conta: {userEmail}
        </p>

        {/* Success */}
        {ok && (
          <div
            className="p-3 rounded mb-4 text-sm"
            style={{ background: "#14532D", color: "#86EFAC" }}
          >
            {ok}
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
              Nova Senha
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
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#D1D5DB" }}>
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded focus:outline-none"
              style={{
                background: "#1E2435",
                border: "1px solid #3BC3FF",
                color: "#FFFFFF",
              }}
              placeholder="••••••••"
              required
              minLength={8}
            />
            <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
              Mínimo de 8 caracteres
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded font-medium transition hover:opacity-90"
            style={{ background: "#3BC3FF", color: "#FFFFFF", borderRadius: "8px" }}
          >
            Redefinir Senha
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center text-sm" style={{ color: "#9CA3AF" }}>
          <Link href="/auth/login" className="hover:underline" style={{ color: "#3BC3FF" }}>
            Voltar para login
          </Link>
        </div>
      </div>
    </div>
  );
}

