import { IPADE_LOGO_URL } from "../lib/constantes";

interface Props {
  email: string;
  onCerrar: () => void;
}

export default function PantallaDenegada({ email, onCerrar }: Props) {
  return (
    <div className="min-h-screen bg-navy-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <img
          src={IPADE_LOGO_URL}
          alt="IPADE Business School"
          className="w-14 h-14 object-contain mx-auto mb-4"
        />

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h2 className="text-lg font-semibold text-navy-700 mb-2">
            Acceso denegado
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            La solicitud para <span className="font-medium text-neutral-700">{email}</span> fue
            denegada. Contacte al administrador si cree que es un error.
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
