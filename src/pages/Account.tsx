import { useData, useToast } from "../components/ui";

export function Account() {
  const toast = useToast();
  const { data: me } = useData((a) => a.me());
  return (
    <>
      <div className="page-head"><div><h1>Cuenta</h1><p>Datos de tu organización, datos fiscales y seguridad de tu acceso.</p></div></div>
      <div className="grid c2">
        <div className="card stack">
          <h3>Organización</h3>
          <label className="field">Nombre <input className="input" defaultValue={me?.org.name} /></label>
          <label className="field">RFC (para CFDI) <input className="input" defaultValue={me?.org.rfc} /></label>
          <label className="field">Correo de facturación <input className="input" defaultValue={me?.org.billing_email} /></label>
          <label className="field">Zona horaria <select className="select" defaultValue="America/Mexico_City"><option>America/Mexico_City</option><option>America/Monterrey</option><option>America/Cancun</option><option>America/Tijuana</option><option>America/Bogota</option></select></label>
          <div className="row"><button className="btn primary" onClick={() => toast("Datos guardados")}>Guardar</button></div>
        </div>
        <div className="stack">
          <div className="card stack">
            <h3>Tu acceso</h3>
            <p className="small">{me?.user.name} · {me?.user.email} · rol {me?.role}</p>
            <div className="row"><button className="btn" onClick={() => toast("Te enviamos un enlace para cambiar la contraseña")}>Cambiar contraseña</button><button className="btn" onClick={() => toast("Verificación en dos pasos activa")}>Verificación en dos pasos</button><button className="btn" onClick={() => toast("Sesiones cerradas en otros dispositivos")}>Cerrar otras sesiones</button></div>
          </div>
          <div className="card stack">
            <h3>Gerente de cuenta</h3>
            <p className="small">Arturo · <a href="mailto:hola@brand.mx">hola@brand.mx</a> · respuesta en menos de 4 horas hábiles. Para lo urgente, escribe <span className="kbd">humano</span> en el chat de ayuda.</p>
          </div>
          <div className="card stack" style={{ borderColor: "#f3c7c7" }}>
            <h3>Zona de cuidado</h3>
            <p className="small muted">Cancelar la suscripción se hace desde Facturación. Borrar la organización elimina bots, documentos y conversaciones tras 30 días de gracia (exportables mientras tanto).</p>
            <div className="row"><button className="btn danger" onClick={() => toast("Se enviaría confirmación por correo al propietario", "err")}>Borrar organización</button></div>
          </div>
        </div>
      </div>
    </>
  );
}
