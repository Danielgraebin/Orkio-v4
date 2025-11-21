/**
 * ORKIO v4.0 - User Console
 * /u/v4/chat
 */
import { useState, useEffect, useRef } from "react";
import type {
  Conversation,
  ChatMessage,
  AuthLoginResponse,
} from "@/types";
import {
  login,
  getAgents,
  getConversations,
  createConversation,
  getConversationMessages,
  streamChat,
} from "@/lib/api-v4";
import RAGPanel from "@/components/RAGPanel";

export default function ChatV4() {
  // Auth
  const [auth, setAuth] = useState<AuthLoginResponse | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Data
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Input
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [showHandoffs, setShowHandoffs] = useState(false);
  const [ragSources, setRagSources] = useState<any[]>([]);
  
  // File upload
  const [uploadedFile, setUploadedFile] = useState<any | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Agent selection
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load auth from localStorage on mount
  useEffect(() => {
    const tokenData = localStorage.getItem("orkio_u_v4_token") || localStorage.getItem("orkio_admin_v4_token");
    if (tokenData) {
      try {
        const parsed = JSON.parse(tokenData);
        setAuth(parsed);
      } catch (err) {
        console.error("Failed to parse token:", err);
        // Token inválido, redirecionar para login
        window.location.href = '/auth/login';
      }
    } else {
      // Sem token, redirecionar para login
      window.location.href = '/auth/login';
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Load conversations on auth
  useEffect(() => {
    if (auth) {
      loadConversations();
    }
  }, [auth]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation && auth) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await login({ email, password });
      setAuth(res);
      // Salvar token completo com access_token e token (compatibilidade)
      const tokenData = { ...res, token: res.access_token };
      localStorage.setItem("orkio_u_v4_token", JSON.stringify(tokenData));
    } catch (err: any) {
      setLoginError(err.message || "Login failed");
    }
  }

  async function loadConversations() {
    if (!auth) return;
    try {
      const data = await getConversations(auth.access_token);
      setConversations(data);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }

  async function loadMessages(conversationId: number) {
    if (!auth) return;
    try {
      const data = await getConversationMessages(auth.access_token, conversationId);
      setMessages(data);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }

  async function handleLogout() {
    try {
      // Call logout endpoint
      await fetch('/api/v1/u/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth?.access_token}`,
        },
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Always clear local data and redirect, even if API call fails
      localStorage.removeItem('orkio_u_v4_token');
      localStorage.removeItem('orkio_admin_v4_token');
      sessionStorage.clear();
      window.location.href = '/auth/login';
    }
  }

  async function handleNewConversation() {
    if (!auth) return;
    // Load agents and show modal
    setLoadingAgents(true);
    try {
      const data = await getAgents(auth.access_token);
      setAgents(data);
      setShowAgentModal(true);
    } catch (err) {
      console.error("Failed to load agents:", err);
      alert('Erro ao carregar agentes. Tente novamente.');
    } finally {
      setLoadingAgents(false);
    }
  }

  async function handleCreateConversationWithAgent(agentId: number) {
    if (!auth) return;
    try {
      const conv = await createConversation(auth.access_token, { agent_id: agentId });
      setConversations([conv, ...conversations]);
      setCurrentConversation(conv);
      setMessages([]);
      setShowAgentModal(false);
    } catch (err) {
      console.error("Failed to create conversation:", err);
      alert('Erro ao criar conversa. Tente novamente.');
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentConversation || !auth) {
      console.log('[UPLOAD] Validação falhou:', { file: !!file, conversation: !!currentConversation, auth: !!auth });
      return;
    }

    console.log('[UPLOAD] Iniciando upload:', { filename: file.name, size: file.size, conversation_id: currentConversation.id });
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversation_id", currentConversation.id.toString());

      console.log('[UPLOAD] Enviando request...');
      const res = await fetch(
        `/api/v1/u/files`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${auth.access_token}`,
          },
          body: formData,
        }
      );

      console.log('[UPLOAD] Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[UPLOAD] Erro na resposta:', errorText);
        throw new Error(`Upload falhou: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      console.log('[UPLOAD] Sucesso:', data);
      setUploadedFile(data);
      alert('✅ Arquivo enviado com sucesso!');
    } catch (err: any) {
      console.error('[UPLOAD] Erro:', err);
      alert("❌ Erro ao fazer upload: " + err.message);
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleSendMessage() {
    if (!input.trim() || !currentConversation || !auth || isStreaming) return;

    const userMessage = input.trim();
    const attachment = uploadedFile ? uploadedFile.filename : null;
    const attachmentFileId = uploadedFile ? uploadedFile.file_id : null;
    setInput("");
    setUploadedFile(null); // Limpar arquivo após enviar
    setIsStreaming(true);
    setStreamingContent("");

    // Add user message to UI
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
      ...(attachment && { attachment, attachmentFileId }), // Adicionar attachment e file_id se existir
    };
    setMessages([...messages, tempUserMsg]);

    // Stream response
    await streamChat(
      auth.access_token,
      {
        conversation_id: currentConversation.id,
        agent_id: currentConversation.agent_id,
        message: userMessage,
      },
      (delta) => {
        setStreamingContent((prev) => prev + delta);
      },
      (sources) => {
        // Done: reload messages to get persisted assistant message
        setIsStreaming(false);
        setStreamingContent("");
        setRagSources(sources || []);
        loadMessages(currentConversation.id);
      },
      (err) => {
        console.error("Streaming error:", err);
        setIsStreaming(false);
        setStreamingContent("");
      }
    );
  }

  // ===== RENDER =====

  if (!auth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-6">ORKIO v4.0 Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="dangraebin@gmail.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("dangraebin@gmail.com");
                setPassword("Patro@2025");
                setTimeout(() => {
                  const form = document.querySelector('form');
                  if (form) form.requestSubmit();
                }, 100);
              }}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition text-sm"
            >
              Login rápido (Dev)
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-96 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo-orkio.png" alt="ORKIO" className="h-10 w-10" />
            <h2 className="text-lg font-bold">ORKIO v4.0</h2>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">{auth.email}</p>
            <button
              onClick={handleLogout}
              className="text-xs text-red-400 hover:text-red-300 transition"
              title="Sair"
            >
              Logout
            </button>
          </div>
        </div>

        {/* New Conversation Button */}
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={handleNewConversation}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nova Conversa
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Conversations</h3>
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setCurrentConversation(conv)}
                className={`w-full text-left px-3 py-2 rounded mb-2 text-sm transition ${
                  currentConversation?.id === conv.id
                    ? "bg-blue-600"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                <div className="font-medium">{conv.title || `Conversa ${conv.id}`}</div>
                <div className="text-xs text-gray-400">{conv.agent_name}</div>
              </button>
            ))}
          </div>
          
          {/* RAG Panel */}
          <div className="border-t border-gray-700 pt-4">
            <RAGPanel conversationId={currentConversation?.id} />
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold">{currentConversation.title || `Conversa ${currentConversation.id}`}</h2>
                  <p className="text-sm text-gray-400">Agente: {currentConversation.agent_name}</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHandoffs}
                    onChange={(e) => setShowHandoffs(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Show Agent Handoffs
                </label>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{backgroundImage: 'none'}}>
              {messages.map((msg) => {
                // Filtrar mensagens de handoff se toggle estiver desligado
                if (msg.role === 'system' && !showHandoffs) return null;
                
                return (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : 
                    msg.role === "system" ? "justify-center" : 
                    "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-2xl px-4 py-2 rounded-lg ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : msg.role === "system"
                        ? "bg-yellow-900 border border-yellow-600 text-yellow-100"
                        : "bg-gray-700 text-gray-100"
                    }`}
                  >
                    <div className="text-xs font-medium mb-1 opacity-70">
                      {msg.role === "user" ? "Você" : 
                       msg.role === "system" ? "🔗 Agent Handoff" :
                       currentConversation.agent_name}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {/* Mostrar anexo se houver */}
                    {msg.role === "user" && (msg as any).attachment && (
                      <div className="mt-2 pt-2 border-t border-gray-500">
                        <a
                          href={(msg as any).attachmentFileId ? `/api/v1/u/files/${(msg as any).attachmentFileId}` : '#'}
                          download
                          className="flex items-center gap-2 text-xs hover:text-blue-300 transition cursor-pointer"
                          onClick={(e) => {
                            if (!(msg as any).attachmentFileId) {
                              e.preventDefault();
                              alert('Arquivo não disponível para download');
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                          </svg>
                          <span className="underline">{(msg as any).attachment}</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}

              {/* Streaming message */}
              {isStreaming && streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-2xl px-4 py-2 rounded-lg bg-gray-700 text-gray-100">
                    <div className="text-xs font-medium mb-1 opacity-70">
                      {currentConversation.agent_name}
                    </div>
                    <div className="whitespace-pre-wrap">{streamingContent}</div>
                    <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1"></span>
                    {ragSources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-blue-400">
                        📄 Baseado em: {ragSources.map(s => s.document_title).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-gray-800 border-t border-gray-700 p-4">
              {/* Upload Button - REMOVIDO para limpar interface */}
              {/* File Preview */}
              {uploadedFile && (
                <div className="mb-3 p-3 bg-gray-700 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium">{uploadedFile.filename}</p>
                      <p className="text-xs text-gray-400">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="text-red-400 hover:text-red-300 transition"
                    title="Remover arquivo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="flex gap-2 items-end">
                {/* Botão de Upload Discreto */}
                <label 
                  className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition flex items-center justify-center"
                  style={{ padding: '4px', width: '26px', height: '26px' }}
                  title="Anexar documento"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '18px', height: '18px' }} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                  </svg>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.txt,.doc,.docx,.json,.csv,.xlsx" 
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                  />
                </label>
                
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // Auto-grow
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 280) + 'px'; // max 10 linhas
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                      // Reset height
                      e.currentTarget.style.height = '110px';
                    }
                  }}
                  placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
                  disabled={isStreaming}
                  rows={1}
                  style={{
                    minHeight: '110px',
                    maxHeight: '280px',
                    resize: 'none',
                    overflow: 'auto',
                    lineHeight: '1.6',
                    padding: '12px 14px',
                    fontSize: '16px',
                    borderRadius: '10px'
                  }}
                  className="flex-1 bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => {
                    handleSendMessage();
                    // Reset textarea height
                    const textarea = document.querySelector('textarea');
                    if (textarea) textarea.style.height = '110px';
                  }}
                  disabled={isStreaming || !input.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center justify-center"
                  style={{ minHeight: '48px', width: '48px' }}
                >
                  {isStreaming ? "..." : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>Selecione ou crie uma conversa para começar</p>
          </div>
        )}
      </div>

      {/* Agent Selection Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Escolha um Agente</h2>
              <p className="text-gray-400 text-sm mt-1">Selecione o agente que vai conduzir esta conversa</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingAgents ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleCreateConversationWithAgent(agent.id)}
                      className="text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition border border-gray-600 hover:border-blue-500"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">{agent.name}</h3>
                          <div className="flex gap-3 text-xs text-gray-400 mb-2">
                            <span className="bg-gray-800 px-2 py-1 rounded">{agent.model}</span>
                            <span className="bg-gray-800 px-2 py-1 rounded">{agent.provider}</span>
                          </div>
                          {agent.system_prompt && (
                            <p className="text-sm text-gray-300 line-clamp-2">{agent.system_prompt}</p>
                          )}
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 flex-shrink-0 ml-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-700">
              <button
                onClick={() => setShowAgentModal(false)}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

