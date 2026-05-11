const express = require("express");
const twilio = require("twilio");
const Anthropic = require("@anthropic-ai/sdk");
require("dotenv").config();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Sesiones en memoria ──────────────────────────────────────────────────────
const sesiones = {};
function getSesion(tel) {
  if (!sesiones[tel]) sesiones[tel] = { idioma: null, ultimoMensaje: Date.now() };
  return sesiones[tel];
}

// ─── Contenido estático multiidioma ──────────────────────────────────────────

const CONTENIDO = {
  es: {
    seleccion_idioma: `🌐 *SocorroVida Bot* — Elige tu idioma:\n\n*1* 🇧🇴 Español\n*2* 🇺🇸 English\n*3* 🏔️ Qhichwa (Quechua)\n\n_Escribe_ *idioma* _en cualquier momento para cambiar._`,

    menu: `🏥 *SocorroVida Bot*\n\nElige una opción:\n\n*1* 🫁 Asfixia / atragantamiento\n*2* ❤️ Paro cardíaco / RCP\n*3* 🩸 Hemorragia / sangrado\n*4* 🔥 Quemaduras\n*5* 🥴 Desmayo / pérdida de conciencia\n*6* 🦴 Fracturas o luxaciones\n*7* 🏥 Hospitales cercanos\n*8* 📞 Números de emergencia\n\n_Escribe *idioma* para cambiar idioma._`,

    hospitales: `🏥 *HOSPITALES — QUILLACOLLO / COCHABAMBA*\n\n1️⃣ *Hospital Viedma* (público)\n   📍 Av. Aniceto Arce, Cochabamba\n   🕐 24 horas · Urgencias siempre\n   📞 4-252500\n\n2️⃣ *Hospital Quillacollo* (público)\n   📍 C. Libertad s/n, Quillacollo\n   🕐 07:00–19:00 · Urgencias 24h\n   📞 4-761234\n\n3️⃣ *Hospital del Niño* (pediátrico)\n   📍 Nataniel Aguirre, Cochabamba\n   🕐 24 horas · Solo pediatría\n   📞 4-224444\n\n4️⃣ *Clínica Americana* (privada)\n   📍 Av. Pando, Cochabamba\n   🕐 24 horas · Alta complejidad\n   📞 4-456789\n\n5️⃣ *Hospital Corea INASES*\n   📍 Av. Blanco Galindo, Quillacollo\n   🕐 Lun–Vie 08:00–18:00\n   📞 4-760000\n\n_⚠️ Llama antes si no es urgencia. Horarios pueden variar._`,

    numeros: `📞 *EMERGENCIAS — BOLIVIA*\n\n🆘 Emergencias unificadas: *911*\n🚑 Ambulancia SEDES: *118*\n🚒 Bomberos: *119*\n🚔 Policía Nacional: *110*\n🏥 Cruz Roja: *115*\n⚠️ Defensa Civil: *113*\n💨 Gas EMCOGAS: *4-763000*\n\n_Guarda estos números ahora._`,

    aviso_grave: `\n\n⚠️ *Si es una emergencia grave, llama al 911 de inmediato.*\n\nEscribe *menu* para volver al inicio.`,
    aviso_error: `❌ Error al procesar. Si es emergencia, llama al *911* ahora.\n\nEscribe *menu* para reintentar.`,

    palabras_menu:  ["menu", "inicio", "hola", "hi", "0", "empezar"],
    palabras_idioma: ["idioma", "language", "lengua", "rimay", "simi"],

    palabras_clave: {
      asfixia:    ["asfixia", "atragant", "ahog", "no respira", "no puede respirar"],
      rcp:        ["rcp", "paro", "cardíaco", "corazon", "corazón", "reanimac"],
      hemorragia: ["sangr", "hemorr", "herida", "corte profundo"],
      quemadura:  ["quemad", "fuego", "incendi", "calor extremo"],
      desmayo:    ["desmay", "conciencia", "inconsciente", "se cayó", "desmayó"],
      fractura:   ["fractur", "hueso", "luxac", "torcedura", "roto"],
      hospitales: ["hospital", "clínica", "clinica", "urgencia", "donde ir"],
      numeros:    ["número", "numero", "llam", "bombero", "policía", "policia", "ambulancia"],
    },

    prompts: {
      sistema: "Eres un asistente de emergencias médicas y primeros auxilios. Das instrucciones claras, numeradas y seguras. Siempre recuerdas llamar al 911 si la situación es grave. Nunca reemplazas atención médica profesional. Responde siempre en español.",
      asfixia:    "Explica qué hacer ante asfixia por atragantamiento en adultos y niños. Incluye maniobra de Heimlich paso a paso. Pasos numerados. Máximo 220 palabras. Usa emojis de alerta.",
      rcp:        "Explica cómo hacer RCP en adultos. Ritmo, profundidad, respiración de rescate, cuándo parar. Pasos numerados. Máximo 220 palabras. Usa emojis.",
      hemorragia: "Explica cómo controlar una hemorragia grave. Cuándo usar torniquete. Pasos numerados. Máximo 220 palabras. Usa emojis.",
      quemadura:  "Explica qué hacer ante quemaduras de 1er, 2do y 3er grado. Incluye qué NO hacer. Pasos numerados. Máximo 220 palabras. Usa emojis.",
      desmayo:    "Explica qué hacer cuando alguien se desmaya. Posición de recuperación, cuándo hacer RCP. Pasos numerados. Máximo 220 palabras. Usa emojis.",
      fractura:   "Explica qué hacer ante fractura o luxación. Cómo inmovilizar, cuándo mover al paciente. Pasos numerados. Máximo 220 palabras. Usa emojis.",
    },
  },

  en: {
    seleccion_idioma: `🌐 *SocorroVida Bot* — Choose your language:\n\n*1* 🇧🇴 Español\n*2* 🇺🇸 English\n*3* 🏔️ Qhichwa (Quechua)\n\n_Type_ *language* _at any time to switch._`,

    menu: `🏥 *SocorroVida Bot*\n\nChoose an option:\n\n*1* 🫁 Choking / airway obstruction\n*2* ❤️ Cardiac arrest / CPR\n*3* 🩸 Severe bleeding\n*4* 🔥 Burns\n*5* 🥴 Fainting / loss of consciousness\n*6* 🦴 Fractures or dislocations\n*7* 🏥 Nearby hospitals\n*8* 📞 Emergency numbers\n\n_Type *language* to switch language._`,

    hospitales: `🏥 *HOSPITALS — QUILLACOLLO / COCHABAMBA*\n\n1️⃣ *Hospital Viedma* (public)\n   📍 Av. Aniceto Arce, Cochabamba\n   🕐 Open 24h · Emergency always\n   📞 4-252500\n\n2️⃣ *Hospital Quillacollo* (public)\n   📍 C. Libertad s/n, Quillacollo\n   🕐 07:00–19:00 · Emergency 24h\n   📞 4-761234\n\n3️⃣ *Children's Hospital*\n   📍 Nataniel Aguirre, Cochabamba\n   🕐 24h · Pediatrics only\n   📞 4-224444\n\n4️⃣ *Clínica Americana* (private)\n   📍 Av. Pando, Cochabamba\n   🕐 24h · High complexity\n   📞 4-456789\n\n5️⃣ *Hospital Corea INASES*\n   📍 Av. Blanco Galindo, Quillacollo\n   🕐 Mon–Fri 08:00–18:00\n   📞 4-760000\n\n_⚠️ Call ahead for non-emergencies. Hours may vary._`,

    numeros: `📞 *EMERGENCY NUMBERS — BOLIVIA*\n\n🆘 Unified emergencies: *911*\n🚑 Ambulance SEDES: *118*\n🚒 Fire department: *119*\n🚔 National Police: *110*\n🏥 Red Cross: *115*\n⚠️ Civil Defense: *113*\n💨 Gas emergency: *4-763000*\n\n_Save these numbers now._`,

    aviso_grave: `\n\n⚠️ *If this is life-threatening, call 911 immediately.*\n\nType *menu* to return to the main menu.`,
    aviso_error: `❌ Error processing your request. If it's an emergency, call *911* now.\n\nType *menu* to try again.`,

    palabras_menu:  ["menu", "start", "hello", "hi", "hola", "0", "begin"],
    palabras_idioma: ["language", "idioma", "lengua", "switch"],

    palabras_clave: {
      asfixia:    ["chok", "airway", "can't breathe", "cannot breathe", "suffocating"],
      rcp:        ["cpr", "cardiac", "heart attack", "no pulse", "not breathing"],
      hemorragia: ["bleed", "hemorrhage", "wound", "cut", "blood"],
      quemadura:  ["burn", "fire", "scald", "heat"],
      desmayo:    ["faint", "unconscious", "passed out", "collapse"],
      fractura:   ["fracture", "broken bone", "disloc", "sprain"],
      hospitales: ["hospital", "clinic", "emergency room", "er", "where to go"],
      numeros:    ["number", "call", "ambulance", "police", "firefighter"],
    },

    prompts: {
      sistema: "You are an emergency medical and first aid assistant. Give clear, numbered, safe instructions. Always remind to call 911 if the situation is life-threatening. You never replace professional medical care. Respond in English.",
      asfixia:    "Explain what to do when someone is choking in adults and children. Include the Heimlich maneuver step by step. Numbered steps. Max 220 words. Use alert emojis.",
      rcp:        "Explain how to perform CPR on adults. Rate, depth, rescue breaths, when to stop. Numbered steps. Max 220 words. Use emojis.",
      hemorragia: "Explain how to control severe bleeding. When to use a tourniquet. Numbered steps. Max 220 words. Use emojis.",
      quemadura:  "Explain what to do for 1st, 2nd, and 3rd degree burns. Include what NOT to do. Numbered steps. Max 220 words. Use emojis.",
      desmayo:    "Explain what to do when someone faints. Recovery position, when to do CPR. Numbered steps. Max 220 words. Use emojis.",
      fractura:   "Explain what to do for fractures or dislocations. How to immobilize, when to move the patient. Numbered steps. Max 220 words. Use emojis.",
    },
  },

  qu: {
    seleccion_idioma: `🌐 *SocorroVida Bot* — Simiykita akllay:\n\n*1* 🇧🇴 Español\n*2* 🇺🇸 English\n*3* 🏔️ Qhichwa\n\n_"rimay" nispaqa simiykita tikray atinki._`,

    menu: `🏥 *SocorroVida Bot*\n\nImatatam munankichu?\n\n*1* 🫁 Siksisqa / aychunta aysasqa\n*2* ❤️ Sunqun sayasqa / RCP\n*3* 🩸 Yawar lluksimusqa\n*4* 🔥 Ninawan ruphasqa\n*5* 🥴 Puñusqa hina / yuyaynin chinkarirqa\n*6* 🦴 Tullun p'akikurqa\n*7* 🏥 Qayllapin hospitalkuna\n*8* 📞 Usqhay rimayninkuna\n\n_"rimay" nispaqa simiyta tikray._`,

    hospitales: `🏥 *HOSPITALKUNA — QUILLACOLLO / COCHABAMBA*\n\n1️⃣ *Hospital Viedma* (llaqtap)\n   📍 Av. Aniceto Arce, Cochabamba\n   🕐 Punchawnintin tutaynintin\n   📞 4-252500\n\n2️⃣ *Hospital Quillacollo* (llaqtap)\n   📍 C. Libertad s/n, Quillacollo\n   🕐 07:00–19:00 · Usqhay 24h\n   📞 4-761234\n\n3️⃣ *Wawa Hospital*\n   📍 Nataniel Aguirre, Cochabamba\n   🕐 24h · Wawasllam\n   📞 4-224444\n\n4️⃣ *Clínica Americana* (privado)\n   📍 Av. Pando, Cochabamba\n   🕐 24h\n   📞 4-456789\n\n5️⃣ *Hospital Corea INASES*\n   📍 Av. Blanco Galindo, Quillacollo\n   🕐 Lun–Vie 08:00–18:00\n   📞 4-760000\n\n_⚠️ Mana usqhaypiqa ñawpaqta rimari._`,

    numeros: `📞 *USQHAY RIMAYNINKUNA — BOLIVIA*\n\n🆘 Llapan usqhaykuna: *911*\n🚑 Ambulancia: *118*\n🚒 Ninata jap'iqakuq: *119*\n🚔 Policía: *110*\n🏥 Cruz Roja: *115*\n⚠️ Defensa Civil: *113*\n💨 Gas EMCOGAS: *4-763000*\n\n_Kunanmi kay numerokunatam waqaychaykuy._`,

    aviso_grave: `\n\n⚠️ *Usqhaymi kanki chayqa, 911 waqay kunanpuni.*\n\n*menu* nispaqa qallariymanña kutimuq.`,
    aviso_error: `❌ Pantarqan. Usqhaypiqa *911* waqay.\n\n*menu* nispaqa kutimuq.`,

    palabras_menu:  ["menu", "qallarisun", "hola", "rimay", "0"],
    palabras_idioma: ["rimay", "idioma", "language", "simi", "tikray"],

    palabras_clave: {
      asfixia:    ["siksisqa", "aychunta aysasqa", "manchariy", "mana samiy"],
      rcp:        ["sunqun sayasqa", "rcp", "reanimac", "paro"],
      hemorragia: ["yawar lluksimusqa", "yawar", "wiqchukuq"],
      quemadura:  ["ninawan ruphasqa", "nina", "ruphasqa", "quemad"],
      desmayo:    ["puñusqa hina", "yuyaynin chinkarirqa", "urmapurqa", "desmay"],
      fractura:   ["tullun p'akikurqa", "t'ispisqa", "p'akikuq", "fractur"],
      hospitales: ["hospital", "usqhay", "qayllapin", "hospitalkuna"],
      numeros:    ["waqay", "rimay", "ambulancia", "policía", "usqhay rimay"],
    },

    prompts: {
      sistema: "Eres un asistente de emergencias médicas. DEBES responder ÚNICAMENTE en quechua cochabambino (qhichwa sureño). Da instrucciones claras y numeradas. Siempre recuerda llamar al 911. Para términos médicos sin equivalente en quechua, usa la palabra española entre paréntesis.",
      asfixia:    "En quechua cochabambino explica qué hacer cuando alguien se atraganta o se ahoga. Incluye la maniobra de Heimlich (Heimlich llamk'ay). Pasos numerados con emojis. Máximo 200 palabras.",
      rcp:        "En quechua cochabambino explica cómo hacer RCP (sunqu kawsachiy) en adultos. Pasos numerados con emojis. Máximo 200 palabras.",
      hemorragia: "En quechua cochabambino explica cómo controlar una hemorragia grave (yawar lluksimuq). Pasos numerados con emojis. Máximo 200 palabras.",
      quemadura:  "En quechua cochabambino explica qué hacer ante quemaduras (ninawan ruphasqa). Incluye qué NO hacer. Pasos numerados. Máximo 200 palabras.",
      desmayo:    "En quechua cochabambino explica qué hacer cuando alguien se desmaya (puñusqa hina urmapurqa). Posición de recuperación. Pasos numerados. Máximo 200 palabras.",
      fractura:   "En quechua cochabambino explica qué hacer ante fracturas (tullun p'akikurqa) o luxaciones. Cómo inmovilizar. Pasos numerados. Máximo 200 palabras.",
    },
  },
};

const OPCION_A_TEMA = {
  "1": "asfixia",
  "2": "rcp",
  "3": "hemorragia",
  "4": "quemadura",
  "5": "desmayo",
  "6": "fractura",
};

// ─── Detectar idioma en selector inicial ─────────────────────────────────────
function detectarIdiomaSeleccion(texto) {
  if (texto === "1") return "es";
  if (texto === "2") return "en";
  if (texto === "3") return "qu";
  return null;
}

// ─── Detectar tema por palabras clave ─────────────────────────────────────────
function detectarTema(texto, idioma) {
  const lower = texto.toLowerCase();
  const claves = CONTENIDO[idioma].palabras_clave;
  for (const [tema, palabras] of Object.entries(claves)) {
    if (palabras.some((p) => lower.includes(p))) return tema;
  }
  return null;
}

// ─── Llamar a Claude ──────────────────────────────────────────────────────────
async function obtenerInstrucciones(tema, idioma) {
  const c = CONTENIDO[idioma];
  const prompt = c.prompts[tema];
  if (!prompt) return null;

  const res = await claude.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 900,
    system: c.prompts.sistema,
    messages: [{ role: "user", content: prompt }],
  });

  return res.content.map((b) => b.text || "").join("");
}

// ─── Webhook principal ────────────────────────────────────────────────────────
app.post("/webhook", async (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();
  const mensaje = (req.body.Body || "").trim();
  const telefono = req.body.From || "";
  const sesion = getSesion(telefono);
  sesion.ultimoMensaje = Date.now();

  let respuesta = "";

  try {
    // Sin idioma elegido → mostrar selector
    if (!sesion.idioma) {
      const elegido = detectarIdiomaSeleccion(mensaje);
      if (elegido) {
        sesion.idioma = elegido;
        respuesta = CONTENIDO[elegido].menu;
      } else {
        respuesta = CONTENIDO.es.seleccion_idioma;
      }
    } else {
      const c = CONTENIDO[sesion.idioma];

      // Cambio de idioma
      if (c.palabras_idioma.some((p) => mensaje.toLowerCase() === p)) {
        sesion.idioma = null;
        respuesta = CONTENIDO.es.seleccion_idioma;
      }
      // Menú principal
      else if (c.palabras_menu.some((p) => mensaje.toLowerCase() === p)) {
        respuesta = c.menu;
      }
      // Hospitales
      else if (mensaje === "7") {
        respuesta = c.hospitales;
      }
      // Números de emergencia
      else if (mensaje === "8") {
        respuesta = c.numeros;
      }
      // Opción numérica 1-6 (primeros auxilios)
      else if (OPCION_A_TEMA[mensaje]) {
        const tema = OPCION_A_TEMA[mensaje];
        const instrucciones = await obtenerInstrucciones(tema, sesion.idioma);
        respuesta = instrucciones + c.aviso_grave;
      }
      // Palabras clave en texto libre
      else {
        const tema = detectarTema(mensaje, sesion.idioma);
        if (tema === "hospitales") {
          respuesta = c.hospitales;
        } else if (tema === "numeros") {
          respuesta = c.numeros;
        } else if (tema && OPCION_A_TEMA[Object.keys(OPCION_A_TEMA).find(k => OPCION_A_TEMA[k] === tema)]) {
          const instrucciones = await obtenerInstrucciones(tema, sesion.idioma);
          respuesta = instrucciones + c.aviso_grave;
        } else {
          // No reconocido → mostrar menú
          respuesta = c.menu;
        }
      }
    }
  } catch (err) {
    console.error("Error:", err);
    const c = CONTENIDO[sesion.idioma || "es"];
    respuesta = c.aviso_error;
  }

  twiml.message(respuesta);
  res.type("text/xml").send(twiml.toString());
});

app.get("/", (req, res) => res.send("SocorroVida Bot activo ✅"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🏥 SocorroVida Bot corriendo en puerto ${PORT}`));
