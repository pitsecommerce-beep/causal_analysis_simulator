import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";

export default function App() {
  const [grupoId, setGrupoId] = useState("");
  const [nombre, setNombre] = useState("");
  const navigate = useNavigate();

  async function unirseAGrupo(e: React.FormEvent) {
    e.preventDefault();
    if (!grupoId.trim()) return;

    const { data } = await supabase
      .from("grupos")
      .select("id")
      .eq("id", grupoId.trim())
      .single();

    if (data) {
      navigate(`/equipo/${data.id}`);
    } else {
      alert("No se encontro el grupo. Verifique el codigo con su profesor.");
    }
  }

  async function crearEquipoRapido(e: React.FormEvent) {
    e.preventDefault();
    if (!grupoId.trim() || !nombre.trim()) return;
    navigate(`/equipo/${grupoId.trim()}?nombre=${encodeURIComponent(nombre.trim())}`);
  }

  return (
    <div className="min-h-screen bg-navy-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-navy-700 mb-2">
            Simulador de Analisis Causal
          </h1>
          <p className="text-neutral-600 text-sm">
            IPADE Business School — Direccion de Operaciones
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
          <form onSubmit={crearEquipoRapido} className="space-y-5">
            <div>
              <label
                htmlFor="grupo"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Codigo de grupo
              </label>
              <input
                id="grupo"
                type="text"
                value={grupoId}
                onChange={(e) => setGrupoId(e.target.value)}
                className="w-full rounded border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                placeholder="Pegue el codigo que le dio el profesor"
                required
              />
            </div>
            <div>
              <label
                htmlFor="nombre"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Nombre del equipo
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                placeholder="Ej: Equipo Alfa"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-navy-700 text-white font-medium py-2.5 px-4 rounded text-sm hover:bg-navy-800 transition-colors focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2"
            >
              Entrar al simulador
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-neutral-200 text-center">
            <button
              onClick={() => navigate("/profesor")}
              className="text-sm text-navy-600 hover:text-navy-800 underline"
            >
              Acceso de profesor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
