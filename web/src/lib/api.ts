import axios from "axios";

// usa proxy /api/v1 pra evitar CORS
export const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" }
});

// Interceptor: injeta Bearer em TODAS as requisições
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Prioridade: v4 tokens primeiro, depois fallback para tokens antigos
    const adminTokenV4 = localStorage.getItem("orkio_admin_v4_token");
    const userTokenV4 = localStorage.getItem("orkio_u_v4_token");
    const adminTokenOld = localStorage.getItem("orkio_token");
    const userTokenOld = localStorage.getItem("orkio_u_token");
    const tokenFallback = localStorage.getItem("token");
    
    let tokenData = null;
    
    // Helper function to safely parse JSON
    const safeParse = (str: string | null) => {
      if (!str) return null;
      try {
        return JSON.parse(str);
      } catch {
        // Se não for JSON válido, assumir que é apenas o token (string)
        return { token: str };
      }
    };
    
    // Tentar tokens v4 primeiro
    if (adminTokenV4) {
      tokenData = safeParse(adminTokenV4);
    } else if (userTokenV4) {
      tokenData = safeParse(userTokenV4);
    } else if (adminTokenOld) {
      tokenData = safeParse(adminTokenOld);
    } else if (userTokenOld) {
      tokenData = safeParse(userTokenOld);
    } else if (tokenFallback) {
      tokenData = safeParse(tokenFallback);
    }
    
    if (tokenData && tokenData.token) {
      config.headers.Authorization = `Bearer ${tokenData.token}`;
    }
  }
  
  return config;
});

export default api;

