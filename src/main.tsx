import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import EntradaAnalisisCausal from "./vistas/EntradaAnalisisCausal";
import VistaEquipo from "./vistas/VistaEquipo";
import VistaProfesor from "./vistas/VistaProfesor";
import VistaCierre from "./vistas/VistaCierre";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/analisis-causal" element={<EntradaAnalisisCausal />} />
        <Route path="/equipo/:grupoId" element={<VistaEquipo />} />
        <Route path="/profesor" element={<VistaProfesor />} />
        <Route path="/cierre/:equipoId" element={<VistaCierre />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
