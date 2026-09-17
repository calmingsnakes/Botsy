// Scripted fallback for the 3 demo bots when the Worker is not reachable (GitHub Pages is static).
// Mirrors the Master Documents in Botsy-docs/apps/api/src/demo-bots.ts.

export const DEMO_BOTS = {
  "nube-contable": {
    id: "nube-contable", tab: "Soporte de software", note: "Nube Contable (empresa de ejemplo) · manual y políticas ficticias",
    greeting: 'Hola, soy Lía, el asistente virtual de Nube Contable. Soy una inteligencia artificial. Puedo ayudarte con el uso del sistema, facturación y planes; escribe "humano" en cualquier momento para que te atienda una persona.',
    starters: ["¿Cómo cancelo una factura?", "Me sale el error CFDI40145", "¿Cuánto cuesta el plan Negocio?", "Quiero cancelar mi suscripción"],
    rules: [
      [/cancel.*factura|factura.*cancel/i, "Para cancelar una factura ya timbrada: Ventas > Facturas > selecciona la factura > \"Cancelar ante el SAT\". Elige el motivo (01 con relación, 02 sin relación, 03 no se llevó a cabo, 04 nominativa). El SAT responde en menos de 72 horas. ¿Quieres que te diga cuál motivo aplica a tu caso?"],
      [/40145|rfc.*no existe|rechaza/i, "Ese error (CFDI40145) significa que el RFC del receptor no aparece en la lista del SAT: casi siempre es un error de captura o el cliente no está activo. Ve a Clientes > editar > RFC y compáralo con su constancia de situación fiscal. Si coincide y sigue fallando, te paso con una persona."],
      [/plan|precio|cuesta|cuánto/i, "Tenemos tres planes: Emprendedor $349/mes (50 facturas), Negocio $749/mes (300 facturas) y Empresa $1,490/mes (ilimitadas, 5 usuarios). Todos incluyen timbrado y soporte por chat. ¿Cuántas facturas emites al mes? Así te digo cuál te conviene."],
      [/cancelar.*suscrip|dar de baja|baja/i, "Entiendo. Las cancelaciones las atiende una persona del equipo para revisar tu caso; ya le envié un resumen para que no repitas nada. Te contactan hoy antes de las 6 pm. ¿Prefieres correo o teléfono?"],
      [/reembolso|devolu|descuento/i, "No puedo prometer reembolsos ni descuentos (es una regla de la empresa), pero sí puedo pasarte con una persona que revise tu caso. ¿Lo hago?"],
      [/nómina|nomina/i, "El módulo de nómina se activa en Configuración > Módulos y cuesta $199/mes adicionales; genera recibos CFDI 4.0 con complemento 1.2. ¿Te explico cómo timbrar tu primera nómina?"],
      [/usuario|invitar/i, "Para agregar usuarios: Configuración > Usuarios > Invitar. Solo el plan Empresa permite más de un usuario. ¿Qué plan tienes?"],
      [/impuesto|deduc|iva|isr|fiscal/i, "Eso ya es asesoría fiscal y no me corresponde darla; te recomiendo consultarlo con tu contador. Lo que sí puedo hacer es explicarte cómo registrar la operación en el sistema. ¿Te sirve?"],
    ],
    fallback: "Eso no está en mi manual, así que prefiero no inventar. Lo anoto para que el equipo lo documente y, si quieres, te paso con una persona ahora mismo.",
  },
  "foco-films": {
    id: "foco-films", tab: "Postventa", note: "Foco Films (productora de ejemplo) · 3 días después de entregar un comercial",
    greeting: "¡Hola! Soy Mateo, del equipo de Foco Films. Soy una inteligencia artificial que ayuda al equipo de postventa. Hace tres días recibiste el máster de tu comercial y me encantaría saber qué te pareció. Si prefieres hablar con una persona, escribe \"humano\".",
    starters: ["Hola, ya vi el comercial", "El color quedó un poco raro en la escena final", "¿Me pueden mandar la versión vertical?", "Todo perfecto, gracias"],
    rules: [
      [/raro|mal|no me gust|feo|oscuro|problema|color/i, "Gracias por decírmelo con confianza; eso es justo lo que necesitamos saber. Entiendo que el color de la escena final no quedó como esperabas. Los ajustes de color entran en las dos rondas de cambios menores que incluye tu proyecto. Ya le pasé el detalle al productor; ¿te acomoda una llamada hoy a las 4 o mañana a las 11?"],
      [/vertical|9:16|redes|instagram|tiktok|formato/i, "Claro: el máster incluye versiones 1:1, 9:16 y 16:9 en H.264 para redes. Te reenvío la liga de descarga (recuerda que expira en 30 días). ¿Necesitas también la versión para TV con loudness -24 LKFS?"],
      [/perfecto|gracias|excelente|me encant|bien/i, "¡Qué gusto! Se lo comparto al equipo, les va a alegrar el día. Si en algún momento quieres una versión adicional o un corte más corto, aquí estoy. ¿Hay algo que hubiéramos podido hacer mejor durante el proceso?"],
      [/cambio|modific|otra toma|guion|guión/i, "Los cambios menores (color, mezcla, duración hasta 5 s) están incluidos; cambios de guion o nuevas tomas se cotizan aparte, y eso lo define el productor, no yo. ¿Te agendo con él para verlo?"],
      [/cuánto|precio|costo|cotiz/i, "Las cotizaciones las hace el productor directamente; yo solo recojo tu retroalimentación. ¿Te lo conecto?"],
    ],
    fallback: "Cuéntame más: ¿qué fue lo que más te gustó y qué cambiarías? Lo que me digas llega tal cual al equipo.",
  },
  "planta-norte": {
    id: "planta-norte", tab: "Brigadas y emergencias", note: "Planta Norte (empresa de ejemplo) · basado en la NOM-002-STPS-2010",
    greeting: "Buen día. Soy el entrenador virtual de brigadas de Planta Norte, una inteligencia artificial. Practicamos incendios, evacuación y sismo con base en la NOM-002-STPS-2010 y el plan interno. Esta práctica no sustituye su capacitación presencial ni la constancia DC-3. Si hay una emergencia real, llame al 911 y active la alarma. ¿Qué desea practicar?",
    starters: ["Quiero practicar uso de extintor", "Hazme un cuestionario de incendios", "¿Qué hago si hay un conato en el almacén?", "Simulacro de sismo guiado"],
    rules: [
      [/extintor|pase/i, "Practiquemos el método PASE. Primera pregunta: ¿qué significa la letra P y a qué distancia inicial debe colocarse del fuego?"],
      [/presion|seguro|2|3|metro/i, "Correcto: Presione el seguro, a 2–3 metros del fuego. Siguiente: al aplicar el agente, ¿apunta a las llamas o a la base del fuego?"],
      [/base/i, "Exacto: siempre a la base, en barrido. Última: al retirarse, ¿se da la espalda al fuego? Responda sí o no."],
      [/^no\b/i, "Correcto: nunca se da la espalda. Practica registrada: 3 de 3. Recuerde: esto es evidencia complementaria; la constancia DC-3 la emite un agente capacitador registrado ante la STPS. ¿Practicamos clases de fuego?"],
      [/cuestionario|pregunta|examen/i, "Vamos. Pregunta 1 de 3: ¿Cuál extintor NO debe usarse en un fuego clase C (equipo eléctrico energizado): a) polvo químico seco ABC, b) agua a presión, c) CO2?"],
      [/\bb\b|agua/i, "Correcto: nunca agua en fuego eléctrico (clase C) ni en líquidos (B) o aceites de cocina (K). Pregunta 2: según la NOM-002-STPS-2010, ¿cuántos simulacros de evacuación por incendio deben realizarse al año como mínimo?"],
      [/uno|1|anual|al año/i, "Correcto: al menos uno al año, con brigadas capacitadas y extintores con revisión mensual. Pregunta 3: ¿cuál es el punto de reunión de Planta Norte?"],
      [/estacionamiento|norte/i, "Correcto: el estacionamiento norte, donde el jefe de brigada pasa lista antes de cualquier reingreso. Cuestionario completado: 3 de 3. Práctica registrada."],
      [/conato|almac[eé]n|fuego peque/i, "Un conato es un fuego menor al tamaño de un bote de basura. Si hay extintor a la mano y es seguro, intente sofocarlo con el método PASE sin darle la espalda. Si crece o hay humo denso: active la alarma, avise al jefe de brigada (Ing. Ramírez en turno matutino) y evacúe por la ruta señalizada al estacionamiento norte. ¿Practicamos la secuencia paso a paso?"],
      [/sismo|temblor/i, "Simulacro de sismo guiado. Paso 1 (durante el movimiento): NO evacúe; protéjase junto a columnas o trabes, lejos de estantes y ventanas. Escriba \"listo\" cuando termine el movimiento simulado."],
      [/listo/i, "Paso 2: evacúe con calma por la ruta señalizada, sin elevadores, al estacionamiento norte. Paso 3: el jefe de brigada pasa lista. Paso 4: nadie reingresa hasta verificar fugas de gas. Tiempo objetivo: 3 minutos. Simulacro registrado con fecha y hora."],
      [/herid|sangr|desmay|médic|medic/i, "No doy instrucciones médicas. Ante una persona lesionada: llame al 911, avise al jefe de brigada y active al brigadista de primeros auxilios. ¿Continuamos con la práctica?"],
    ],
    fallback: "Eso no está en la NOM-002 ni en el plan interno que tengo cargado; no voy a improvisar en temas de seguridad. Lo anoto para que el responsable de seguridad lo agregue. ¿Practicamos extintor, cuestionario, conato o sismo?",
  },
};

export function scriptedReply(botId, text, history) {
  const bot = DEMO_BOTS[botId];
  if (/\b(humano|persona|agente|asesor)\b/i.test(text)) return `Claro, te paso con una persona del equipo ahora mismo. Ya le envié un resumen de lo que hablamos para que no repitas nada. (En la demo no hay humano detrás; en tu cuenta, llega a tu correo o WhatsApp.)`;
  for (const [re, reply] of bot.rules) if (re.test(text)) return reply;
  const userTurns = history.filter((m) => m.role === "user").length;
  return userTurns > 1 && /^(sí|si|ok|va|dale|claro)\b/i.test(text) ? bot.rules[0][1] : bot.fallback;
}
