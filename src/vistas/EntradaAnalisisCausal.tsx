import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { IPADE_LOGO_URL } from "../lib/constantes";

export default function EntradaAnalisisCausal() {
  const [grupoId, setGrupoId] = useState("");
  const [nombre, setNombre] = useState("");
  const navigate = useNavigate();

  async function crearEquipoRapido(e: React.FormEvent) {
    e.preventDefault();
    if (!grupoId.trim() || !nombre.trim()) return;

    const { data } = await supabase
      .from("grupos")
      .select("id")
      .eq("id", grupoId.trim())
      .single();

    if (data) {
      navigate(`/equipo/${data.id}?nombre=${encodeURIComponent(nombre.trim())}`);
    } else {
      alert("No se encontro el grupo. Verifique el codigo con su profesor.");
    }
  }

  return (
    <div className="min-h-screen bg-navy-50">
      {/* Header */}
      <header className="bg-navy-700 text-white px-6 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-navy-200 hover:text-white transition-colors"
          >
            &larr; Simuladores
          </button>
          <img src={IPADE_LOGO_URL} alt="IPADE" className="h-8 w-8 object-contain" />
        </div>
      </header>

      <div className="flex items-center justify-center p-6 mt-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img
              src={IPADE_LOGO_URL}
              alt="IPADE Business School"
              className="w-14 h-14 object-contain mx-auto mb-3"
            />
            <h1 className="text-2xl font-bold text-navy-700 font-display">
              Analisis Causal
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              ETF Bank / Proceso de tarjetas de credito
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
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
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
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
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                  placeholder="Ej: Equipo Alfa"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-navy-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm hover:bg-navy-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2"
              >
                Entrar al simulador
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
