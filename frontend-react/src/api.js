const BASE_API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Utilidades de autenticação: token JWT e usuário atual
function getToken() {
  return localStorage.getItem("access_token");
}

function setToken(token) {
  localStorage.setItem("access_token", token);
}

function removeToken() {
  localStorage.removeItem("access_token");
}

function setCurrentUser(user) {
  if (!user) {
    localStorage.removeItem("current_user");
    return;
  }
  localStorage.setItem("current_user", JSON.stringify(user));
}

function getCurrentUser() {
  const bruto = localStorage.getItem("current_user");
  if (!bruto) return null;
  try {
    return JSON.parse(bruto);
  } catch {
    return null;
  }
}

function clearAuth() {
  removeToken();
  localStorage.removeItem("current_user");
}

async function request(path, { method = "GET", body, headers = {}, requiresAuth = false } = {}) {
  const cabecalhosRequisicao = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (requiresAuth) {
    const tokenAcesso = getToken();
    if (tokenAcesso) {
      cabecalhosRequisicao["Authorization"] = `Bearer ${tokenAcesso}`;
    }
  }

  const resposta = await fetch(`${BASE_API}${path}`, {
    method,
    headers: cabecalhosRequisicao,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const dados = await resposta.json().catch(() => ({}));
  
  if (!resposta.ok) {
    if (resposta.status === 401 && requiresAuth) {
      clearAuth();
      window.location.href = "/";
    }
    const mensagem = dados.detail || dados.message || "Erro ao comunicar com o servidor";
    throw new Error(mensagem);
  }
  
  return dados;
}

export const api = {
  login: async (payload) => {
    const dados = await request("/auth/login", { method: "POST", body: payload });
    if (dados.access_token) {
      setToken(dados.access_token);
    }
     if (dados.user) {
       // Papel básico definido exclusivamente pelo backend
       const papel = dados.user.is_profissional ? "profissional" : "usuario";
       setCurrentUser({ ...dados.user, role: papel });
     }
    return dados;
  },
  
  signUp: (payload) => request("/auth/register", { method: "POST", body: payload }),
  
  logout: () => {
    clearAuth();
    window.location.href = "/";
  },
  
  getToken,
  setToken,
  removeToken,
  getCurrentUser,
  setCurrentUser,
};
