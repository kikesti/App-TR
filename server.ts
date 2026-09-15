import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Prevenir caché obsoleto en navegadores móviles para el documento principal
app.use((req, res, next) => {
  if (req.method === "GET" && (req.path === "/" || req.path.endsWith(".html") || !req.path.includes("."))) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});

// Lazy initializer for Gemini
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "App TR v20.57 Master",
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

const DEFAULT_GAS_URL =
  "https://script.google.com/macros/s/AKfycbxpScFeI1ssDEbR6HAygBRn0fu0dMKC9OxYKuUPnZhrVEsctdtKWoGUap0A1CuczNCAVg/exec";

// Proxy seguro para peticiones a Google Apps Script evitando restricciones CORS del navegador
app.post("/api/gas", async (req, res) => {
  try {
    const targetUrl = req.body.gasUrl || DEFAULT_GAS_URL;
    const payload = { ...req.body };
    delete payload.gasUrl;

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return res.json(data);
    } catch {
      return res.json({ raw: text, status: response.status });
    }
  } catch (error: any) {
    console.error("Error en proxy /api/gas:", error);
    return res.status(500).json({
      error: true,
      mensaje: error.message || "Error de comunicación con Google Apps Script.",
    });
  }
});

// API para Generación de Carteles y Gráficos de Jornada con Gemini
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, aspectRatio = "1:1", imageSize = "1K" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "El prompt es obligatorio." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY no está configurada en las variables de entorno.",
      });
    }

    const ai = getGeminiClient();

    // Modelos para generación de imagen (nano banana series)
    const imageCandidateModels = ["gemini-3.1-flash-image", "gemini-3.1-flash-lite-image"];
    let lastImgError: any = null;
    let base64Image: string | null = null;
    let mimeType: string = "image/png";

    for (const imgModel of imageCandidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: imgModel,
          contents: {
            parts: [
              {
                text: prompt,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any,
              imageSize: imageSize as any,
            },
          },
        });

        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
          for (const part of candidate.content.parts) {
            if ((part as any).inlineData) {
              base64Image = (part as any).inlineData.data;
              mimeType = (part as any).inlineData.mimeType || "image/png";
              break;
            }
          }
        }

        if (base64Image) {
          break;
        }
      } catch (err: any) {
        lastImgError = err;
        console.warn(`[Gemini Imagen] Error con modelo '${imgModel}':`, err?.status || err?.code, err?.message);
        // Si es cuota agotada (429) o alta demanda (503), intentamos el siguiente modelo
      }
    }

    if (!base64Image) {
      const errMsg = lastImgError?.message || "";
      const isQuota = lastImgError?.status === 429 || errMsg.includes("429") || errMsg.includes("quota");
      if (isQuota) {
        return res.status(429).json({
          error: "Has alcanzado temporalmente el límite de cuota gratuita para generación de imágenes. Por favor espera 30 segundos o selecciona una clave de pago en el panel de Ajustes.",
        });
      }
      return res.status(502).json({
        error: lastImgError?.message || "El servicio de generación de imágenes no está disponible en este momento. Inténtalo de nuevo en unos segundos.",
      });
    }

    return res.json({
      success: true,
      imageUrl: `data:${mimeType};base64,${base64Image}`,
      aspectRatio,
      imageSize,
    });
  } catch (error: any) {
    console.error("Error en /api/generate-image:", error);
    const isQuota = error?.status === 429 || (error?.message && error.message.includes("quota"));
    return res.status(isQuota ? 429 : 500).json({
      error: isQuota
        ? "Límite de cuota gratuita de generación de imágenes alcanzado. Espera unos segundos o usa una clave con facturación activa."
        : error.message || "Error al generar la imagen con Gemini.",
    });
  }
});

// API para Extracción Automática de Partidos desde Imagen de Boleto con Gemini Visión
app.post("/api/extract-jornada-image", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/png" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Se requiere la imagen en formato base64." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY no está configurada en las variables de entorno del servidor.",
      });
    }

    // Extraer base64 limpio sin encabezado data URI
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");

    const ai = getGeminiClient();

    const promptText = `
Eres un analista experto en La Quiniela de fútbol de España.
Analiza detenidamente esta captura de pantalla oficial con los partidos programados de la jornada.

Tu misión es extraer de manera precisa y fidedigna:
1. El número de la jornada si está visible en la cabecera (por ejemplo "JORNADA 6" -> numeroJornada: 6).
2. Los 15 partidos exactamente en el orden del 1 al 15:
   - Partidos 1 al 14: Los partidos estándar de la quiniela.
   - Partido 15: El Pleno al 15 (suele ubicarse al final, con casillas de 0, 1, 2, M o formato destacado). Extrae el equipo local y el visitante.
3. Para cada partido:
   - 'local': Nombre oficial y reconocible del club local (ej. "Athletic Club", "Levante UD", "Osasuna", "Racing de Santander", "Real Madrid", "Sevilla FC", "Villarreal CF", "Cádiz CF", "CD Tenerife", "Real Valladolid", "Real Sociedad", etc.).
   - 'visitante': Nombre oficial y reconocible del club visitante (ej. "Elche CF", "FC Barcelona", "RCD Espanyol", "Deportivo Alavés", "Rayo Vallecano", "Valencia CF", "Real Betis", "UD Las Palmas", "CD Leganés", "Real Oviedo", "Atlético de Madrid", etc.).
   - Si algún equipo tiene la coletilla "(F)" o femenina (por ejemplo "ALAVÉS (F)", "GRANADA (F)", "LOGROÑO (F)", "EIBAR (F)", "MADRID CFF (F)", "BADALONA W.(F)"), consérvala tal cual para identificar la Liga Femenina.
   - 'fechaHora': El día de la semana y la hora en formato claro en español (ej. "Sábado 18:30", "Domingo 16:15", "Viernes 21:00", "Lunes 21:00", etc.).
   - 'canalTv': Asigna un canal de emisión estándar (ej. "DAZN LaLiga", "Movistar+ LaLiga", "Gol Play" o "LaLiga TV Hypermotion").
   - 'prob1', 'probX', 'prob2': Números enteros estimados de porcentaje de probabilidad que sumen 100.
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        numeroJornada: {
          type: Type.INTEGER,
          description: "Número de la jornada extraído (ej: 6)",
        },
        partidos: {
          type: Type.ARRAY,
          description: "Lista ordenada de 15 partidos",
          items: {
            type: Type.OBJECT,
            properties: {
              numero: { type: Type.INTEGER },
              local: { type: Type.STRING },
              visitante: { type: Type.STRING },
              fechaHora: { type: Type.STRING },
              canalTv: { type: Type.STRING },
              prob1: { type: Type.INTEGER },
              probX: { type: Type.INTEGER },
              prob2: { type: Type.INTEGER },
            },
            required: ["numero", "local", "visitante", "fechaHora"],
          },
        },
      },
      required: ["partidos"],
    };

    // Modelos en orden de preferencia con redundancia automática ante picos de demanda (503 / 429)
    // Usamos exclusivamente modelos vigentes soportados por la API
    const candidateModels = [
      "gemini-3.6-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
      "gemini-3.8-flash",
    ];
    let lastError: any = null;
    let successfulResult: any = null;
    let modelUsed = "";

    for (const modelName of candidateModels) {
      // Intentar hasta 2 veces por modelo en caso de fallo transitorio 503
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[Gemini Visión] Intentando extraer con modelo '${modelName}' (intento ${attempt})...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: cleanBase64,
                  },
                },
                {
                  text: promptText,
                },
              ],
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: responseSchema,
            },
          });

          const outputText = response.text;
          if (outputText) {
            successfulResult = JSON.parse(outputText);
            modelUsed = modelName;
            console.log(`[Gemini Visión] ¡Extracción exitosa con '${modelName}'!`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code || "";
          const msg = err?.message || "";
          console.warn(`[Gemini Visión] Error con '${modelName}' (intento ${attempt}):`, status, msg);

          // Si es error 503 (alta demanda) o 429 (rate limit), esperar brevemente antes del siguiente intento
          const isHighDemand = status === 503 || msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE");
          if (isHighDemand && attempt === 1) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          } else {
            // Pasar al siguiente modelo de respaldo
            break;
          }
        }
      }

      if (successfulResult) {
        break;
      }
    }

    if (!successfulResult) {
      throw lastError || new Error("No fue posible extraer los datos tras intentar con todos los modelos de respaldo.");
    }

    return res.json({
      success: true,
      data: successfulResult,
      modelUsed: modelUsed,
    });
  } catch (error: any) {
    console.error("Error en /api/extract-jornada-image:", error);
    return res.status(500).json({
      error: true,
      mensaje: error.message || "Error al procesar la imagen con Gemini Visión.",
    });
  }
});

// API para Despacho Automático del Archivo Oficial EduLosilla a Telegram al Cierre de Apuestas (Relé T-Y)
app.post("/api/telegram/send-edulosilla", async (req, res) => {
  try {
    const { contenidoTxt, nombreArchivo, jornada, totalApuestas, botToken, chatId } = req.body;

    const token = (botToken || process.env.TELEGRAM_BOT_TOKEN || "").trim();
    const targetChatId = (chatId || process.env.TELEGRAM_CHAT_ID || "").trim();

    const timestamp = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
    const caption =
      `⚽ *LIGA TRG - QUINIELA JORNADA ${jornada}*\n` +
      `🔒 *Cierre de Apuestas (Relé T-Y) Ejecutado*\n\n` +
      `📋 *${totalApuestas} apuestas* validadas en formato oficial EduLosilla (16 caracteres/apuesta).\n` +
      `⏰ *Plazo de sellado:* Tienes margen para sellar este archivo en la web de EduLosilla hasta el inicio del primer partido (Hora T).\n` +
      `🕒 *Generado:* ${timestamp}`;

    if (!token || !targetChatId) {
      console.log(`[Telegram] Envío simulado (sin token o chat_id configurado) para Jornada ${jornada} (${totalApuestas} apuestas).`);
      return res.json({
        success: true,
        simulated: true,
        sentToTelegram: false,
        mensaje: `Archivo EduLosilla (${totalApuestas} apuestas) preparado para Telegram al cerrar T-Y. Para envío en vivo a tu bot/canal, añade TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en las variables de entorno o en la pestaña EduLosilla.`,
        caption,
      });
    }

    // Usar API oficial de Telegram: sendDocument
    const formData = new FormData();
    formData.append("chat_id", targetChatId);
    formData.append("caption", caption);
    formData.append("parse_mode", "Markdown");

    const fileBlob = new Blob([contenidoTxt || ""], { type: "text/plain;charset=utf-8" });
    formData.append("document", fileBlob, nombreArchivo || `quiniela_jornada_${jornada}_edulosilla.txt`);

    const telegramEndpoint = `https://api.telegram.org/bot${token}/sendDocument`;
    const response = await fetch(telegramEndpoint, {
      method: "POST",
      body: formData,
    });

    const result: any = await response.json();

    if (result.ok) {
      console.log(`[Telegram] Archivo EduLosilla entregado con éxito a chat_id ${targetChatId} (msg_id: ${result.result?.message_id})`);
      return res.json({
        success: true,
        sentToTelegram: true,
        simulated: false,
        messageId: result.result?.message_id,
        mensaje: `Archivo oficial EduLosilla enviado al bot de Telegram (Chat ID: ${targetChatId}) con éxito.`,
      });
    } else {
      console.warn(`[Telegram] Respuesta no-ok de Telegram API:`, result);
      return res.json({
        success: false,
        sentToTelegram: false,
        simulated: false,
        error: result.description || "Error devuelto por la API de Telegram",
        mensaje: `Error al enviar a Telegram: ${result.description}`,
      });
    }
  } catch (error: any) {
    console.error("Error en /api/telegram/send-edulosilla:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error interno despachando archivo a Telegram.",
      mensaje: `Error interno al contactar con Telegram: ${error.message}`,
    });
  }
});

// Start Server with Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`App TR backend running on port ${PORT}`);
  });
}

startServer();
