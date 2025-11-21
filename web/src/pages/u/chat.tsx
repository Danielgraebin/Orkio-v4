import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import {
  getAgents,
  getConversations,
  createConversation,
  getConversationMessages,
  deleteConversation,
  sendMessage,
  renameConversation,
  uploadAttachment,
  sendAgentMessage,
  getRAGEvents,
  getAgentDialogs,
  AuthError,
} from "../../lib/api-u";

interface Agent {
  id: number;
  name: string;
  use_rag: boolean;
  llm_model: string;
  avatar_url?: string;
}

interface Conversation {
  id: number;
  title: string;
  agent_id: number;
  created_at: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  agent_name?: string;
}

export default function ChatPage() {
  const router = useRouter();
  
  // Estados principais
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [currentAgentId, setCurrentAgentId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Estados de UI
  const [showHivePanel, setShowHivePanel] = useState(false);
  const [hiveTab, setHiveTab] = useState<"rag" | "rg">("rag");
  const [ragEvents, setRagEvents] = useState<any[]>([]);
  const [agentDialogs, setAgentDialogs] = useState<any[]>([]);
  
  // Estados de edição
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  
  // Estados de upload
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados de modal CFO
  const [showCFOModal, setShowCFOModal] = useState(false);
  const [cfoMessage, setCfoMessage] = useState("");
  const [cfoResponse, setCfoResponse] = useState("");
  
  // Ref para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll automático após nova mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Carregar agentes
  useEffect(() => {
    loadAgents();
    loadConversations();
  }, []);
  
  // Carregar mensagens quando conversa muda
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);
  
  // Carregar dados do Hive quando painel abre
  useEffect(() => {
    if (showHivePanel) {
      if (hiveTab === "rag") {
        loadRAGEvents();
      } else {
        loadAgentDialogs();
      }
    }
  }, [showHivePanel, hiveTab, currentConversationId]);
  
  async function loadAgents() {
    try {
      const data = await getAgents();
      setAgents(data);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/u/login");
      } else {
        console.error("Erro ao carregar agentes:", err);
      }
    }
  }
  
  async function loadConversations() {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      console.error("Erro ao carregar conversas:", err);
    }
  }
  
  async function loadMessages(conversationId: number) {
    try {
      const data = await getConversationMessages(conversationId);
      setMessages(data);
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
    }
  }
  
  async function loadRAGEvents() {
    try {
      const data = await getRAGEvents(currentConversationId || undefined);
      setRagEvents(data);
    } catch (err) {
      console.error("Erro ao carregar RAG events:", err);
    }
  }
  
  async function loadAgentDialogs() {
    try {
      const data = await getAgentDialogs();
      setAgentDialogs(data);
    } catch (err) {
      console.error("Erro ao carregar agent dialogs:", err);
    }
  }
  
  async function handleNewChat() {
    if (!currentAgentId) {
      alert("Selecione um agente primeiro");
      return;
    }
    
    try {
      const conv = await createConversation(currentAgentId);
      setCurrentConversationId(conv.id);
      await loadConversations();
    } catch (err) {
      console.error("Erro ao criar conversa:", err);
    }
  }
  
  async function handleSendMessage() {
    if (!inputMessage.trim() || !currentAgentId) return;
    
    setLoading(true);
    try {
      const response = await sendMessage(
        currentConversationId,
        currentAgentId,
        inputMessage
      );
      
      // Se não tinha conversa, criar uma nova
      if (!currentConversationId && response.conversation_id) {
        setCurrentConversationId(response.conversation_id);
        await loadConversations();
      }
      
      const currentAgent = agents.find(a => a.id === currentAgentId);
      
      // Adicionar mensagens localmente
      setMessages(prev => [
        ...prev,
        { 
          id: Date.now(), 
          role: "user", 
          content: inputMessage, 
          created_at: new Date().toISOString() 
        },
        { 
          id: Date.now() + 1, 
          role: "assistant", 
          content: response.reply, 
          created_at: new Date().toISOString(),
          agent_name: currentAgent?.name
        }
      ]);
      
      setInputMessage("");
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      alert("Erro ao enviar mensagem");
    } finally {
      setLoading(false);
    }
  }
  
  async function handleDeleteConversation(id: number) {
    if (!confirm("Deletar esta conversa?")) return;
    
    try {
      await deleteConversation(id);
      if (currentConversationId === id) {
        setCurrentConversationId(null);
      }
      await loadConversations();
    } catch (err) {
      console.error("Erro ao deletar conversa:", err);
    }
  }
  
  async function handleRenameConversation() {
    if (!currentConversationId || !newTitle.trim()) return;
    
    try {
      await renameConversation(currentConversationId, newTitle);
      setEditingTitle(false);
      await loadConversations();
    } catch (err) {
      console.error("Erro ao renomear conversa:", err);
    }
  }
  
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    if (!currentConversationId || !currentAgentId) {
      alert("Selecione uma conversa primeiro");
      return;
    }
    
    setUploadingFile(true);
    try {
      const result = await uploadAttachment(currentConversationId, file, currentAgentId);
      alert(`Arquivo enviado: ${file.name} (${result.status})`);
      setSelectedFile(null);
      
      // Recarregar RAG events se painel estiver aberto
      if (showHivePanel && hiveTab === "rag") {
        await loadRAGEvents();
      }
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      alert("Erro ao fazer upload do arquivo");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }
  
  async function handleSendToCFO() {
    if (!cfoMessage.trim() || currentAgentId !== 6) return;
    
    setLoading(true);
    try {
      const response = await sendAgentMessage(6, 7, cfoMessage); // 6=Daniel, 7=CFO
      setCfoResponse(response.response);
      
      // Recarregar RG events
      if (showHivePanel && hiveTab === "rg") {
        await loadAgentDialogs();
      }
    } catch (err) {
      console.error("Erro ao enviar ao CFO:", err);
      alert("Erro ao enviar mensagem ao CFO");
    } finally {
      setLoading(false);
    }
  }
  
  // Formatar timestamp
  function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  
  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const currentAgent = agents.find(a => a.id === currentAgentId);
  
  return (
    <div className="flex h-screen bg-[#0B1120] text-white overflow-hidden">
      {/* Sidebar Esquerda - 260px */}
      <div className="w-[260px] bg-[#1A2332] flex flex-col border-r border-gray-700 flex-shrink-0">
        {/* Header */}
        <div className="p-3 border-b border-gray-700">
          <button
            onClick={handleNewChat}
            className="w-full px-3 py-2.5 bg-[#2A3441] rounded-md hover:bg-[#3A4451] transition-colors text-sm font-medium"
          >
            + New chat
          </button>
        </div>
        
        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto p-2">
          <h3 className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Chats</h3>
          <div className="space-y-0.5">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                  currentConversationId === conv.id ? "bg-[#2A3441]" : "hover:bg-[#2A3441]"
                }`}
                onClick={() => setCurrentConversationId(conv.id)}
              >
                <span className="text-sm truncate flex-1">{conv.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Seleção de Agente */}
        <div className="p-3 border-t border-gray-700 space-y-2">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Select Agent
          </label>
          <select
            value={currentAgentId || ""}
            onChange={(e) => setCurrentAgentId(Number(e.target.value))}
            className="w-full px-2 py-2 bg-[#2A3441] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione...</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          
          {currentAgent && (
            <div className="text-xs space-y-0.5 pt-1">
              <div className="text-gray-400">
                <span className="font-semibold">Purpose:</span> {currentAgent.name}
              </div>
              <div className="text-gray-400">
                <span className="font-semibold">Model:</span> {currentAgent.llm_model}
              </div>
              <div className="text-gray-400">
                <span className="font-semibold">RAG:</span> {currentAgent.use_rag ? "✓ Enabled" : "✗ Disabled"}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Painel Central */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 bg-[#1A2332] border-b border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {editingTitle ? (
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleRenameConversation()}
                onBlur={handleRenameConversation}
                className="px-2 py-1 bg-[#2A3441] rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
                autoFocus
              />
            ) : (
              <>
                <h2 className="text-base font-semibold truncate">
                  {currentConversation?.title || "Selecione uma conversa"}
                </h2>
                {currentConversationId && (
                  <button
                    onClick={() => {
                      setEditingTitle(true);
                      setNewTitle(currentConversation?.title || "");
                    }}
                    className="text-gray-400 hover:text-white transition-colors flex-shrink-0 text-sm"
                    title="Renomear conversa"
                  >
                    ✏️
                  </button>
                )}
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setShowHivePanel(!showHivePanel)}
              className="px-3 py-1.5 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {showHivePanel ? "Hide" : "Show"} RAG/RG
            </button>
            
            {/* Logo ORKIO */}
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full"></div>
              <span className="text-lg font-bold text-blue-400">ORKIO</span>
            </div>
          </div>
        </div>
        
        {/* Timeline de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <p className="text-base font-semibold mb-1">Você</p>
                <p className="text-sm">Nenhuma mensagem ainda. Comece uma conversa!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] ${msg.role === "user" ? "" : "flex items-start gap-2"}`}>
                    {/* Avatar do agente (se for assistant) */}
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {msg.agent_name?.charAt(0) || "A"}
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-1">
                      {/* Identificação + Timestamp */}
                      <div className={`flex items-center gap-2 text-xs text-gray-400 ${msg.role === "user" ? "justify-end" : ""}`}>
                        <span className="font-semibold">
                          {msg.role === "user" ? "Você" : msg.agent_name || "Agente"}
                        </span>
                        <span>{formatTime(msg.created_at)}</span>
                      </div>
                      
                      {/* Conteúdo da mensagem */}
                      <div
                        className={`px-4 py-2.5 rounded-lg ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-[#2A3441] text-gray-100"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Input de Mensagem - FULL WIDTH */}
        <div className="p-4 bg-[#1A2332] border-t border-gray-700 flex-shrink-0">
          {/* Input file oculto */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            disabled={!currentConversationId || uploadingFile}
            accept="*/*"
          />
          
          <div className="max-w-4xl mx-auto w-full">
            {/* Preview de arquivo selecionado */}
            {selectedFile && (
              <div className="mb-2 px-3 py-2 bg-[#2A3441] rounded-md flex items-center justify-between text-sm">
                <span className="text-gray-300">📎 {selectedFile.name}</span>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            )}
            
            <div className="flex items-end gap-2">
              {/* Botão Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!currentConversationId || uploadingFile}
                className="px-3 py-3 bg-[#2A3441] rounded-lg hover:bg-[#3A4451] disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                title="Upload arquivo"
              >
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              
              {/* Textarea GRANDE E FULL-WIDTH */}
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-4 py-3 bg-[#2A3441] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed"
                style={{ minHeight: "56px", maxHeight: "200px" }}
                rows={2}
                disabled={loading || !currentAgentId}
              />
              
              {/* Botões */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !inputMessage.trim() || !currentAgentId}
                  className="px-5 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium text-sm whitespace-nowrap"
                >
                  {loading ? "..." : "Send"}
                </button>
                
                {/* Botão CFO */}
                {currentAgentId === 6 && (
                  <button
                    onClick={() => setShowCFOModal(true)}
                    className="px-3 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium whitespace-nowrap"
                    title="Enviar ao CFO"
                  >
                    📤 CFO
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Painel Hive RAG/RG (Slide-over) */}
      {showHivePanel && (
        <div className="w-80 bg-[#1A2332] border-l border-gray-700 flex flex-col flex-shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setHiveTab("rag")}
              className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
                hiveTab === "rag" ? "bg-blue-600 text-white" : "bg-[#2A3441] text-gray-300 hover:bg-[#3A4451]"
              }`}
            >
              RAG
            </button>
            <button
              onClick={() => setHiveTab("rg")}
              className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
                hiveTab === "rg" ? "bg-blue-600 text-white" : "bg-[#2A3441] text-gray-300 hover:bg-[#3A4451]"
              }`}
            >
              RG (Agentes)
            </button>
          </div>
          
          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto p-3">
            {hiveTab === "rag" ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-base">RAG Events</h3>
                {ragEvents.length === 0 ? (
                  <p className="text-gray-400 text-sm">Nenhum evento RAG ainda.</p>
                ) : (
                  ragEvents.map((event, idx) => (
                    <div key={idx} className="bg-[#2A3441] rounded-md p-2.5 text-xs space-y-1">
                      <div><span className="font-semibold">Query:</span> {event.query || "N/A"}</div>
                      <div><span className="font-semibold">Hits:</span> {event.hit_count || 0}</div>
                      <div><span className="font-semibold">Latency:</span> {event.latency_ms || 0}ms</div>
                      <div><span className="font-semibold">Status:</span> {event.status || "ok"}</div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-semibold text-base">Agent-to-Agent Dialogue</h3>
                {agentDialogs.length === 0 ? (
                  <p className="text-gray-400 text-sm">Nenhum diálogo entre agentes ainda.</p>
                ) : (
                  agentDialogs.map((dialog, idx) => (
                    <div key={idx} className="bg-[#2A3441] rounded-md p-2.5 text-xs space-y-1.5">
                      <div className="font-semibold text-sm">
                        {dialog.from_agent_name || `Agent ${dialog.from_agent_id}`} → {dialog.to_agent_name || `Agent ${dialog.to_agent_id}`}
                      </div>
                      <div className="text-gray-300">{dialog.message}</div>
                      <div className="text-gray-400">{new Date(dialog.created_at).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modal CFO */}
      {showCFOModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#1A2332] rounded-lg p-5 w-96 space-y-3 border border-gray-700">
            <h3 className="text-lg font-bold">Enviar ao CFO</h3>
            <textarea
              value={cfoMessage}
              onChange={(e) => setCfoMessage(e.target.value)}
              placeholder="Digite sua mensagem para o CFO..."
              className="w-full px-3 py-2 bg-[#2A3441] rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={4}
            />
            {cfoResponse && (
              <div className="bg-[#2A3441] rounded-md p-2.5">
                <p className="text-xs font-semibold mb-1">Resposta do CFO:</p>
                <p className="text-xs text-gray-300">{cfoResponse}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSendToCFO}
                disabled={loading || !cfoMessage.trim()}
                className="flex-1 px-3 py-2 bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-600 transition-colors text-sm"
              >
                {loading ? "Enviando..." : "Enviar"}
              </button>
              <button
                onClick={() => {
                  setShowCFOModal(false);
                  setCfoMessage("");
                  setCfoResponse("");
                }}
                className="flex-1 px-3 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

