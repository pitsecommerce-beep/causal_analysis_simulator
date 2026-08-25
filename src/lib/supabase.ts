import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const SUPABASE_CONFIGURADO = Boolean(supabaseUrl && supabaseAnonKey);

if (!SUPABASE_CONFIGURADO) {
  console.warn(
    "[Simulador] Supabase no configurado. Defina VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env para habilitar la conexion a datos.",
  );
}

export const supabase: SupabaseClient = SUPABASE_CONFIGURADO
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient("https://placeholder.supabase.co", "placeholder");

export { SUPABASE_CONFIGURADO };

export async function invocarFuncion<T>(
  nombre: string,
  body: Record<string, unknown>,
): Promise<T> {
  if (!SUPABASE_CONFIGURADO) {
    throw new Error(
      "Supabase no configurado. Defina VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.",
    );
  }
  const { data, error } = await supabase.functions.invoke(nombre, {
    body,
  });
  if (error) throw error;
  return data as T;
}
