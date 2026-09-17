# BRAND · demo pública

Landing page y panel de cliente (modo demo con datos de ejemplo) de una plataforma de **servicios administrados de agentes de IA en español** para atención a clientes, captación de leads, entrenamiento de personal y simulacros de emergencia.

- **Landing**: `index.html` + `landing/` — secciones basadas en las landings de Sierra, Decagon, Fin, Ada y Yalo; 3 bots demo (guionados aquí; en vivo cuando existe el Worker).
- **Panel**: `app/` + `src/` — React + TypeScript. `src/lib/api.ts` define el contrato; `MockApi` (datos en `src/mock/`) corre sin backend y `HttpApi` habla con el Worker cuando `VITE_API_URL` responde en `/health`.
- **Marca**: placeholder en `src/brand.ts` (una constante).

```bash
npm install
npm run dev        # http://localhost:5173/Botsy/  y  /Botsy/app/
npm test
npm run build      # dist/ → GitHub Pages (workflow en .github/workflows/pages.yml)
```

Para conectar el backend real: `VITE_API_URL=https://<worker>.workers.dev npm run build` (o la variable `VITE_API_URL` del repositorio en GitHub Actions).

El backend (Cloudflare Worker + Supabase + Stripe) y el compendio de negocio viven en un repositorio privado.
