import { useState } from "react";
import { Badge, Modal, ago, useApi, useData, useToast } from "../components/ui";

export function Integrations() {
  const api = useApi();
  const toast = useToast();
  const { data: keys, reload } = useData((a) => a.apiKeys());
  const { data: bots } = useData((a) => a.bots());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", bot_id: "", origins: "" });
  const [created, setCreated] = useState<string | null>(null);
  const connectors = [["Tienda en línea (Shopify / WooCommerce / Tiendanube)", "Estatus de pedidos en tiempo real", false], ["Calendario (Google / Outlook)", "Agenda de citas", true], ["CRM (HubSpot / Kommo / Zoho)", "Entrega de leads calificados", false], ["Paquetería (Estafeta / DHL / FedEx)", "Rastreo de envíos", false], ["Facturación (Facturama / Facturapi)", "CFDI desde el bot", false], ["Webhooks", "Recibe cada conversación en tu sistema", true]] as const;
  return (
    <>
      <div className="page-head"><div><h1>Integraciones y API</h1><p>Claves para tus widgets y conectores para que el bot consulte tus sistemas. Cada clave tiene alcance limitado y orígenes permitidos.</p></div><button className="btn primary" onClick={() => setOpen(true)}>Nueva clave</button></div>
      <div className="card" style={{ padding: 0 }}>
        <table className="tbl">
          <thead><tr><th>Nombre</th><th>Bot</th><th>Clave</th><th>Orígenes permitidos</th><th>Último uso</th><th></th></tr></thead>
          <tbody>{keys?.map((k) => <tr key={k.id}><td><b>{k.name}</b></td><td className="small">{bots?.find((b) => b.id === k.bot_id)?.name ?? "—"}</td><td className="mono">{k.key_prefix}…</td><td className="small">{k.allowed_origins.join(", ") || "cualquiera"}</td><td className="small muted">{k.last_used_at ? ago(k.last_used_at) : "nunca"}</td><td><button className="btn sm danger" onClick={async () => { await api.revokeApiKey(k.id); reload(); toast("Clave revocada; el widget dejará de funcionar de inmediato"); }}>Revocar</button></td></tr>)}</tbody>
        </table>
      </div>
      <div className="grid c3">
        {connectors.map(([n, d, on]) => <div key={n} className="card"><div className="row between"><h3 style={{ fontSize: 15 }}>{n}</h3>{on ? <Badge tone="green">Conectado</Badge> : <Badge tone="gray">Disponible</Badge>}</div><p className="small muted">{d}</p><button className="btn sm" style={{ marginTop: 8 }} onClick={() => toast(on ? "Configuración abierta (demo)" : "Los conectores premium cuestan MXN 990/mes cada uno (demo)")}>{on ? "Configurar" : "Conectar"}</button></div>)}
      </div>
      {open && (
        <Modal title="Nueva clave" onClose={() => { setOpen(false); setCreated(null); }}>
          {!created ? (
            <div className="stack">
              <label className="field">Nombre <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Widget de mi sitio" /></label>
              <label className="field">Bot <select className="select" value={form.bot_id} onChange={(e) => setForm({ ...form, bot_id: e.target.value })}><option value="">Elige…</option>{bots?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
              <label className="field">Orígenes permitidos <span className="hint">Dominios donde vivirá el widget, separados por coma.</span><input className="input" value={form.origins} onChange={(e) => setForm({ ...form, origins: e.target.value })} placeholder="https://misitio.mx" /></label>
              <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn primary" disabled={!form.name || !form.bot_id} onClick={async () => { const r = await api.createApiKey({ name: form.name, bot_id: form.bot_id, allowed_origins: form.origins.split(",").map((s) => s.trim()).filter(Boolean) }); setCreated(r.key); reload(); }}>Crear</button></div>
            </div>
          ) : (
            <div className="stack"><p>Copia tu clave ahora. <b>No la volveremos a mostrar.</b></p><pre className="mono" style={{ background: "#f6f5fb", padding: 12, borderRadius: 8 }}>{created}</pre><pre className="mono small" style={{ background: "#f6f5fb", padding: 12, borderRadius: 8, overflow: "auto" }}>{`<script src="https://cdn.brand.mx/widget.js" data-bot="${form.bot_id}" data-key="${created}"></script>`}</pre></div>
          )}
        </Modal>
      )}
    </>
  );
}
