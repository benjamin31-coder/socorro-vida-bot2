const Anthropic = require("@anthropic-ai/sdk");

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;
const VERIFY = process.env.WHATSAPP_VERIFY_TOKEN;

const PASOS = {
  asfixia: {
    titulo: "🫁 ASFIXIA / ATRAGANTAMIENTO",
    pasos: [
      "Pregúntale: '¿Puedes hablar?' Si no puede, actúa de inmediato.",
      "Párate detrás de la persona. Rodea su cintura con tus brazos.",
      "Pon un puño (pulgar hacia adentro) justo arriba del ombligo.",
      "Agarra tu puño con la otra mano.",
      "Empuja hacia adentro y hacia arriba, fuerte y rápido. Repite hasta 5 veces.",
      "Si no sale el objeto, llama al 911 y sigue repitiendo.",
      "Si pierde el conocimiento, acuéstala y empieza RCP.",
    ],
    nota: "⚠️ En bebés: golpes en la espalda, no Heimlich. Llama al 911 siempre.",
  },
  rcp: {
    titulo: "❤️ PARO CARDÍACO / RCP",
    pasos: [
      "Llama al 911 antes de empezar o pide a alguien que llame.",
      "Acuesta a la persona boca arriba en superficie dura.",
      "Pon las dos manos entrelazadas en el centro del pecho.",
      "Presiona fuerte hacia abajo unos 5 cm. Ritmo: 100 veces por minuto.",
      "Después de 30 compresiones, inclina su cabeza, levanta el mentón y da 2 respiraciones.",
      "Repite: 30 compresiones + 2 respiraciones. No pares hasta que llegue la ambulancia.",
    ],
    nota: "⚠️ Si no sabes dar respiraciones, solo haz compresiones sin parar.",
  },
  hemorragia: {
    titulo: "🩸 HEMORRAGIA / SANGRADO GRAVE",
    pasos: [
      "Pon un trapo o tela limpia directamente sobre la herida.",
      "Presiona fuerte con la palma de la mano sin soltar.",
      "Si se empapa la tela, agrega más encima sin quitar la primera.",
      "Mantén la presión mínimo 10 minutos sin soltar.",
      "Si está en brazo o pierna y no para: ata un cinturón muy apretado por encima de la herida. Anota la hora.",
      "Llama al 911 o traslada de urgencia al hospital.",
    ],
    nota: "⚠️ No retires el torniquete una vez colocado. Solo el médico lo hace.",
  },
  quemadura: {
    titulo: "🔥 QUEMADURAS",
    pasos: [
      "Aleja a la persona del fuego o calor.",
      "Enfría la quemadura con agua fría (no helada) durante 10 a 20 minutos.",
      "Retira ropa y joyas del área afectada con cuidado.",
      "Cubre con tela limpia o gasa sin apretar.",
      "NO pongas: pasta de dientes, mantequilla, aceite ni cremas.",
      "Quemadura de 1° (solo rojo): agua fría, no requiere hospital urgente.",
      "Quemadura de 2° (ampollas) o 3° (piel chamuscada): llama al 911 de inmediato.",
    ],
    nota: "⚠️ No revientes las ampollas. No uses hielo.",
  },
  desmayo: {
    titulo: "🥴 DESMAYO / PÉRDIDA DE CONCIENCIA",
    pasos: [
      "Sostenla para que no se golpee al caer.",
      "Acuéstala boca arriba y levanta sus piernas unos 30 cm.",
      "Afloja ropa apretada: cinturón, cuello del suéter.",
      "Revisa si respira. Si respira, espera que recupere el conocimiento.",
      "Si no despierta en 1 minuto, ponla de lado para que no se ahogue.",
      "Si no respira: llama al 911 e inicia RCP.",
      "Cuando despierte, que se quede acostada unos minutos. Ofrécele agua.",
    ],
    nota: "⚠️ Lleva al médico si no despierta, convulsiona o es diabética.",
  },
  fractura: {
    titulo: "🦴 FRACTURAS / LUXACIONES",
    pasos: [
      "No intentes acomodar el hueso. Déjalo como está.",
      "Inmoviliza la zona con palos, cartón o revistas amarrados con tela.",
      "El tablero debe quedar más largo que el hueso roto.",
      "Pon tela entre la tablilla y la piel para que no lastime.",
      "Ata (no muy apretado) por encima y por debajo del lugar roto.",
      "Si hay herida abierta, cúbrela con tela limpia antes de inmovilizar.",
      "Traslada al hospital con cuidado o llama al 911.",
    ],
    nota: "⚠️ No muevas al herido si sospechas fractura de columna o cuello.",
  },
};

const HOSPITALES = `🏥 *HOSPITALES — QUILLACOLLO / COCHABAMBA*

1️⃣ *Hospital Viedma* (público)
   📍 Av. Aniceto Arce, Cochabamba
   🕐 24 horas · Urgencias siempre
   📞 4-252500

2️⃣ *Hospital Quillacollo* (público)
   📍 C. Libertad s/n, Quillacollo
   🕐 07:00–19:00 · Urgencias 24h
   📞 4-761234

3️⃣ *Hospital del Niño* (pediatría)
   📍 Nataniel Aguirre, Cochabamba
   🕐 24 horas
   📞 4-224444

4️⃣ *Clínica Americana* (privada)
   📍 Av. Pando, Cochabamba
   🕐 24 horas
   📞 4-456789

5️⃣ *Hospital Corea INASES*
   📍 Av. Blanco Galindo, Quillacollo
   🕐 Lun–Vie 08:00–18:00
   📞 4-760000

_⚠️ Llama antes si no es urgencia._`;

const NUMEROS = `📞 *EMERGENCIAS — BOLIVIA*

🆘 Emergencias unificadas: *911*
🚑 Ambulancia SEDES: *118*
🚒 Bomberos: *119*
🚔 Policía Nacional: *110*
🏥 Cruz Roja: *115*
⚠️ Defensa Civil: *113*
💨 Gas EMCOGAS: *4-763000*

_Guarda estos números ahora._`;

const MENU = `🏥 *SocorroVida Bot*

Elige una opción:

*1* 🫁 Asfixia / atragantamiento
*2* ❤️ Paro cardíaco / RCP
*3* 🩸 Hemorragia / sangrado
*4* 🔥 Quemaduras
*5* 🥴 Desmayo / pérdida de conciencia
*6* 🦴 Fracturas o luxaciones
*7* 🏥 Hospitales cercanos
*8* 📞 Números de emergencia

_Escribe el número o describe lo que necesitas._`;

const OPCIONES = { "1":"asfixia","2":"rcp","3":"hemorragia","4":"quemadura","5":"desmayo","6":"fractura" };

function formatPasos(key) {
  const p = PASOS[key];
  if (!p) return null;
  let txt = `${p.titulo}\n\n`;
  p.pasos.forEach((s, i) => { txt += `${i + 1}. ${s}\n`; });
  txt += `\n${p.nota}`;
  txt += `\n\n⚠️ *Si la situación es grave, llama al 911 de inmediato.*\n\nEscribe *menu* para volver al inicio.`;
  return txt;
}

function detectarTema(txt) {
  const l = txt.toLowerCase();
  if (l.includes("asfixia") || l.includes("atragant") || l.includes("ahog")) return "asfixia";
  if (l.includes("rcp") || l.includes("paro") || l.includes("coraz") || l.includes("reanimac")) return "rcp";
  if (l.includes("sangr") || l.includes("hemorr") || l.includes("herida")) return "hemorragia";
  if (l.includes("quemad") || l.includes("fuego") || l.includes("incendi")) return "quemadura";
  if (l.includes("desmay") || l.includes("conciencia") || l.includes("inconsciente")) return "desmayo";
  if (l.includes("fractur") || l.includes("hueso") || l.includes("luxac") || l.includes("roto")) return "fractura";
  if (l.includes("hospital") || l.includes("cl") || l.includes("urgencia")) return "hospitales";
  if (l.includes("mero") || l.includes("bombero") || l.includes("polic") || l.includes("ambulancia")) return "numeros";
  return null;
}

async function enviarMensaje(to, texto) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: texto } }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("Error enviando mensaje:", err);
  }
}

async function obtenerInstruccionesIA(tema) {
  const prompts = {
    asfixia: "En español, explica qué hacer ante asfixia/atragantamiento en adultos y niños. Maniobra de Heimlich. Pasos numerados. Máximo 200 palabras.",
    rcp: "En español, explica cómo hacer RCP en adultos. Pasos numerados. Máximo 200 palabras.",
    hemorragia: "En español, explica cómo controlar hemorragia grave. Cuándo usar torniquete. Pasos numerados. Máximo 200 palabras.",
    quemadura: "En español, explica qué hacer ante quemaduras de 1°, 2° y 3° grado. Qué NO hacer. Pasos numerados. Máximo 200 palabras.",
    desmayo: "En español, explica qué hacer ante un desmayo. Posición de recuperación. Pasos numerados. Máximo 200 palabras.",
    fractura: "En español, explica qué hacer ante fractura o luxación. Cómo inmovilizar. Pasos numerados. Máximo 200 palabras.",
  };
  const res = await claude.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 700,
    system: "Eres un asistente de emergencias médicas. Das instrucciones claras, numeradas y seguras. Recuerda siempre llamar al 911. Nunca reemplazas atención médica profesional.",
    messages: [{ role: "user", content: prompts[tema] }],
  });
  return res.content.map(b => b.text || "").join("") + "\n\n⚠️ *Si es emergencia grave, llama al 911 de inmediato.*\n\nEscribe *menu* para volver.";
}

export default async function handler(req, res) {
  // Verificación del webhook
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY) {
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }

  if (req.method !== "POST") return res.sendStatus(405);

  res.sendStatus(200);

  try {
    const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg || msg.type !== "text") return;

    const telefono = msg.from;
    const texto = (msg.text?.body || "").trim();
    const lower = texto.toLowerCase();
    let respuesta = "";

    if (["menu", "inicio", "hola", "hi", "0", "empezar"].includes(lower)) {
      respuesta = MENU;
    } else if (texto === "7") {
      respuesta = HOSPITALES;
    } else if (texto === "8") {
      respuesta = NUMEROS;
    } else if (OPCIONES[texto]) {
      respuesta = formatPasos(OPCIONES[texto]);
    } else {
      const tema = detectarTema(texto);
      if (tema === "hospitales") respuesta = HOSPITALES;
      else if (tema === "numeros") respuesta = NUMEROS;
      else if (tema && PASOS[tema]) respuesta = formatPasos(tema);
      else respuesta = MENU;
    }

    await enviarMensaje(telefono, respuesta);
  } catch (err) {
    console.error("Error:", err);
  }
}
