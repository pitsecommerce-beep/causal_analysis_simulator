import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { generarMuestra } from "../_shared/dag.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { nombre, semilla, clave_profesor } = await req.json();

    const claveCorrecta = Deno.env.get("CLAVE_PROFESOR");
    if (!claveCorrecta || clave_profesor !== claveCorrecta) {
      return new Response(
        JSON.stringify({ error: "Clave de profesor incorrecta" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!nombre || semilla === undefined) {
      return new Response(
        JSON.stringify({ error: "Faltan campos: nombre y semilla son obligatorios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: grupo, error: grupoError } = await supabase
      .from("grupos")
      .insert({ nombre, semilla: Number(semilla), fase_actual: 0 })
      .select("id")
      .single();

    if (grupoError) throw grupoError;

    const casos = generarMuestra(Number(semilla));
    const filas = casos.map((c) => ({
      grupo_id: grupo.id,
      ...c,
    }));

    const { error: casosError } = await supabase.from("casos").insert(filas);
    if (casosError) throw casosError;

    return new Response(
      JSON.stringify({ grupo_id: grupo.id, total_casos: casos.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
