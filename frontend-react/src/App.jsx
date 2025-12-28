import { Routes, Route, Navigate } from "react-router-dom";
import { NavBar } from "./components/NavBar.jsx";
import { Home } from "./pages/Home.jsx";
import { Register } from "./pages/Register.jsx";
import { DiagnosticoUBS } from "./pages/DiagnosticoUBS.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { RelatoriosSituacionais } from "./pages/RelatoriosSituacionais.jsx";
import { api } from "./api";

function RequerAutenticacao({ children }) {
  const tokenAcesso = api.getToken();
  if (!tokenAcesso) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <div className="app-shell">
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <RequerAutenticacao>
              <Dashboard />
            </RequerAutenticacao>
          }
        />
        <Route
          path="/relatorios"
          element={
            <RequerAutenticacao>
              <RelatoriosSituacionais />
            </RequerAutenticacao>
          }
        />
        <Route
          path="/diagnostico"
          element={
            <RequerAutenticacao>
              <DiagnosticoUBS />
            </RequerAutenticacao>
          }
        />
      </Routes>
    </div>
  );
}
