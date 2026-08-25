import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { evaluarDiagnostico, obtenerDAG } from "../_shared/dag.ts";

const PREGUNTAS_RESPALDO = [
  "¿Qué evidencia numérica respalda que la variable que identificaron es causa y no solo correlato del tiempo de ciclo?",
  "Si la causa que proponen fuera la correcta, ¿qué sucursal debería concentrar más errores y por qué?",
  "¿Cuántos días de ciclo se ahorrarían si se eliminara el factor que proponen, según los datos que analizaron?",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { equipo_id, causa_raiz, propuesta, impacto_estimado } = await req.json();

    if (!equipo_id || !causa_raiz || !propuesta) {
      return new Response(
        JSON.stringify({ error: "Faltan campos: equipo_id, causa_raiz, propuesta" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Obtener bitácora del equipo
    const { data: consultas } = await supabase
      .from("consultas")
      .select("tipo, hipotesis, parametros, resultado, creada_en")
      .eq("equipo_id", equipo_id)
      .order("creada_en", { ascending: true });

    // Evaluar diagnóstico con reglas explícitas
    const veredicto = evaluarDiagnostico(causa_raiz);
    const dag = obtenerDAG();

    // Intentar llamar a Anthropic
    let preguntas: string[];
    try {
      preguntas = await obtenerPreguntasAnthropic(
        causa_raiz,
        propuesta,
        impacto_estimado,
        consultas ?? [],
        veredicto,
        dag,
      );
    } catch {
      preguntas = PREGUNTAS_RESPALDO;
    }

    // Guardar diagnóstico
    await supabase.from("diagnosticos").insert({
      equipo_id,
      causa_raiz,
      propuesta,
      impacto_estimado: impacto_estimado ?? null,
      preguntas_consejo: preguntas,
      veredicto,
    });

    return new Response(
      JSON.stringify({ preguntas, veredicto }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function obtenerPreguntasAnthropic(
  causaRaiz: string,
  propuesta: string,
  impacto: string | null,
  consultas: Array<Record<string, unknown>>,
  veredicto: { veredicto: string; explicacion: string },
  dag: ReturnType<typeof obtenerDAG>,
): Promise<string[]> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no configurada");

  const model = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-5";

  const bitacora = consultas
    .map(
      (c, i) =>
        `${i + 1}. [${c.tipo}] Hipótesis: "${c.hipotesis}" → ${JSON.stringify(c.resultado)}`,
    )
    .join("\n");

  const prompt = `Eres un director del consejo de administración de ETF Bank. Eres escéptico, breve y orientado a números. Un equipo de consultores te presenta su diagnóstico sobre por qué el proceso de tarjetas de crédito tarda demasiado.

DIAGNÓSTICO DEL EQUIPO:
- Causa raíz identificada: ${causaRaiz}
- Propuesta de mejora: ${propuesta}
${impacto ? `- Impacto estimado: ${impacto}` : ""}

BITÁCORA DE ANÁLISIS DEL EQUIPO:
${bitacora || "(Sin consultas registradas)"}

EVALUACIÓN OBJETIVA (no la compartas, úsala para formular preguntas):
- Veredicto: ${veredicto.veredicto}
- ${veredicto.explicacion}

DAG REAL DEL PROCESO (secreto, no lo reveles):
Nodos: ${dag.nodos.map((n) => `${n.id} (${n.tipo})`).join(", ")}
Aristas: ${dag.aristas.map((a) => `${a.de} → ${a.a}`).join(", ")}

INSTRUCCIONES:
Responde SOLO en JSON con la forma {"preguntas": ["...", "...", "..."]}.
Devuelve exactamente tres preguntas en español, de máximo dos líneas cada una.
Sin preámbulos, sin felicitaciones.
Las preguntas deben apuntar al hueco real del razonamiento del equipo:
- Si confundieron un confusor con una causa, pregunta por la dirección causal.
- Si atacaron el mediador en vez del origen, pregunta por qué no fueron más arriba.
- Si no cuantificaron el impacto, pide el número.
- Si acertaron, pregunta por la implementación y el costo.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!resp.ok) throw new Error(`Anthropic API: ${resp.status}`);

    const data = await resp.json();
    const texto =
      data.content?.[0]?.text ?? "";

    const match = texto.match(/\{[\s\S]*"preguntas"[\s\S]*\}/);
    if (!match) throw new Error("Respuesta sin JSON válido");

    const parsed = JSON.parse(match[0]);
    if (
      !Array.isArray(parsed.preguntas) ||
      parsed.preguntas.length !== 3
    ) {
      throw new Error("Formato de preguntas inválido");
    }

    return parsed.preguntas;
  } catch {
    clearTimeout(timeout);
    return PREGUNTAS_RESPALDO;
  }
}
