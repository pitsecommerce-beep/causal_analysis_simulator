import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { intervenir } from "../_shared/dag.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { equipo_id, nodo, valor, hipotesis } = await req.json();

    if (!equipo_id || !nodo || valor === undefined || !hipotesis) {
      return new Response(
        JSON.stringify({ error: "Faltan campos obligatorios: equipo_id, nodo, valor, hipotesis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verificar créditos
    const { data: equipo, error: eqErr } = await supabase
      .from("equipos")
      .select("id, creditos_restantes, grupo_id")
      .eq("id", equipo_id)
      .single();

    if (eqErr || !equipo) {
      return new Response(
        JSON.stringify({ error: "Equipo no encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (equipo.creditos_restantes < 3) {
      return new Response(
        JSON.stringify({ error: "Créditos insuficientes. Se necesitan 3 créditos para intervenir." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Obtener semilla del grupo
    const { data: grupo } = await supabase
      .from("grupos")
      .select("semilla")
      .eq("id", equipo.grupo_id)
      .single();

    if (!grupo) {
      return new Response(
        JSON.stringify({ error: "Grupo no encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resultado = intervenir(grupo.semilla, nodo, valor);

    // Descontar créditos atómicamente
    const { error: updateErr } = await supabase.rpc("descontar_creditos", {
      p_equipo_id: equipo_id,
      p_costo: 3,
    }).maybeSingle();

    // Fallback si la función RPC no existe
    if (updateErr) {
      await supabase
        .from("equipos")
        .update({ creditos_restantes: equipo.creditos_restantes - 3 })
        .eq("id", equipo_id);
    }

    // Registrar consulta
    await supabase.from("consultas").insert({
      equipo_id,
      tipo: "intervenir",
      hipotesis,
      parametros: { nodo, valor },
      resultado,
      costo: 3,
    });

    return new Response(
      JSON.stringify(resultado),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
