export const APP_VERSION = '20.57';
export const APP_VERSION_STRING = 'v20.57';
export const APP_VERSION_MASTER = 'Versión 20.57 Master';

export type FaseJornada = 'FASE_1_APERTURA' | 'FASE_2_EN_VIVO' | 'FASE_3_CIERRE';

export interface Jugador {
  id: string;
  nombre: string;
  pin: string;
  email: string;
  saldoJornadas: number;
  activo: boolean;
  totalPuntos: number;
  totalAciertos: number;
  jornadasJugadas: number;
  rol?: 'USER' | 'ADMIN';
  equipoFavorito?: string;
  fcmToken?: string;
  telegramId?: string;
  avatarColor?: string;
}

export interface Partido {
  id: number;
  numero: number; // 1 a 14, 15 es el Pleno
  equipoLocal: string;
  equipoVisitante: string;
  escudoLocal?: string;
  escudoVisitante?: string;
  fechaHora: string;
  canalTv?: string;
  prob1: number; // porcentaje ej 55%
  probX: number; // porcentaje ej 25%
  prob2: number; // porcentaje ej 20%
  // Resultado real cuando se juega o escruta
  resultado?: '1' | 'X' | '2';
  golesLocal?: '0' | '1' | '2' | 'M';
  golesVisitante?: '0' | '1' | '2' | 'M';
  minuto?: string; // Ej: 'Final', 'Descanso', '78''
  golesEnVivoLocal?: number;
  golesEnVivoVisitante?: number;
}

export type SignoQuiniela = '1' | 'X' | '2';
export type GolesPleno = '0' | '1' | '2' | 'M';

export interface PronosticoPleno15 {
  local: GolesPleno;
  visitante: GolesPleno;
}

export interface QuinielaBoleto {
  id: string;
  jornada: number;
  jugadorId: string;
  jugadorNombre: string;
  fechaSellado: string;
  codigoResguardo: string;
  // Columna 1 obligatoria (partidos 1..14)
  columna1: Record<number, SignoQuiniela>;
  // Columna 2 opcional o doble
  columna2?: Record<number, SignoQuiniela>;
  // Pleno al 15
  pleno15: PronosticoPleno15;
  // Escrutinio
  escrutada: boolean;
  aciertosCol1?: number;
  aciertosCol2?: number;
  aciertoPleno15?: boolean;
  maxAciertos?: number;
  puntosGanados?: number;
}

export interface EstadoJornada {
  numeroJornada: number;
  temporada: string;
  fase: FaseJornada;
  abierta: boolean;
  fechaLimiteTx: string; // Ej: Viernes 20:00 - Aviso previo
  fechaLimiteTy: string; // Ej: Sábado 14:00 - Cierre inapelable
  ultimoAvisoTx?: string;
  ultimoCierreTy?: string;
  releForzadoTy: boolean;
  horaTx?: string;
  horaTy?: string;
  // Relé T-Y y archivo EduLosilla (.txt oficial) con envío a Telegram
  archivoEduLosillaGenerado?: boolean;
  ultimoArchivoEduLosillaTxt?: string;
  fechaEnvioEduLosilla?: string;
  totalApuestasEduLosilla?: number;
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramEnvioExitoso?: boolean;
  telegramUltimoMensaje?: string;
}

export interface MarqueeConfig {
  activa: boolean;
  texto: string;
  tipo: 'info' | 'warning' | 'urgent' | 'success';
  velocidad?: number;
  activo?: boolean;
}

export type ConfiguracionMarquesina = MarqueeConfig;

export interface CanalTV {
  id: string;
  nombre: string;
  categoria: string;
  logo?: string;
  urlDirecto: string;
  enVivo: boolean;
  partidoDestacado?: string;
}

export interface NotificacionPush {
  id: string;
  titulo: string;
  mensaje: string;
  fecha?: string;
  fechaEnvio?: string;
  destinatario: 'TODOS' | string;
  prioridad?: 'alta' | 'normal';
  leida?: boolean;
}

export interface LogSistema {
  id: string;
  timestamp: string;
  nivel: 'INFO' | 'AVISO' | 'CIERRE' | 'ERROR';
  accion: string;
  detalles: string;
  usuario?: string;
  tipo?: string;
}

export type LogEntrada = LogSistema;
