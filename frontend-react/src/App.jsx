import { Routes, Route } from "react-router-dom";
import { NavBar } from "./components/NavBar.jsx";
import { Home } from "./pages/Home.jsx";
import { Register } from "./pages/Register.jsx";
import { DiagnosticoUBS } from "./pages/DiagnosticoUBS.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/diagnostico" element={<DiagnosticoUBS />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  );
}
