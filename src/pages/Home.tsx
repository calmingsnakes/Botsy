import { useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Badge, CHANNEL_LABEL, Empty, ErrorNote, Skeleton, Stat, StatusBadge, ago, fmtMXN, fmtN, useApi, useData, useToast } from "../components/ui";

const greet = () => { const h = new Date().getHours(); return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"; };
const TODAY = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

export function Home() {
  const api = useApi();
  const toast = useToast();
  const { data: me } = useData((a) => a.me());
  const { data: usage, loading: usageLoading, error: usageError, reload: reloadUsage } = useData((a) => a.usage(30));
  const { data: bots, loading: botsLoading } = useData((a) => a.bots());
  const { data: alerts, loading: alertsLoading, error: alertsError, reload: reloadAlerts } = useData((a) => a.alerts());
  const { data: xray, loading: xrayLoading } = useData((a) => a.xray());
  const { data: convs, loading: convsLoading, error: convsError, reload: reloadConvs } = useData((a) => a.conversations({ limit: 6 }));
  const [ackBusy, setAckBusy] = useState<string | null>(null);

  const last7 = usage?.series.slice(-7) ?? [];
  const prev7 = usage?.series.slice(-14, -7) ?? [];
  const sum = (s: { conversations: number }[]) => s.reduce((a, r) => a + r.conversations, 0);
  const delta = prev7.length && sum(prev7) ? Math.round(((sum(last7) - sum(prev7)) / sum(prev7)) * 100) : 0;
  const ratio = usage ? usage.period.used / usage.period.included : 0;
  const active = bots?.filter((b) => b.status === "active") ?? [];
  const resolution = active.length ? active.reduce((a, b) => a + (b.kpi_current ?? 0), 0) / active.length : 0;
  const pending = alerts?.filter((a) => !a.acknowledged_at) ?? [];
  const firstName = me?.user.name.split(" ")[0];

  const ack = async (id: string) => {
    setAckBusy(id);
    try {
      await api.ackAlert(id);
      toast("Marcada como atendida");
      reloadAlerts();
      window.dispatchEvent(new Event("botsy:alerts"));
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo marcar", "err");
    } finally {
      setAckBusy(null);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{greet()}{firstName ? `, ${firstName}` : ""}</h1>
          <p><span className="muted">{TODAY.charAt(0).toUpperCase() + TODAY.slice(1)} · </span>Así van tus bots esta semana. Todo lo que ves aquí también te llega en el reporte de los lunes.</p>
        </div>
        <div className="row">
          <Link className="btn" to="/bots">Ver mis bots</Link>
          <Link className="btn accent" to="/bots/nuevo">+ Nuevo bot</Link>
        </div>
      </div>

      <div className="grid c4">
        <Stat label="Conversaciones · 7 días"
          value={!usage && usageLoading ? <Skeleton h={30} w={90} /> : fmtN(sum(last7))}
          delta={usage ? `${delta >= 0 ? "+" : ""}${delta} % vs. semana pasada` : undefined}
          up={delta >= 0}
          spark={usage?.series.slice(-14).map((d) => d.conversations)} />
        <Stat label="Resueltas sin humano"
          value={!bots && botsLoading ? <Skeleton h={30} w={70} /> : `${Math.round(resolution * 100)} %`}
          delta={bots ? `Meta 60 % · ${resolution >= 0.6 ? "vas arriba" : `faltan ${Math.ceil((0.6 - resolution) * 100)} pts`}` : undefined}
          up={resolution >= 0.6} />
        <Stat label="Preguntas sin respuesta"
          value={!xray && xrayLoading ? <Skeleton h={30} w={40} /> : (xray?.unanswered.length ?? "—")}
          delta={xray ? `${fmtN(xray.unanswered.reduce((a, u) => a + u.occurrences, 0))} clientes las hicieron` : undefined}
          up={false}
          to="/rayos-x" />
        <Stat label="Gasto este mes"
          value={!usage && usageLoading ? <Skeleton h={30} w={80} /> : (usage ? fmtMXN(usage.totals.cost_mxn) : "—")}
          delta="Incluido en tu plan Crecimiento"
          up={null}
          to="/consumo" />
      </div>

      <div className="grid c2">
        <div className="card">
          <div className="row between"><h3>Conversaciones del mes</h3><span className="small muted">{usage ? `${fmtN(usage.period.used)} de ${fmtN(usage.period.included)} incluidas` : ""}</span></div>
          {usageError ? <ErrorNote error={usageError} retry={reloadUsage} /> : usage ? (
            <>
              <div className={`progress ${ratio >= 1 ? "danger" : ratio >= 0.8 ? "warn" : ""}`} style={{ margin: "10px 0" }}><i style={{ width: `${Math.min(100, ratio * 100)}%` }} /></div>
              <p className="small muted">{ratio >= 0.8 ? `Llevas ${Math.round(ratio * 100)} %. Al 100 % el bot pausa, salvo que permitas excedentes (MXN ${usage.period.overage_price_mxn} por conversación). ` : "Vas bien. "}<Link to="/consumo">Ver consumo</Link></p>
              <BarChart data={usage.series.map((d) => ({ day: d.day, value: d.conversations }))} ariaLabel="Conversaciones por día, últimos 30 días" />
            </>
          ) : <Skeleton h={200} />}
        </div>
        <div className="card">
          <h3>Lo que tus clientes te están diciendo</h3>
          <div className="stack">
            {xray ? xray.insights.slice(0, 3).map((t, i) => <p key={i} className="small" style={{ borderLeft: "3px solid var(--rosa)", paddingLeft: 10 }}>{t}</p>)
              : [<Skeleton key={1} h={44} />, <Skeleton key={2} h={44} />, <Skeleton key={3} h={44} />]}
          </div>
          <div className="row between" style={{ marginTop: 14 }}>
            <Link to="/rayos-x" className="btn sm">Abrir Rayos X</Link>
            {xray && xray.unanswered.length > 0 && <Link className="small" to="/rayos-x">{xray.unanswered.length} preguntas sin respuesta →</Link>}
          </div>
        </div>
      </div>

      <div className="grid c2">
        <div className="card">
          <div className="row between"><h3>Necesitan tu atención</h3><Link to="/alertas" className="small">Todas</Link></div>
          {alertsError ? <ErrorNote error={alertsError} retry={reloadAlerts} /> : alertsLoading && !alerts ? (
            <div className="stack">{[0, 1, 2].map((i) => <Skeleton key={i} h={52} />)}</div>
          ) : pending.length === 0 ? (
            <Empty title="Todo al día">No hay alertas que requieran tu atención.</Empty>
          ) : (
            <div className="stack">
              {pending.slice(0, 4).map((a) => (
                <div key={a.id} className="alert-item">
                  <div>
                    <Badge tone={a.severity === "critical" ? "red" : a.severity === "warning" ? "amber" : ""}>{a.severity === "critical" ? "Urgente" : a.severity === "warning" ? "Atención" : "Info"}</Badge>{" "}
                    <b className="small">{a.title}</b>
                    <div className="small muted">{a.body}</div>
                    <div className="small muted">{ago(a.created_at)}</div>
                  </div>
                  <button className="btn sm" disabled={ackBusy === a.id} onClick={() => ack(a.id)} title="Marcar como atendida">
                    {ackBusy === a.id ? "…" : "Atendida"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div className="row between"><h3>Últimas conversaciones</h3><Link to="/conversaciones" className="small">Todas</Link></div>
          {convsError ? <ErrorNote error={convsError} retry={reloadConvs} /> : (
            <table className="tbl"><tbody>
              {convsLoading && !convs ? [0, 1, 2, 3].map((i) => <tr key={i}><td><Skeleton h={30} /></td><td><Skeleton h={20} w={110} /></td><td><Skeleton h={14} w={60} /></td></tr>)
                : convs?.items.map((c) => (
                  <tr key={c.id}>
                    <td><Link to={`/conversaciones/${c.id}`}>{c.topic}</Link><div className="small muted">{bots?.find((b) => b.id === c.bot_id)?.name}</div></td>
                    <td><Badge>{CHANNEL_LABEL[c.channel_type]}</Badge></td>
                    <td><StatusBadge s={c.status} /></td>
                    <td className="small muted">{ago(c.started_at)}</td>
                  </tr>
                ))}
            </tbody></table>
          )}
        </div>
      </div>
    </>
  );
}
