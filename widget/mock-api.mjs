// Minimal mock of POST /v1/chat for widget testing (mirrors chat.ts contract:
// plain-text stream + x-conversation-id / x-escalate / x-greeting headers).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8787;
const KB = "Según la información de la clínica: estamos abiertos de lunes a viernes de 9 a 18 h, y los sábados de 9 a 14 h. La dirección es Av. Insurgentes 123, CDMX.";

http.createServer((req, res) => {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-headers", "content-type, x-api-key");
  res.setHeader("access-control-expose-headers", "x-conversation-id, x-escalate, x-greeting");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  if (req.method === "GET") {
    const file = req.url === "/" ? "dev.html" : req.url.slice(1).split("?")[0];
    try {
      const body = fs.readFileSync(path.join(dir, file));
      res.writeHead(200, { "content-type": file.endsWith(".html") ? "text/html; charset=utf-8" : "text/javascript; charset=utf-8" });
      res.end(body);
    } catch { res.writeHead(404); res.end("not found"); }
    return;
  }

  if (req.method === "POST" && req.url === "/v1/chat") {
    let raw = ""; req.on("data", (d) => (raw += d));
    req.on("end", async () => {
      const { text } = JSON.parse(raw || "{}");
      if ((req.headers["x-api-key"] || "") !== "bk_live_test") { res.writeHead(401); return res.end(JSON.stringify({ code: "unauthorized", message: "Clave inválida" })); }
      if (/horario|abierto|dirección|direccion/i.test(text)) {
        res.writeHead(200, {
          "content-type": "text/plain; charset=utf-8",
          "x-conversation-id": "conv_mock_" + Date.now(),
          "x-escalate": /humano|asesor|persona/i.test(text) ? "true" : "false",
          ...(raw.includes('"conversation_id"') ? {} : { "x-greeting": encodeURIComponent("Esta conversación la atiende un asistente de IA (Hablia). Puedo equivocarme; para casos importantes te paso a un humano.") }),
        });
        for (const piece of KB.match(/.{1,40}(\s|$)/g) || [KB]) { res.write(piece); await new Promise((r) => setTimeout(r, 60)); }
        return res.end();
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "x-conversation-id": "conv_mock_" + Date.now(), "x-escalate": "false" });
      res.end("Esa pregunta no está en mi base de conocimientos todavía. ¿Quieres hablar con un humano?");
    });
    return;
  }
  res.writeHead(404); res.end(JSON.stringify({ code: "not_found", message: "Ruta inexistente" }));
}).listen(PORT, () => console.log("mock hablia api → http://localhost:" + PORT));
