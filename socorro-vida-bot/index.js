const express = require("express");
const axios = require("axios");
const Anthropic = require("@anthropic-ai/sdk");
require("dotenv").config();

const app = express();
app.use(express.json());

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const TOKEN    = process.env.WHATSAPP_TOKEN;
const VERIFY   = process.env.WHATSAPP_VERIFY_TOKEN;

// ─── Sesiones ─────────────────────────────────────────────────────────────────
const sesiones = {};
function getSesion(tel) {
  if (!sesiones[tel]) sesiones[tel] = { idioma: null };
  return sesiones[tel];
}

// ─── Enviar mensaje a WhatsApp ────────────────────────────────────────────────
async function enviar(to, texto) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
    { messaging_product: "whatsapp", to, type: "text", text: { body: texto } },
    { headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" } }
  );
}

// ─── Contenido multiidioma ────────────────────────────────────────────────────
const CONTENIDO = {
  es: {
    selector: `🌐 *SocorroVida Bot* — Elige tu idioma:\n\n*1* 🇧🇴 Español\n*2* 🇺🇸 English\n*3* 🏔️ Qhichwa\n\n_Escribe *idioma* para cambiar en cualquier momento._`,
    menu: `🏥 *SocorroVida Bot*\n\nElige una opción:\n\n*1* 🫁 Asfixia / atragantamiento\n*2* ❤️ Paro cardíaco / RCP\n*3* 🩸 Hemorragia / sangrado\n*4* 🔥 Quemaduras\n*5* 🥴 Desmayo / pérdida de conciencia\n*6* 🦴 Fracturas o luxaciones\n*7* 🏥 Hospitales cercanos\n*8* 📞 Números de emergencia\n\n_Escribe *idioma* para cambiar idioma._`,
    hospitales: `🏥 *HOSPITALES — QUILLACOLLO / COCHABAMBA*\n\n1️⃣ *Hospital Viedma* (público)\n   📍 Av. Aniceto Arce, Cochabamba\n   🕐 24 horas · Urgencias siempre\n   📞 4-252500\n\n2️⃣ *Hospital Quillacollo* (público)\n   📍 C. Libertad s/n, Quillacollo\n   🕐 07:00–19:00 · Urgencias 24h\n   📞 4-761234\n\n3️⃣ *Hospital del Niño* (pediátrico)\n   📍 Nataniel Aguirre, Cochabamba\n   🕐 24 horas · Solo pediatría\n   📞 4-224444\n\n4️⃣ *Clínica Americana* (privada)\n   📍 Av. Pando, Cochabamba\n   🕐 24 horas\n   📞 4-456789\n\n5️⃣ *Hospital Corea INASES*\n   📍 Av. Blanco Galindo, Quillacollo\n   🕐 Lun–Vie 08:00–18:00\n   📞 4-760000\n\n_⚠️ Llama antes si no es urgencia._`,
    numeros: `📞 *EMERGENCIAS — BOLIVIA*\n\n🆘 Emergencias unificadas: *911*\n🚑 Ambulancia SEDES: *118*\n🚒 Bomberos: *119*\n🚔 Policía Nacional: *110*\n🏥 Cruz Roja: *115*\n⚠️ Defensa Civil: *113*\n💨 Gas EMCOGAS: *4-763000*\n\n_Guarda estos números ahora._`,
    aviso: `\n\n⚠️ *Si es emergencia grave, llama al 911 de inmediato.*\n\nEscribe *menu* para volver al inicio.`,
    error: `❌ Error. Si es emergencia llama al *911*.\n\nEscribe *menu* para reintentar.`,
    palabras_menu:   ["menu","inicio","hola","hi","0","empezar"],
    palabras_idioma: ["idioma","language","rimay","simi"],
    claves: {
      asfixia:    ["asfixia","atragant","ahog","no respira"],
      rcp:        ["rcp","paro","cardíaco","corazon","reanimac"],
      hemorragia: ["sangr","hemorr","herida","corte"],
      quemadura:  ["quemad","fuego","incendi"],
      desmayo:    ["desmay","conciencia","inconsciente"],
      fractura:   ["fractur","hueso","luxac","torcedura","roto"],
      hospitales: ["hospital","clínica","clinica","urgencia","donde ir"],
      numeros:    ["número","numero","bombero","policía","policia","ambulancia"],
    },
    prompts: {
      sistema: "Eres un asistente de emergencias médicas. Das instrucciones claras y numeradas. Recuerda siempre llamar al 911. Responde en español. Máximo 220 palabras.",
      asfixia:    "Explica qué hacer ante asfixia/atragantamiento en adultos y niños. Incluye maniobra de Heimlich. Pasos numerados. Usa emojis.",
      rcp:        "Explica cómo hacer RCP en adultos: ritmo, profundidad, respiración. Pasos numerados. Usa emojis.",
      hemorragia: "Explica cómo controlar hemorragia grave. Cuándo usar torniquete. Pasos numerados. Usa emojis.",
      quemadura:  "Explica qué hacer ante quemaduras 1°, 2° y 3° grado. Qué NO hacer. Pasos numerados. Usa emojis.",
      desmayo:    "Explica qué hacer ante un desmayo. Posición de recuperación, cuándo hacer RCP. Pasos numerados. Usa emojis.",
      fractura:   "Explica qué hacer ante fractura o luxación. Cómo inmovilizar. Pasos numerados. Usa emojis.",
    },
  },

  en: {
    selector: `🌐 *SocorroVida Bot* — Choose your language:\n\n*1* 🇧🇴 Español\n*2* 🇺🇸 English\n*3* 🏔️ Qhichwa\n\n_Type *language* anytime to switch._`,
    menu: `🏥 *SocorroVida Bot*\n\nChoose an option:\n\n*1* 🫁 Choking / airway obstruction\n*2* ❤️ Cardiac arrest / CPR\n*3* 🩸 Severe bleeding\n*4* 🔥 Burns\n*5* 🥴 Fainting / loss of consciousness\n*6* 🦴 Fractures or dislocations\n*7* 🏥 Nearby hospitals\n*8* 📞 Emergency numbers\n\n_Type *language* to switch._`,
    hospitales: `🏥 *HOSPITALS — QUILLACOLLO / COCHABAMBA*\n\n1️⃣ *Hospital Viedma* (public)\n   📍 Av. Aniceto Arce, Cochabamba\n   🕐 Open 24h\n   📞 4-252500\n\n2️⃣ *Hospital Quillacollo* (public)\n   📍 C. Libertad s/n, Quillacollo\n   🕐 07:00–19:00 · Emergency 24h\n   📞 4-761234\n\n3️⃣ *Children's Hospital*\n   📍 Nataniel Aguirre, Cochabamba\n   🕐 24h · Pediatrics only\n   📞 4-224444\n\n4️⃣ *Clínica Americana* (private)\n   📍 Av. Pando, Cochabamba\n   🕐 24h\n   📞 4-456789\n\n5️⃣ *Hospital Corea INASES*\n   📍 Av. Blanco Galindo, Quillacollo\n   🕐 Mon–Fri 08:00–18:00\n   📞 4-760000\n\n_⚠️ Call ahead for non-emergencies._`,
    numeros: `📞 *EMERGENCY NUMBERS — BOLIVIA*\n\n🆘 Unified emergencies: *911*\n🚑 Ambulance: *118*\n🚒 Fire dept: *119*\n🚔 Police: *110*\n🏥 Red Cross: *115*\n⚠️ Civil Defense: *113*\n💨 Gas emergency: *4-763000*\n\n_Save these numbers now._`,
    aviso: `\n\n⚠️ *If life-threatening, call 911 immediately.*\n\nType *menu* to go back.`,
    error: `❌ Error. If emergency, call *911* now.\n\nType *menu* to retry.`,
    palabras_menu:   ["menu","start","hello","hi","0","begin"],
    palabras_idioma: ["language","idioma","switch"],
    claves: {
      asfixia:    ["chok","airway","can't breathe","suffocating"],
      rcp:        ["cpr","cardiac","heart attack","no pulse"],
      hemorragia: ["bleed","hemorrhage","wound","blood"],
      quemadura:  ["burn","fire","scald"],
      desmayo:    ["faint","unconscious","passed out","collapse"],
      fractura:   ["fracture","broken bone","disloc","sprain"],
      hospitales: ["hospital","clinic","emergency room","er"],
      numeros:    ["number","call","ambulance","police","firefighter"],
    },
    prompts: {
      sistema: "You are an emergency medical assistant. Give clear, numbered instructions. Always remind to call 911. Respond in English. Max 220 words.",
      asfixia:    "What to do when someone is choking — adults and children. Include Heimlich maneuver. Numbered steps. Use emojis.",
      rcp:        "How to perform CPR on adults. Rate, depth, rescue breaths. Numbered steps. Use emojis.",
      hemorragia: "How to control severe bleeding. When to use tourniquet. Numbered steps. Use emojis.",
      quemadura:  "What to do for 1st, 2nd, 3rd degree burns. Include what NOT to do. Numbered steps. Use emojis.",
      desmayo:    "What to do when someone faints. Recovery position, when to do CPR. Numbered steps. Use emojis.",
      fractura:   "What to do for fractures or dislocations. How to immobilize. Numbered steps. Use emojis.",
    },
  },

  qu: {
    selector: `🌐 *SocorroVida Bot* — Simiykita akllay:\n\n*1* 🇧🇴 Español\n*2* 🇺🇸 English\n*3* 🏔️ Qhichwa\n\n_"rimay" nispaqa simiykita tikray atinki._`,
    menu: `🏥 *SocorroVida Bot*\n\nImatatam munankichu?\n\n*1* 🫁 Siksisqa / aychunta aysasqa\n*2* ❤️ Sunqun sayasqa / RCP\n*3* 🩸 Yawar lluksimusqa\n*4* 🔥 Ninawan ruphasqa\n*5* 🥴 Yuyaynin chinkarirqa\n*6* 🦴 Tullun p'akikurqa\n*7* 🏥 Qayllapin hospitalkuna\n*8* 📞 Usqhay rimayninkuna\n\n_"rimay" nispaqa simiyta tikray._`,
    hospitales: `🏥 *HOSPITALKUNA — QUILLACOLLO / COCHABAMBA*\n\n1️⃣ *Hospital Viedma*\n   📍 Av. Aniceto Arce, Cochabamba\n   🕐 Punchawnintin tutaynintin\n   📞 4-252500\n\n2️⃣ *Hospital Quillacollo*\n   📍 C. Libertad s/n, Quillacollo\n   🕐 07:00–19:00 · Usqhay 24h\n   📞 4-761234\n\n3️⃣ *Wawa Hospital*\n   📍 Nataniel Aguirre, Cochabamba\n   🕐 24h · Wawasllam\n   📞 4-224444\n\n4️⃣ *Clínica Americana*\n   📍 Av. Pando, Cochabamba\n   🕐 24h\n   📞 4-456789\n\n5️⃣ *Hospital Corea INASES*\n   📍 Av. Blanco Galindo, Quillacollo\n   🕐 Lun–Vie 08:00–18:00\n   📞 4-760000\n\n_⚠️ Mana usqhaypiqa ñawpaqta rimari._`,
    numeros: `📞 *USQHAY RIMAYNINKUNA — BOLIVIA*\n\n🆘 Llapan usqhaykuna: *911*\n🚑 Ambulancia: *118*\n🚒 Ninata jap'iqakuq: *119*\n🚔 Policía: *110*\n🏥 Cruz Roja: *115*\n⚠️ Defensa Civil: *113*\n💨 Gas EMCOGAS: *4-763000*\n\n_Kunanmi kay numerokunatam waqaychaykuy._`,
    aviso: `\n\n⚠️ *Usqhaymi kanki chayqa, 911 waqay kunanpuni.*\n\n*menu* nispaqa kutimuy.`,
    error: `❌ Pantarqan. Usqhaypiqa *911* waqay.\n\n*menu* nispaqa kutimuq.`,
    palabras_menu:   ["menu","qallarisun","hola","rimay","0"],
    palabras_idioma: ["rimay","idioma","language","simi","tikray"],
    claves: {
      asfixia:    ["siksisqa","aychunta aysasqa","mana samiy"],
      rcp:        ["sunqun sayasqa","rcp","paro"],
      hemorragia: ["yawar lluksimusqa","yawar"],
      quemadura:  ["ninawan ruphasqa","nina","ruphasqa"],
      desmayo:    ["yuyaynin chinkarirqa","urmapurqa","desmay"],
      fractura:   ["tullun p'akikurqa","p'akikuq","fractur"],
      hospitales: ["hospital","usqhay","qayllapin"],
      numeros:    ["waqay","ambulancia","policía","usqhay rimay"],
    },
    prompts: {
      sistema: "Eres asistente de emergencias. Responde SOLO en quechua cochabambino. Instrucciones claras y numeradas. Usa términos médicos en español entre paréntesis si no hay equivalente. Máximo 200 palabras.",
      asfixia:    "En quechua: qué hacer ante atragantamiento. Maniobra de Heimlich. Pasos numerados con emojis.",
      rcp:        "En quechua: cómo hacer RCP. Pasos numerados con emojis.",
      hemorragia: "En quechua: cómo controlar hemorragia grave. Pasos numerados con emojis.",
      quemadura:  "En quechua: qué hacer ante quemaduras. Qué NO hacer. Pasos numerados.",
      desmayo:    "En quechua: qué hacer ante desmayo. Posición de recuperación. Pasos numerados.",
      fractura:   "En quechua: qué hacer ante fractura o luxación. Cómo inmovilizar. Pasos numerados.",
    },
  },
};

const OPCION_TEMA = { "1":"asfixia","2":"rcp","3":"hemorragia","4":"quemadura","5":"desmayo","6":"fractura" };

function detectarIdiomaInicial(txt) {
  if (txt==="1") return "es";
  if (txt==="2") return "en";
  if (txt==="3") return "qu";
  return null;
}

function detectarTema(txt, idioma) {
  const low = txt.toLowerCase();
  for (const [tema, palabras] of Object.entries(CONTENIDO[idioma].claves)) {
    if (palabras.some(p => low.includes(p))) return tema;
  }
  return null;
}

async function instruccionesIA(tema, idioma) {
  const c = CONTENIDO[idioma];
  const res = await claude.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 900,
    system: c.prompts.sistema,
    messages: [{ role: "user", content: c.prompts[tema] }],
  });
  return res.content.map(b => b.text||"").join("");
}

// ─── Verificación del webhook (Meta lo exige al configurar) ───────────────────
app.get("/webhook", (req, res) => {
  const mode  = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const chall = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY) {
    console.log("Webhook verificado ✅");
    res.status(200).send(chall);
  } else {
    res.sendStatus(403);
  }
});

// ─── Recibir mensajes de WhatsApp ─────────────────────────────────────────────
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // Responder rápido a Meta

  try {
    const entry   = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;
    const msg     = value?.messages?.[0];
    if (!msg || msg.type !== "text") return;

    const telefono = msg.from;
    const texto    = (msg.text?.body || "").trim();
    const sesion   = getSesion(telefono);
    let respuesta  = "";

    if (!sesion.idioma) {
      const elegido = detectarIdiomaInicial(texto);
      if (elegido) {
        sesion.idioma = elegido;
        respuesta = CONTENIDO[elegido].menu;
      } else {
        respuesta = CONTENIDO.es.selector;
      }
    } else {
      const c = CONTENIDO[sesion.idioma];

      if (c.palabras_idioma.some(p => texto.toLowerCase() === p)) {
        sesion.idioma = null;
        respuesta = CONTENIDO.es.selector;
      } else if (c.palabras_menu.some(p => texto.toLowerCase() === p)) {
        respuesta = c.menu;
      } else if (texto === "7") {
        respuesta = c.hospitales;
      } else if (texto === "8") {
        respuesta = c.numeros;
      } else if (OPCION_TEMA[texto]) {
        const ins = await instruccionesIA(OPCION_TEMA[texto], sesion.idioma);
        respuesta = ins + c.aviso;
      } else {
        const tema = detectarTema(texto, sesion.idioma);
        if (tema === "hospitales")      respuesta = c.hospitales;
        else if (tema === "numeros")    respuesta = c.numeros;
        else if (tema && c.prompts[tema]) {
          const ins = await instruccionesIA(tema, sesion.idioma);
          respuesta = ins + c.aviso;
        } else {
          respuesta = c.menu;
        }
      }
    }

    await enviar(telefono, respuesta);
  } catch (err) {
    console.error("Error:", err?.response?.data || err.message);
  }
});

app.get("/", (req, res) => res.send("SocorroVida Bot activo ✅"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🏥 SocorroVida Bot en puerto ${PORT}`));
