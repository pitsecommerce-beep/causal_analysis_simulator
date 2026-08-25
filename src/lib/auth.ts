import { supabase, SUPABASE_CONFIGURADO } from "./supabase";

export type Rol = "participante" | "docente" | "superadmin";
export type EstadoUsuario = "pendiente" | "aprobado" | "denegado";

export interface Usuario {
  id: string;
  email: string;
  rol: Rol;
  estado: EstadoUsuario;
  creado_en: string;
}

const SUPERADMIN_EMAIL = "ftallabs@ipade.mx";
const STORAGE_KEY = "ipade_sesion_email";

export function determinarRol(email: string): Rol {
  const lower = email.toLowerCase().trim();
  if (lower === SUPERADMIN_EMAIL) return "superadmin";
  if (lower.endsWith("@ipade.mx")) return "docente";
  if (lower.endsWith("@alumni.ipade.mx")) return "participante";
  return "participante";
}

export function esEmailValido(email: string): boolean {
  const lower = email.toLowerCase().trim();
  return lower.endsWith("@ipade.mx") || lower.endsWith("@alumni.ipade.mx");
}

export function estadoInicial(rol: Rol): EstadoUsuario {
  if (rol === "participante" || rol === "superadmin") return "aprobado";
  return "pendiente";
}

export async function iniciarSesion(email: string): Promise<Usuario> {
  const lower = email.toLowerCase().trim();
  const rol = determinarRol(lower);
  const estado = estadoInicial(rol);

  if (!SUPABASE_CONFIGURADO) {
    const local: Usuario = {
      id: crypto.randomUUID(),
      email: lower,
      rol,
      estado,
      creado_en: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, lower);
    return local;
  }

  const { data: existente } = await supabase
    .from("usuarios")
    .select("*")
    .eq("email", lower)
    .maybeSingle();

  if (existente) {
    localStorage.setItem(STORAGE_KEY, lower);
    return existente as Usuario;
  }

  const { data, error } = await supabase
    .from("usuarios")
    .insert({ email: lower, rol, estado })
    .select()
    .single();

  if (error) throw new Error("No se pudo registrar: " + error.message);
  localStorage.setItem(STORAGE_KEY, lower);
  return data as Usuario;
}

export async function obtenerSesion(): Promise<Usuario | null> {
  const email = localStorage.getItem(STORAGE_KEY);
  if (!email) return null;

  if (!SUPABASE_CONFIGURADO) {
    const rol = determinarRol(email);
    return {
      id: crypto.randomUUID(),
      email,
      rol,
      estado: estadoInicial(rol),
      creado_en: new Date().toISOString(),
    };
  }

  const { data } = await supabase
    .from("usuarios")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (!data) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
  return data as Usuario;
}

export function cerrarSesion() {
  localStorage.removeItem(STORAGE_KEY);
}
