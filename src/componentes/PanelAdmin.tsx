import { useState, useEffect } from "react";
import { supabase, SUPABASE_CONFIGURADO } from "../lib/supabase";
import type { Usuario } from "../lib/auth";

interface Props {
  usuario: Usuario;
}

export default function PanelAdmin({ usuario }: Props) {
  const [pendientes, setPendientes] = useState<Usuario[]>([]);
  const [todos, setTodos] = useState<Usuario[]>([]);
  const [tab, setTab] = useState<"pendientes" | "todos">("pendientes");

  async function cargar() {
    if (!SUPABASE_CONFIGURADO) return;

    const { data: pend } = await supabase
      .from("usuarios")
      .select("*")
      .eq("estado", "pendiente")
      .order("creado_en", { ascending: true });
    if (pend) setPendientes(pend as Usuario[]);

    const { data: all } = await supabase
      .from("usuarios")
      .select("*")
      .order("creado_en", { ascending: false });
    if (all) setTodos(all as Usuario[]);
  }

  useEffect(() => {
    cargar();

    if (!SUPABASE_CONFIGURADO) return;
    const canal = supabase
      .channel("admin-usuarios")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "usuarios" },
        () => cargar(),
      )
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, []);

  async function cambiarEstado(id: string, estado: "aprobado" | "denegado") {
    await supabase.from("usuarios").update({ estado }).eq("id", id);
    cargar();
  }

  const esSuper = usuario.rol === "superadmin";
  if (!esSuper) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
      <h2 className="text-sm font-semibold text-navy-700 mb-4">
        Administracion de usuarios
      </h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("pendientes")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
            tab === "pendientes"
              ? "bg-gold-100 text-gold-800"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Pendientes ({pendientes.length})
        </button>
        <button
          onClick={() => setTab("todos")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
            tab === "todos"
              ? "bg-navy-100 text-navy-700"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Todos ({todos.length})
        </button>
      </div>

      {tab === "pendientes" && (
        pendientes.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-4">
            Sin solicitudes pendientes
          </p>
        ) : (
          <div className="space-y-2">
            {pendientes.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 bg-gold-50 border border-gold-100 rounded-xl"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-700">{u.email}</p>
                  <p className="text-xs text-neutral-500">{u.rol}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => cambiarEstado(u.id, "aprobado")}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-all duration-200"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => cambiarEstado(u.id, "denegado")}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-all duration-200"
                  >
                    Denegar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "todos" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <th className="pb-2 font-medium text-neutral-500">Correo</th>
                <th className="pb-2 font-medium text-neutral-500">Rol</th>
                <th className="pb-2 font-medium text-neutral-500">Estado</th>
                <th className="pb-2 font-medium text-neutral-500 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {todos.map((u) => (
                <tr key={u.id} className="border-b border-neutral-100">
                  <td className="py-2 text-neutral-700">{u.email}</td>
                  <td className="py-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      u.rol === "superadmin"
                        ? "bg-navy-100 text-navy-700"
                        : u.rol === "docente"
                          ? "bg-gold-100 text-gold-800"
                          : "bg-neutral-100 text-neutral-600"
                    }`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="py-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      u.estado === "aprobado"
                        ? "bg-green-100 text-green-700"
                        : u.estado === "pendiente"
                          ? "bg-gold-100 text-gold-800"
                          : "bg-red-100 text-red-700"
                    }`}>
                      {u.estado}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    {u.rol !== "superadmin" && u.estado !== "aprobado" && (
                      <button
                        onClick={() => cambiarEstado(u.id, "aprobado")}
                        className="text-xs text-green-600 hover:text-green-800 mr-2"
                      >
                        Aprobar
                      </button>
                    )}
                    {u.rol !== "superadmin" && u.estado !== "denegado" && (
                      <button
                        onClick={() => cambiarEstado(u.id, "denegado")}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Denegar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
