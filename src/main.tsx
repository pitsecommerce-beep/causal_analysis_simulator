import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import App from "./App";
import EntradaAnalisisCausal from "./vistas/EntradaAnalisisCausal";
import VistaEquipo from "./vistas/VistaEquipo";
import VistaProfesor from "./vistas/VistaProfesor";
import VistaCierre from "./vistas/VistaCierre";
import PantallaLogin from "./componentes/PantallaLogin";
import PantallaPendiente from "./componentes/PantallaPendiente";
import PantallaDenegada from "./componentes/PantallaDenegada";
import {
  iniciarSesion,
  obtenerSesion,
  cerrarSesion,
  type Usuario,
} from "./lib/auth";

import "@fontsource-variable/source-serif-4";
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";

import "./index.css";

const isDev = import.meta.env.DEV;
const VistaTipografia = isDev
  ? React.lazy(() => import("./vistas/VistaTipografia"))
  : null;

function Root() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginCargando, setLoginCargando] = useState(false);

  useEffect(() => {
    obtenerSesion()
      .then((u) => setUsuario(u))
      .finally(() => setCargando(false));
  }, []);

  async function handleLogin(email: string) {
    setLoginCargando(true);
    setLoginError(null);
    try {
      const u = await iniciarSesion(email);
      setUsuario(u);
    } catch (err) {
      setLoginError((err as Error).message);
    } finally {
      setLoginCargando(false);
    }
  }

  function handleCerrar() {
    cerrarSesion();
    setUsuario(null);
  }

  const handleCambioUsuario = useCallback((u: Usuario) => {
    setUsuario(u);
  }, []);

  if (cargando) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center">
        <p className="text-neutral-500">Cargando...</p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <PantallaLogin
        onLogin={handleLogin}
        cargando={loginCargando}
        error={loginError}
      />
    );
  }

  if (usuario.estado === "pendiente") {
    return (
      <PantallaPendiente
        usuario={usuario}
        onCambio={handleCambioUsuario}
        onCerrar={handleCerrar}
      />
    );
  }

  if (usuario.estado === "denegado") {
    return (
      <PantallaDenegada email={usuario.email} onCerrar={handleCerrar} />
    );
  }

  const esDocente = usuario.rol === "docente" || usuario.rol === "superadmin";

  return (
    <BrowserRouter>
      <AnimatedRoutes
        usuario={usuario}
        esDocente={esDocente}
        onCerrar={handleCerrar}
      />
    </BrowserRouter>
  );
}

function AnimatedRoutes({
  usuario,
  esDocente,
  onCerrar,
}: {
  usuario: Usuario;
  esDocente: boolean;
  onCerrar: () => void;
}) {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-transition">
      <Routes location={location}>
        <Route path="/" element={<App usuario={usuario} onCerrar={onCerrar} />} />
        <Route path="/analisis-causal" element={<EntradaAnalisisCausal />} />
        <Route path="/equipo/:grupoId" element={<VistaEquipo />} />
        {esDocente && (
          <Route
            path="/profesor"
            element={<VistaProfesor usuario={usuario} onCerrar={onCerrar} />}
          />
        )}
        <Route path="/cierre/:equipoId" element={<VistaCierre />} />
        {isDev && VistaTipografia && (
          <Route
            path="/tipografia"
            element={
              <React.Suspense fallback={<div className="p-8">Cargando...</div>}>
                <VistaTipografia />
              </React.Suspense>
            }
          />
        )}
      </Routes>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
