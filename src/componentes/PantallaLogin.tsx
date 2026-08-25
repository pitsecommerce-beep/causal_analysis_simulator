import { useState } from "react";
import { IPADE_LOGO_URL } from "../lib/constantes";
import { esEmailValido } from "../lib/auth";

interface Props {
  onLogin: (email: string) => void;
  cargando: boolean;
  error: string | null;
}

export default function PantallaLogin({ onLogin, cargando, error }: Props) {
  const [email, setEmail] = useState("");

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    onLogin(email.trim());
  }

  const emailValido = email.trim() === "" || esEmailValido(email);

  return (
    <div className="min-h-screen bg-navy-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src={IPADE_LOGO_URL}
            alt="IPADE Business School"
            className="w-14 h-14 object-contain mx-auto mb-3"
          />
          <h1 className="text-2xl font-bold text-navy-700 font-display">
            Simuladores IPADE
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Inicie sesion con su correo institucional
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={enviar} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Correo institucional
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy-500 ${
                  emailValido
                    ? "border-neutral-300"
                    : "border-red-300 focus:ring-red-500"
                }`}
                placeholder="nombre@alumni.ipade.mx"
                required
              />
              {!emailValido && (
                <p className="text-xs text-red-500 mt-1">
                  Use un correo @alumni.ipade.mx o @ipade.mx
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={cargando || !esEmailValido(email)}
              className="w-full bg-navy-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm hover:bg-navy-800 transition-all duration-200 disabled:opacity-50"
            >
              {cargando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
