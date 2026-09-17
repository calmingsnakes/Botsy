import type { PlanTier } from "../lib/types";
import { Badge, StatusBadge, fmtDay, fmtMXN, useApi, useData, useToast } from "../components/ui";

const PLANS: { id: PlanTier; name: string; price: number; conv: string; bullets: string[] }[] = [
  { id: "inicio", name: "Inicio", price: 1490, conv: "600 conversaciones", bullets: ["1 servicio", "1 canal", "3 usuarios", "Rayos X básico"] },
  { id: "crecimiento", name: "Crecimiento", price: 6990, conv: "3 000 conversaciones", bullets: ["Hasta 3 servicios", "3 canales", "10 usuarios", "Reporte semanal + Agente de Cambios ilimitado"] },
  { id: "equipo", name: "Equipo", price: 9990, conv: "100 empleados", bullets: ["2 servicios de entrenamiento", "Evidencia exportable", "10 usuarios"] },
  { id: "corporativo", name: "Corporativo", price: 24990, conv: "15 000 conversaciones", bullets: ["SSO, DPA, retención a medida", "Gerente de cuenta", "SLA 99.5 %"] },
];

export function Billing() {
  const api = useApi();
  const toast = useToast();
  const { data: me } = useData((a) => a.me());
  const { data: invoices } = useData((a) => a.invoices());
  async function go(fn: () => Promise<{ url: string }>) { const { url } = await fn(); if (url.startsWith("#")) toast("En la versión conectada esto abre Stripe (tarjeta, SPEI u OXXO)."); else location.href = url; }
  return (
    <>
      <div className="page-head"><div><h1>Facturación</h1><p>Suscripción, método de pago y facturas CFDI. Cancela cuando quieras desde aquí; tus datos quedan exportables 30 días.</p></div>
        <div className="row"><button className="btn" onClick={() => go(() => api.portal())}>Método de pago y cancelación</button></div></div>
      <div className="grid c4">
        {PLANS.map((p) => {
          const current = me?.org.plan === p.id;
          return (
            <div key={p.id} className="card" style={current ? { borderColor: "var(--ink)" } : {}}>
              <div className="row between"><h3>{p.name}</h3>{current && <Badge>Tu plan</Badge>}</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 26, fontWeight: 800 }}>{fmtMXN(p.price)}<span className="small muted" style={{ fontWeight: 400 }}> /mes + IVA</span></div>
              <div className="small muted">{p.conv} incluidas</div>
              <ul className="small" style={{ paddingLeft: 18, margin: "10px 0" }}>{p.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
              {!current && <button className="btn sm primary" onClick={() => go(() => api.checkout(p.id))}>{PLANS.findIndex((x) => x.id === me?.org.plan) < PLANS.findIndex((x) => x.id === p.id) ? "Subir a este plan" : "Cambiar a este plan"}</button>}
            </div>
          );
        })}
      </div>
      <div className="card">
        <div className="row between"><h3>Facturas</h3><span className="small muted">RFC: {me?.org.rfc} · {me?.org.billing_email} · <a href="#/cuenta">editar datos fiscales</a></span></div>
        <table className="tbl">
          <thead><tr><th>Periodo</th><th>Monto (con IVA)</th><th>Estado</th><th>CFDI</th><th></th></tr></thead>
          <tbody>{invoices?.map((i) => <tr key={i.id}><td>{fmtDay(i.period_start)} – {fmtDay(i.period_end)}</td><td>{fmtMXN(i.amount_mxn)}</td><td><StatusBadge s={i.status} /></td><td className="mono small">{i.cfdi_uuid ?? "—"}</td><td><a className="btn sm" href={i.pdf_url ?? "#"}>PDF</a> <a className="btn sm" href="#">XML</a></td></tr>)}</tbody>
        </table>
      </div>
      <p className="small muted">Garantía: si en los primeros 30 días el servicio no te sirve, te devolvemos el 100 %. Precios en MXN sin IVA; cambios de precio con 30 días de aviso.</p>
    </>
  );
}
