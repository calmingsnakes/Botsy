import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../../components/ui";
import { BRAND } from "../../brand";

export function CreateOrg({ onCreated }: { onCreated: () => void }) {
  const api = useApi();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try { await api.createOrg(name.trim()); onCreated(); nav("/", { replace: true }); }
    catch (x) { setErr((x as Error).message); setBusy(false); }
  };
  return (
    <div className="auth">
      <form className="card stack auth-card" onSubmit={submit}>
        <div className="brand"><span className="mark" aria-hidden />{BRAND}</div>
        <h1>Tu negocio</h1>
        <p className="muted">Así llamaremos a tu espacio. Puedes cambiarlo después en Cuenta.</p>
        <input className="input" required autoFocus placeholder="Panadería La Espiga" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nombre del negocio" />
        {err && <p className="small" style={{ color: "var(--red)" }}>{err}</p>}
        <button className="btn primary" disabled={busy || name.trim().length < 2}>{busy ? "Creando…" : "Crear"}</button>
      </form>
    </div>
  );
}
