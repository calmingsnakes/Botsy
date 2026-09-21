import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/session";
import { BRAND } from "../../brand";

const SITE = `${window.location.origin}${window.location.pathname}`; // …/Botsy/app/

export function Login() {
  const { status } = useSession();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");
  if (status === "authed") return <Navigate to={new URLSearchParams(loc.search).get("next") ?? "/"} replace />;
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setState("sending");
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: SITE } });
    if (error) { setErr(error.message); setState("error"); } else setState("sent");
  };
  return (
    <div className="auth">
      <form className="card stack auth-card" onSubmit={send}>
        <div className="brand"><span className="mark" aria-hidden />{BRAND}</div>
        <h1>Entrar</h1>
        {state === "sent" ? (
          <p>Te mandamos un enlace a <b>{email}</b>. Ábrelo en este mismo navegador; vale una hora.</p>
        ) : (
          <>
            <p className="muted">Sin contraseñas: escribe tu correo y te mandamos un enlace para entrar.</p>
            <input className="input" type="email" required autoFocus placeholder="tu@empresa.mx" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Correo" />
            {state === "error" && <p className="small" style={{ color: "var(--red)" }}>No se pudo enviar: {err}</p>}
            <button className="btn primary" disabled={state === "sending" || !email.includes("@")}>{state === "sending" ? "Enviando…" : "Enviarme el enlace"}</button>
          </>
        )}
      </form>
    </div>
  );
}
