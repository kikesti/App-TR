export interface ParametrosEnvioTelegram {
  contenidoTxt: string;
  nombreArchivo: string;
  jornada: number;
  totalApuestas: number;
  botToken?: string;
  chatId?: string;
}

export interface RespuestaEnvioTelegram {
  success: boolean;
  sentToTelegram?: boolean;
  simulated?: boolean;
  mensaje: string;
  messageId?: number;
  error?: string;
}

/**
 * Envía el archivo de texto en formato EduLosilla al Bot de Telegram (o canal oficial)
 * a través del endpoint seguro del servidor backend `/api/telegram/send-edulosilla`.
 */
export async function enviarArchivoEduLosillaATelegram(
  params: ParametrosEnvioTelegram
): Promise<RespuestaEnvioTelegram> {
  try {
    const res = await fetch('/api/telegram/send-edulosilla', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        mensaje: errData.mensaje || `Error HTTP ${res.status} al conectar con el servidor de Telegram.`,
      };
    }

    return await res.json();
  } catch (error: any) {
    console.error('Error al invocar /api/telegram/send-edulosilla:', error);
    return {
      success: false,
      mensaje: error.message || 'Error de conexión de red enviando archivo a Telegram.',
    };
  }
}
