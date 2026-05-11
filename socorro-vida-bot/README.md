# 🏥 SocorroVida Bot — Guía completa (Meta WhatsApp Cloud API)

Bot trilingüe (Español / English / Qhichwa) para primeros auxilios en Cochabamba.  
Usa la **API oficial gratuita de WhatsApp de Meta** — sin Twilio, sin verificación de número boliviano.

---

## ✅ Qué necesitas

- Cuenta de **Facebook / Meta** (la tuya de siempre sirve)
- Cuenta en **Railway** para el hosting: https://railway.app
- Cuenta en **GitHub**: https://github.com
- API Key de **Anthropic**: https://console.anthropic.com

---

## PASO 1 — Crear la app en Meta Developers

1. Ve a https://developers.facebook.com
2. Clic en **"Mis aplicaciones" → "Crear aplicación"**
3. Elige tipo: **"Empresa"** (o "Business")
4. Ponle nombre: `SocorroVida` y clic en Crear
5. En el panel de la app, busca **"WhatsApp"** y haz clic en **"Configurar"**

---

## PASO 2 — Obtener el Phone Number ID y el Token temporal

1. En el panel de WhatsApp ve a **"Empezando" (Getting Started)**
2. Verás:
   - **Número de prueba** (un número de Meta para testear, gratis)
   - **Phone Number ID** → cópialo (va en `.env` como `WHATSAPP_PHONE_ID`)
   - **Token de acceso temporal** → cópialo (va en `.env` como `WHATSAPP_TOKEN`)
3. En **"Para:"** agrega tu número boliviano personal para recibir mensajes de prueba
4. Clic en **"Enviar mensaje"** — recibirás un mensaje de Meta en tu WhatsApp ✅

> ⚠️ El token temporal dura 24 horas. En el Paso 5 lo vuelves permanente.

---

## PASO 3 — Subir el código a GitHub

```bash
cd socorro-vida-bot
git init
git add .
git commit -m "SocorroVida Bot v2"
```

1. Ve a https://github.com/new
2. Crea un repositorio (puede ser privado)
3. Sigue las instrucciones para subir el código

---

## PASO 4 — Deploy en Railway

1. Ve a https://railway.app → entra con GitHub
2. **New Project → Deploy from GitHub repo** → elige tu repo
3. Ve a la pestaña **Variables** y agrega:

   ```
   ANTHROPIC_API_KEY      = sk-ant-tu-key
   WHATSAPP_PHONE_ID      = (el número del Paso 2)
   WHATSAPP_TOKEN         = (el token del Paso 2)
   WHATSAPP_VERIFY_TOKEN  = socorro2024
   PORT                   = 3000
   ```

4. Railway te dará una URL como:
   `https://socorro-vida-bot-production.up.railway.app`

---

## PASO 5 — Conectar el webhook en Meta

1. En developers.facebook.com → tu app → **WhatsApp → Configuración**
2. Sección **"Webhooks"** → clic en **"Configurar"**
3. Rellena:
   - **URL de devolución de llamada:**
     `https://tu-url-railway.up.railway.app/webhook`
   - **Token de verificación:** `socorro2024`
     (el mismo que pusiste en `WHATSAPP_VERIFY_TOKEN`)
4. Clic en **"Verificar y guardar"** — debe mostrar ✅
5. En **"Campos del webhook"** activa: `messages`

---

## PASO 6 — Crear token permanente (para que no expire)

1. Ve a https://business.facebook.com → **Configuración → Usuarios del sistema**
2. Crea un usuario del sistema de tipo **Administrador**
3. Asígnale acceso a tu app
4. Genera un token con permisos: `whatsapp_business_messaging`
5. Copia ese token y reemplaza `WHATSAPP_TOKEN` en Railway con él

---

## PASO 7 — Probar el bot

Desde tu WhatsApp personal envía `hola` al número de prueba de Meta.  
Deberías recibir el selector de idioma. Elige `1`, `2` o `3` y prueba el menú.

---

## Comandos del bot

| Mensaje | Respuesta |
|---------|-----------|
| `hola` / `menu` | Menú principal (en el idioma elegido) |
| `idioma` / `language` / `rimay` | Vuelve al selector de idioma |
| `1` | Asfixia / Choking / Siksisqa |
| `2` | Paro cardíaco / CPR / Sunqun sayasqa |
| `3` | Hemorragia / Bleeding / Yawar lluksimusqa |
| `4` | Quemaduras / Burns / Ninawan ruphasqa |
| `5` | Desmayo / Fainting / Yuyaynin chinkarirqa |
| `6` | Fracturas / Fractures / Tullun p'akikurqa |
| `7` | Hospitales cercanos |
| `8` | Números de emergencia |

También detecta palabras clave escritas libremente en los 3 idiomas.

---

## Para pasar a número propio de WhatsApp Business

Una vez que quieras usar tu propio número (no el de prueba de Meta):

1. En Meta Developers → WhatsApp → **Números de teléfono → Agregar número**
2. Necesitas una **cuenta de Meta Business verificada**
3. El número NO puede estar ya registrado en WhatsApp personal
4. El proceso dura 1–3 días hábiles

---

## 💰 Costos

| Servicio | Costo |
|----------|-------|
| Railway | Gratis hasta 500 hrs/mes |
| Meta WhatsApp API | Gratis (primeras 1,000 conversaciones/mes) |
| Anthropic API | ~$0.003 por instrucción médica generada |
| **Total** | **~$0–3 USD/mes** para uso normal |

