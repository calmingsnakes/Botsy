import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type * as T from "../lib/types";
import { Badge, useApi, useData, useToast } from "../components/ui";

/**
 * Asistente de creación de bot por cuestionario.
 *
 * Cinco pasos: elegir plantilla, contestar, subir documentos, revisar en prosa y crear.
 * No publica: deja el bot en borrador para que el cliente revise y publique cuando quiera.
 * Las reglas duras de la plantilla se muestran con candado y su explicación; sólo se pueden
 * agregar, nunca quitar — el Worker lo vuelve a aplicar aunque alguien manipule la petición.
 */

const NIVEL: Record<T.NivelGuardrails, { texto: string; tono: "green" | "amber" | "red" }> = {
  basico: { texto: "Guardrails básicos", tono: "green" },
  intermedio: { texto: "Guardrails intermedios", tono: "amber" },
  avanzado: { texto: "Guardrails avanzados", tono: "red" },
};

const TIPO_REGLA: Record<T.TipoRegla, string> = {
  legal: "Lo exige la ley",
  compromiso: "Te cuesta dinero",
  seguridad: "Protege datos",
  operativa: "Evita un error caro",
};

const CANAL_TXT: Record<string, string> = { web: "Web", whatsapp: "WhatsApp", email: "Correo", web_interna: "Web interna" };

type Paso = 1 | 2 | 3 | 4;

export function NuevoBot() {
  const api = useApi();
  const toast = useToast();
  const nav = useNavigate();
  const { data: cat } = useData((a) => a.templates());
  const { data: me } = useData((a) => a.me());
  const [elegida, setElegida] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<T.PlantillaDetalle | null>(null);
  const [paso, setPaso] = useState<Paso>(1);
  const [r, setR] = useState<T.RespuestasCuestionario>({});
  const [reglaNueva, setReglaNueva] = useState("");
  const [docs, setDocs] = useState<{ titulo: string; texto: string }[]>([]);
  const [docTitulo, setDocTitulo] = useState("");
  const [docTexto, setDocTexto] = useState("");
  const [creando, setCreando] = useState(false);

  async function elegir(id: string) {
    setElegida(id);
    try {
      const d = await api.template(id);
      setDetalle(d);
      setR({ empresa: me?.org.name ?? "", agente: d.dm.identity.name, objetivo: d.dm.objective, registro: d.dm.tone.register, correo_escalamiento: d.dm.escalation.summary_to, horario: d.dm.escalation.hours, aviso_privacidad: d.dm.data_policy.privacy_notice_url, kpi: d.dm.kpi, reglas_adicionales: [] });
      setPaso(2);
    } catch (e) { toast((e as Error).message); }
  }

  async function crear() {
    if (!detalle) return;
    setCreando(true);
    try {
      const { bot } = await api.createBotFromTemplate(detalle.id, r);
      for (const d of docs) await api.addSource(bot.id, { kind: "texto", title: d.titulo, text: d.texto });
      toast("Tu bot quedó en borrador. Revísalo y publícalo cuando quieras.");
      nav(`/bots/${bot.id}`);
    } catch (e) { toast((e as Error).message); setCreando(false); }
  }

  const set = (p: Partial<T.RespuestasCuestionario>) => setR((x) => ({ ...x, ...p }));
  const limiteFuentes = cat?.limites.fuentes_por_bot ?? 50;

  // ---------------------------------------------------------------- paso 1: elegir plantilla
  if (paso === 1 || !detalle) {
    return (
      <>
        <div className="page-head">
          <div><h1>Nuevo bot</h1><p>Elige de qué se va a encargar. Cada plantilla llega con su forma de hablar, sus reglas y su manera de escalar ya resueltas: tú sólo confirmas y subes tus documentos.</p></div>
        </div>
        <div className="grid c3">
          {cat?.plantillas.map((p) => (
            <button key={p.id} className="card plantilla" onClick={() => elegir(p.id)} disabled={elegida === p.id}>
              <div className="row between">
                <Badge>{p.svc}</Badge>
                <Badge tone={NIVEL[p.guardrails].tono}>{NIVEL[p.guardrails].texto}</Badge>
              </div>
              <h3 style={{ marginTop: 10 }}>{p.agente}</h3>
              <div className="small" style={{ fontWeight: 600 }}>{p.titulo}</div>
              <p className="small muted" style={{ marginTop: 6 }}>{p.para_quien}</p>
              <div className="small muted" style={{ marginTop: 8 }}>{p.canales.map((c) => CANAL_TXT[c] ?? c).join(" · ")}</div>
            </button>
          ))}
        </div>
        {!cat && <p className="muted">Cargando plantillas…</p>}
      </>
    );
  }

  const nombreAgente = r.agente || `${detalle.agente.nombre} ${detalle.agente.apellido}`;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{detalle.titulo}</h1>
          <p>{nombreAgente} · {detalle.svc} · {NIVEL[detalle.guardrails].texto}</p>
        </div>
        <button className="btn" onClick={() => { setPaso(1); setDetalle(null); setElegida(null); }}>Cambiar plantilla</button>
      </div>

      <ol className="pasos">
        {["Elegir", "Contestar", "Documentos", "Revisar"].map((t, i) => (
          <li key={t} className={i + 1 === paso ? "activo" : i + 1 < paso ? "hecho" : ""}>{i + 1}. {t}</li>
        ))}
      </ol>

      {/* ------------------------------------------------------------ paso 2: cuestionario */}
      {paso === 2 && (
        <div className="grid split-2">
          <div className="stack">
            <div className="card stack">
              <h3>Lo básico</h3>
              <label className="campo">¿Cómo se llama tu negocio?
                <input className="input" value={r.empresa ?? ""} onChange={(e) => set({ empresa: e.target.value })} placeholder="Escribe el nombre de tu negocio" />
              </label>
              <label className="campo">¿Cómo quieres que se llame tu asistente?
                <span className="pista">Sugerimos {detalle.agente.nombre} {detalle.agente.apellido}. Ponle el nombre que quieras.</span>
                <input className="input" value={r.agente ?? ""} onChange={(e) => set({ agente: e.target.value })} />
              </label>
              <label className="campo">¿De qué se encarga?
                <span className="pista">Ya lo redactamos. Cámbialo si tu caso es distinto.</span>
                <textarea className="input" rows={3} value={r.objetivo ?? ""} onChange={(e) => set({ objetivo: e.target.value })} />
              </label>
              <label className="campo">¿Habla de tú o de usted?
                <select className="select" value={r.registro ?? "tú"} onChange={(e) => set({ registro: e.target.value as "tú" | "usted" })}>
                  <option value="tú">De tú — cercano</option>
                  <option value="usted">De usted — formal</option>
                </select>
              </label>
            </div>

            <div className="card stack">
              <h3>Cuándo pasa a una persona</h3>
              <label className="campo">¿A qué correo llegan esos avisos?
                <input className="input" type="email" value={r.correo_escalamiento ?? ""} onChange={(e) => set({ correo_escalamiento: e.target.value })} placeholder="avisos@tunegocio.mx" />
              </label>
              <label className="campo">¿Cuál es tu horario de atención?
                <input className="input" value={r.horario ?? ""} onChange={(e) => set({ horario: e.target.value })} placeholder="Lunes a viernes 9:00–18:00" />
              </label>
              <div className="campo">Tu bot escala en estos casos
                <ul className="lista-check">{(detalle.dm.escalation.triggers).map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
            </div>

            <div className="card stack">
              <h3>Datos y medición</h3>
              <label className="campo">¿Dónde está tu aviso de privacidad?
                <span className="pista">Tu bot lo enlaza en su primer mensaje, como exige la ley.</span>
                <input className="input" value={r.aviso_privacidad ?? ""} onChange={(e) => set({ aviso_privacidad: e.target.value })} placeholder="https://tunegocio.mx/privacidad" />
              </label>
              <label className="campo">¿Qué quieres medir?
                <div className="row">
                  <input className="input" value={r.kpi?.name ?? ""} onChange={(e) => set({ kpi: { name: e.target.value, target: r.kpi?.target ?? 0.6 } })} />
                  <input className="input" style={{ maxWidth: 110 }} type="number" min={1} max={100} value={Math.round((r.kpi?.target ?? 0.6) * 100)} onChange={(e) => set({ kpi: { name: r.kpi?.name ?? "", target: Number(e.target.value) / 100 } })} />
                  <span className="small muted" style={{ alignSelf: "center" }}>% meta</span>
                </div>
              </label>
            </div>
          </div>

          {/* reglas duras: candado + por qué */}
          <div className="stack">
            <div className="card stack">
              <div className="row between"><h3>Reglas que tu bot nunca romperá</h3><Badge tone="gray">{detalle.reglas_explicadas.length} fijas</Badge></div>
              <p className="small muted">{detalle.aviso_reglas}</p>
              {detalle.reglas_explicadas.map((x) => (
                <details key={x.regla} className="regla">
                  <summary>
                    <span className="candado" aria-label="Regla fija">🔒</span>
                    <span>{x.regla}</span>
                  </summary>
                  <div className="porque">
                    <Badge tone={x.tipo === "legal" ? "red" : x.tipo === "seguridad" ? "amber" : "gray"}>{TIPO_REGLA[x.tipo]}</Badge>
                    <p className="small" style={{ marginTop: 6 }}>{x.porque}</p>
                  </div>
                </details>
              ))}
              <label className="campo">Agrega las tuyas
                <div className="row">
                  <input className="input" value={reglaNueva} onChange={(e) => setReglaNueva(e.target.value)} placeholder="Ej. Nunca hables de la competencia." />
                  <button className="btn" disabled={reglaNueva.trim().length < 8} onClick={() => { set({ reglas_adicionales: [...(r.reglas_adicionales ?? []), reglaNueva.trim()] }); setReglaNueva(""); }}>Agregar</button>
                </div>
              </label>
              {(r.reglas_adicionales ?? []).map((x, i) => (
                <div key={x} className="row between regla-propia">
                  <span className="small">{x}</span>
                  <button className="btn sm" onClick={() => set({ reglas_adicionales: (r.reglas_adicionales ?? []).filter((_, j) => j !== i) })}>Quitar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ paso 3: documentos */}
      {paso === 3 && (
        <div className="grid split-2">
          <div className="card stack">
            <h3>Tus documentos</h3>
            <p className="small muted">Esto es lo único que sólo tú tienes. Sube o pega lo que tu bot debe saber: políticas, precios de lista, preguntas frecuentes, manuales. Entre más curado, mejor contesta — no subas todo, sube lo que de verdad responde preguntas.</p>
            <label className="campo">Título
              <input className="input" value={docTitulo} onChange={(e) => setDocTitulo(e.target.value)} placeholder="Política de devoluciones" />
            </label>
            <label className="campo">Contenido
              <textarea className="input" rows={8} value={docTexto} onChange={(e) => setDocTexto(e.target.value)} placeholder="Pega aquí el texto…" />
            </label>
            <div className="row between">
              <span className="small muted">{docs.length} de {limiteFuentes} fuentes</span>
              <button className="btn primary" disabled={!docTitulo.trim() || docTexto.trim().length < 40 || docs.length >= limiteFuentes} onClick={() => { setDocs([...docs, { titulo: docTitulo.trim(), texto: docTexto.trim() }]); setDocTitulo(""); setDocTexto(""); }}>Agregar documento</button>
            </div>
          </div>
          <div className="card stack">
            <h3>Agregados</h3>
            {docs.length === 0 && <p className="small muted">Puedes crear el bot sin documentos y agregarlos después, pero sin ellos sólo sabrá lo que dice su Documento Maestro.</p>}
            {docs.map((d, i) => (
              <div key={d.titulo} className="row between regla-propia">
                <span className="small"><b>{d.titulo}</b> · {Math.round(d.texto.length / 1000)} mil caracteres</span>
                <button className="btn sm" onClick={() => setDocs(docs.filter((_, j) => j !== i))}>Quitar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ paso 4: revisión en prosa */}
      {paso === 4 && (
        <div className="card stack resumen">
          <h3>Así quedó</h3>
          <p>
            <b>{nombreAgente}</b> atiende a {r.empresa ? <b>{r.empresa}</b> : "tu negocio"} por {detalle.canales.map((c) => CANAL_TXT[c] ?? c).join(" y ")}.
            {" "}Habla de <b>{r.registro ?? "tú"}</b> y se encarga de: {r.objetivo}
          </p>
          <p>
            Pasa la conversación a una persona cuando {detalle.dm.escalation.triggers.slice(0, 3).join(", ")} u otros {Math.max(0, detalle.dm.escalation.triggers.length - 3)} casos,
            y avisa a <b>{r.correo_escalamiento || "—"}</b> en horario de {r.horario || "—"}.
          </p>
          <p>
            Nunca romperá <b>{detalle.reglas_explicadas.length} reglas fijas</b>
            {(r.reglas_adicionales?.length ?? 0) > 0 && <> más las <b>{r.reglas_adicionales!.length}</b> que agregaste</>}.
            Siempre dice que es una IA y enlaza tu aviso de privacidad.
          </p>
          <p>
            Sabrá lo que digan <b>{docs.length} documento{docs.length === 1 ? "" : "s"}</b> que subiste, y mediremos <b>{r.kpi?.name}</b> con meta de <b>{Math.round((r.kpi?.target ?? 0) * 100)} %</b>.
          </p>
          <div className="aviso-borrador">
            <b>Queda en borrador.</b> No atiende a nadie hasta que tú lo publiques. Después de crearlo puedes probarlo en el simulador, cambiarlo con tus palabras o abrir la edición avanzada.
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ navegación */}
      <div className="row" style={{ justifyContent: "space-between", marginTop: 16 }}>
        <button className="btn" onClick={() => setPaso((p) => (p > 2 ? ((p - 1) as Paso) : 1))}>Atrás</button>
        {paso < 4 ? (
          <button className="btn primary" disabled={paso === 2 && !(r.empresa?.trim() && r.agente?.trim() && r.correo_escalamiento?.includes("@"))} onClick={() => setPaso((p) => (p + 1) as Paso)}>
            Continuar
          </button>
        ) : (
          <button className="btn primary" disabled={creando} onClick={crear}>{creando ? "Creando…" : "Crear bot en borrador"}</button>
        )}
      </div>
      {paso === 2 && !(r.empresa?.trim() && r.agente?.trim() && r.correo_escalamiento?.includes("@")) && (
        <p className="small muted" style={{ textAlign: "right" }}>Falta el nombre de tu negocio, el del asistente y un correo de avisos.</p>
      )}
    </>
  );
}
