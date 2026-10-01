// Single source of truth for the brand. Change these three lines when the name is decided (see Botsy-docs/docs/compendio/12-naming.md).
export const BRAND = "Habliamos";
export const BRAND_TAGLINE = "Habla con tus clientes como si estuvieras ahí.";
export const BRAND_DOMAIN = "habliamos.com";

// The floating chat widget is served by the Worker as a static asset at <root>/widget.js;
// VITE_API_URL points at …/v1, so derive the root from it (with a sane default for local dev).
export const WIDGET_SRC = (((import.meta as any).env?.VITE_API_URL as string | undefined) ?? "https://habliamos-api.artmedinas.workers.dev/v1").replace(/\/v1\/?$/, "") + "/widget.js";
