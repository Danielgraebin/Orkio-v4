import React, { useState, useEffect } from 'react';

interface RAGResult {
  chunk_id: number;
  document_id: number;
  filename: string;
  content: string;
  relevance_score: number;
  distance: number;
}

interface RAGStats {
  total_documents: number;
  processed_documents: number;
  total_chunks: number;
  rag_enabled: boolean;
}

interface RAGPanelProps {
  conversationId?: number;
}

export default function RAGPanel({ conversationId }: RAGPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RAGResult[]>([]);
  const [stats, setStats] = useState<RAGStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  // Buscar estatísticas RAG
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const tokenData = localStorage.getItem('orkio_u_v4_token') || localStorage.getItem('orkio_admin_v4_token');
      if (!tokenData) return;
      
      const parsed = JSON.parse(tokenData);
      const token = parsed.access_token || parsed.token;
      
      const response = await fetch('/api/v1/u/rag/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas RAG:', error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const tokenData = localStorage.getItem('orkio_u_v4_token') || localStorage.getItem('orkio_admin_v4_token');
      if (!tokenData) return;
      
      const parsed = JSON.parse(tokenData);
      const token = parsed.access_token || parsed.token;
      
      const url = conversationId 
        ? `/api/v1/u/rag/search?query=${encodeURIComponent(query)}&conversation_id=${conversationId}&top_k=3`
        : `/api/v1/u/rag/search?query=${encodeURIComponent(query)}&top_k=3`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setShowPanel(true);
      }
    } catch (error) {
      console.error('Erro na busca RAG:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Título */}
      <h3 className="text-sm font-semibold text-gray-300">📚 Base de Conhecimento</h3>
      
      {/* Estatísticas RAG */}
      {stats && (
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-400">Documentos</p>
              <p className="text-lg font-bold text-white">{stats.processed_documents}</p>
            </div>
            <div>
              <p className="text-gray-400">Chunks</p>
              <p className="text-lg font-bold text-white">{stats.total_chunks}</p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-600">
            <p className="text-xs text-green-400">✓ RAG Ativo</p>
          </div>
        </div>
      )}

      {/* Busca RAG */}
      <div className="bg-gray-700 rounded-lg p-3">
        <h4 className="text-xs font-medium text-gray-300 mb-2">🔍 Buscar</h4>
        <div className="space-y-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Digite sua busca..."
            className="w-full px-3 py-2 bg-gray-600 text-white text-sm rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </div>

      {/* Resultados */}
      {showPanel && (
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-medium text-gray-300">
              📊 Resultados ({results.length})
            </h4>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-400 hover:text-gray-200 text-sm"
            >
              ✕
            </button>
          </div>

          {results.length === 0 ? (
            <p className="text-xs text-gray-400">Nenhum resultado encontrado.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((result, index) => {
                // Truncar conteúdo para 150 caracteres
                const truncatedContent = result.content.length > 150 
                  ? result.content.substring(0, 150) + '...' 
                  : result.content;
                
                // Destacar query no conteúdo
                const highlightedContent = truncatedContent.replace(
                  new RegExp(`(${query})`, 'gi'),
                  '<mark class="bg-yellow-400 text-black px-1 rounded">$1</mark>'
                );
                
                return (
                  <div
                    key={result.chunk_id}
                    className="bg-gray-600 rounded p-3 hover:bg-gray-550 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-medium text-white truncate">
                          {result.filename}
                        </span>
                      </div>
                      <span className="text-xs text-blue-400 ml-2 font-semibold">
                        {(result.relevance_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p 
                      className="text-xs text-gray-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: highlightedContent }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

