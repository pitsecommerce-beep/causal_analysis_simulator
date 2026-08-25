import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { evaluarDiagnostico, obtenerDAG } from "../_shared/dag.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { equipo_id, causa_raiz } = await req.json();

    if (!equipo_id || !causa_raiz) {
      return new Response(
        JSON.stringify({ error: "Faltan campos: equipo_id, causa_raiz" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verificar si el DAG está revelado
    const { data: equipo } = await supabase
      .from("equipos")
      .select("grupo_id")
      .eq("id", equipo_id)
      .single();

    if (!equipo) {
      return new Response(
        JSON.stringify({ error: "Equipo no encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: grupo } = await supabase
      .from("grupos")
      .select("dag_revelado")
      .eq("id", equipo.grupo_id)
      .single();

    const resultado = evaluarDiagnostico(causa_raiz);

    const respuesta: Record<string, unknown> = { ...resultado };

    if (grupo?.dag_revelado) {
      respuesta.dag = obtenerDAG();
    }

    return new Response(
      JSON.stringify(respuesta),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
