import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "#050814" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "#1E2435" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-orkio.png" alt="ORKIO" className="h-12 w-12" />
            <span className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>
              ORKIO
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded font-medium transition hover:opacity-80"
              style={{ color: "#3BC3FF" }}
            >
              Entrar
            </Link>
            <Link
              href="/auth/register"
              className="px-6 py-2 rounded font-medium transition hover:opacity-90"
              style={{ background: "#3BC3FF", color: "#FFFFFF", borderRadius: "8px" }}
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="flex justify-center mb-8">
          <img src="/logo-orkio.png" alt="ORKIO" className="h-24 w-24" />
        </div>
        
        <h1
          className="text-5xl md:text-6xl font-bold mb-6"
          style={{ color: "#FFFFFF" }}
        >
          Plataforma Multi-Agent
          <br />
          <span style={{ color: "#3BC3FF" }}>Inteligência Artificial</span>
        </h1>

        <p
          className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto"
          style={{ color: "#9CA3AF" }}
        >
          Crie, gerencie e orquestre agentes de IA com conhecimento personalizado.
          RAG, multi-agent e muito mais.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/auth/register"
            className="px-8 py-4 rounded font-medium text-lg transition hover:opacity-90"
            style={{ background: "#3BC3FF", color: "#FFFFFF", borderRadius: "8px" }}
          >
            Começar Agora
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-4 rounded font-medium text-lg transition hover:opacity-80"
            style={{
              background: "transparent",
              border: "2px solid #3BC3FF",
              color: "#3BC3FF",
              borderRadius: "8px",
            }}
          >
            Fazer Login
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          style={{ color: "#FFFFFF" }}
        >
          Recursos Principais
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div
            className="p-6 rounded-lg"
            style={{ background: "#0B1020", border: "1px solid #1E2435" }}
          >
            <div
              className="text-4xl mb-4"
              style={{ color: "#3BC3FF" }}
            >
              🤖
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: "#FFFFFF" }}>
              Agentes Personalizados
            </h3>
            <p style={{ color: "#9CA3AF" }}>
              Crie agentes de IA com personalidade, conhecimento e comportamento únicos.
            </p>
          </div>

          {/* Feature 2 */}
          <div
            className="p-6 rounded-lg"
            style={{ background: "#0B1020", border: "1px solid #1E2435" }}
          >
            <div
              className="text-4xl mb-4"
              style={{ color: "#3BC3FF" }}
            >
              📚
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: "#FFFFFF" }}>
              RAG Inteligente
            </h3>
            <p style={{ color: "#9CA3AF" }}>
              Upload de documentos com chunking automático e busca vetorial para respostas precisas.
            </p>
          </div>

          {/* Feature 3 */}
          <div
            className="p-6 rounded-lg"
            style={{ background: "#0B1020", border: "1px solid #1E2435" }}
          >
            <div
              className="text-4xl mb-4"
              style={{ color: "#3BC3FF" }}
            >
              🔗
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: "#FFFFFF" }}>
              Orquestração Multi-Agent
            </h3>
            <p style={{ color: "#9CA3AF" }}>
              Conecte agentes e crie fluxos de trabalho complexos com handoffs automáticos.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <div
          className="p-12 rounded-lg"
          style={{ background: "#0B1020", border: "2px solid #3BC3FF" }}
        >
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: "#FFFFFF" }}
          >
            Pronto para começar?
          </h2>
          <p
            className="text-xl mb-8"
            style={{ color: "#9CA3AF" }}
          >
            Crie sua conta gratuitamente e comece a usar o ORKIO hoje mesmo.
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-8 py-4 rounded font-medium text-lg transition hover:opacity-90"
            style={{ background: "#3BC3FF", color: "#FFFFFF", borderRadius: "8px" }}
          >
            Criar Conta Grátis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t mt-16 py-8"
        style={{ borderColor: "#1E2435" }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center" style={{ color: "#6B7280" }}>
          <p>© 2025 ORKIO. Plataforma Multi-Agent de Inteligência Artificial.</p>
        </div>
      </footer>
    </div>
  );
}

