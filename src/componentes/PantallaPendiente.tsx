import { useEffect } from "react";
import { IPADE_LOGO_URL } from "../lib/constantes";
import { supabase, SUPABASE_CONFIGURADO } from "../lib/supabase";
import type { Usuario } from "../lib/auth";

interface Props {
  usuario: Usuario;
  onCambio: (usuario: Usuario) => void;
  onCerrar: () => void;
}

export default function PantallaPendiente({ usuario, onCambio, onCerrar }: Props) {
  useEffect(() => {
    if (!SUPABASE_CONFIGURADO) return;

    const canal = supabase
      .channel(`usuario-${usuario.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "usuarios",
          filter: `id=eq.${usuario.id}`,
        },
        (payload) => {
          onCambio(payload.new as Usuario);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [usuario.id, onCambio]);

  return (
    <div className="min-h-screen bg-navy-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <img
          src={IPADE_LOGO_URL}
          alt="IPADE Business School"
          className="w-14 h-14 object-contain mx-auto mb-4"
        />

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
          <div className="w-12 h-12 rounded-full bg-gold-100 text-gold-800 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="text-lg font-semibold text-navy-700 mb-2">
            Solicitud en revision
          </h2>
          <p className="text-sm text-neutral-500 mb-4">
            Su cuenta <span className="font-medium text-neutral-700">{usuario.email}</span> esta
            pendiente de aprobacion por un administrador.
          </p>
          <p className="text-xs text-neutral-400 mb-6">
            Esta pagina se actualizara automaticamente cuando su solicitud sea procesada.
          </p>

          <button
            onClick={onCerrar}
            className="text-sm text-navy-600 hover:text-navy-800 underline"
          >
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  );
}
