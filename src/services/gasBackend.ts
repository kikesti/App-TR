import {
  Jugador,
  Partido,
  QuinielaBoleto,
  EstadoJornada,
  MarqueeConfig,
  CanalTV,
  LogSistema,
  FaseJornada,
  NotificacionPush
} from '../types';
import {
  INITIAL_JUGADORES,
  INITIAL_PARTIDOS,
  INITIAL_ESTADO,
  INITIAL_MARQUEE,
  INITIAL_CANALES,
  INITIAL_BOLETOS,
  INITIAL_LOGS
} from '../data/mockData';
import { getClubCrest } from './crestService';
import { calculateMatchProbabilities } from './oddsCalculator';
import { calcularRelesCronologicos } from './releTimeService';
import { generarArchivoTxtEduLosilla, ResultadoExportacionEduLosilla } from './edulosillaService';
import { enviarArchivoEduLosillaATelegram } from './telegramService';

const STORAGE_KEYS = {
  JUGADORES: 'trg_v2055_jugadores',
  PARTIDOS: 'trg_v2055_partidos',
  ESTADO: 'trg_v2055_estado',
  MARQUEE: 'trg_v2055_marquee',
  CANALES: 'trg_v2055_canales',
  BOLETOS: 'trg_v2055_boletos',
  LOGS: 'trg_v2055_logs',
  NOTIFS: 'trg_v2055_notifs',
  GAS_URL: 'trg_v2055_gas_url',
};

function getStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function setStorage<T>(key: string, val: T): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Error saving storage', e);
  }
}

export class GasBackendService {
  private static instance: GasBackendService;

  private jugadores: Jugador[];
  private partidos: Partido[];
  private estado: EstadoJornada;
  private marquee: MarqueeConfig;
  public static readonly DEFAULT_GAS_URL =
    'https://script.google.com/macros/s/AKfycbxpScFeI1ssDEbR6HAygBRn0fu0dMKC9OxYKuUPnZhrVEsctdtKWoGUap0A1CuczNCAVg/exec';

  private canales: CanalTV[];
  private boletos: QuinielaBoleto[];
  private logs: LogSistema[];
  private notifs: NotificacionPush[];
  private gasUrl: string;
  private isRemoteMode: boolean;

  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.jugadores = getStorage(STORAGE_KEYS.JUGADORES, INITIAL_JUGADORES);
    // Kike es un usuario más: normalizar datos y limpiar cualquier residuo de '(Administrador)' o 'ADMIN'
    this.jugadores = this.jugadores.map(j => {
      const esKike =
        j.id === 'ADMIN' ||
        j.email?.toLowerCase() === 'kikesti@gmail.com' ||
        j.nombre?.toLowerCase().includes('kike');
      if (esKike) {
        return {
          ...j,
          id: j.id === 'ADMIN' ? 'TRG-000' : j.id,
          nombre: 'Kike',
          email: 'kikesti@gmail.com',
          rol: 'USER' as const,
          totalPuntos: j.totalPuntos && j.totalPuntos > 0 ? j.totalPuntos : 135,
          totalAciertos: j.totalAciertos && j.totalAciertos > 0 ? j.totalAciertos : 154,
          jornadasJugadas: j.jornadasJugadas && j.jornadasJugadas > 0 ? j.jornadasJugadas : 18,
          saldoJornadas: j.saldoJornadas === 99 ? 6 : j.saldoJornadas,
        };
      }
      return j;
    });
    setStorage(STORAGE_KEYS.JUGADORES, this.jugadores);
    const loadedPartidos: Partido[] = getStorage(STORAGE_KEYS.PARTIDOS, INITIAL_PARTIDOS);
    // Si los partidos almacenados tienen el valor plano por defecto (33/34/33), calcular probabilidades realistas
    this.partidos = loadedPartidos.map(p => {
      const isFlat = (!p.prob1 && !p.prob2) || (p.prob1 === 33 && p.probX === 34 && p.prob2 === 33);
      if (isFlat && p.equipoLocal && p.equipoVisitante) {
        const calc = calculateMatchProbabilities(p.equipoLocal, p.equipoVisitante);
        return { ...p, prob1: calc.prob1, probX: calc.probX, prob2: calc.prob2 };
      }
      return p;
    });
    this.estado = getStorage(STORAGE_KEYS.ESTADO, INITIAL_ESTADO);
    // Si el estado arrastra la jornada de prueba 28, actualizar a la jornada actual 7 solicitada
    if (this.estado.numeroJornada === 28) {
      this.estado.numeroJornada = 7;
    }
    this.marquee = getStorage(STORAGE_KEYS.MARQUEE, INITIAL_MARQUEE);
    if (this.marquee.texto && this.marquee.texto.includes('JORNADA 28')) {
      this.marquee.texto = this.marquee.texto.replace(/JORNADA 28/gi, `JORNADA ${this.estado.numeroJornada}`);
    }
    this.canales = getStorage(STORAGE_KEYS.CANALES, INITIAL_CANALES);
    this.boletos = getStorage(STORAGE_KEYS.BOLETOS, INITIAL_BOLETOS);
    this.logs = getStorage(STORAGE_KEYS.LOGS, INITIAL_LOGS);
    this.notifs = getStorage(STORAGE_KEYS.NOTIFS, []);
    this.gasUrl = getStorage(STORAGE_KEYS.GAS_URL, GasBackendService.DEFAULT_GAS_URL);
    this.isRemoteMode = getStorage('trg_v2055_remote_mode', false);

    // Calcular y sincronizar automáticamente las horas de aviso y cierre relativas al primer partido (T)
    const horasTxNum = parseInt(this.estado.horaTx || '12', 10) || 12;
    const horasTyNum = parseInt(this.estado.horaTy || '8', 10) || 8;
    const relesInit = calcularRelesCronologicos(this.partidos, horasTxNum, horasTyNum);
    if (relesInit.fechaHoraTyTexto) {
      this.estado.fechaLimiteTx = `${relesInit.fechaHoraTxTexto} (Aviso T-${horasTxNum}h)`;
      this.estado.fechaLimiteTy = `${relesInit.fechaHoraTyTexto} (Cierre T-${horasTyNum}h)`;
    }
  }

  public isRemote(): boolean {
    return this.isRemoteMode;
  }

  public setRemoteMode(enabled: boolean): void {
    this.isRemoteMode = enabled;
    setStorage('trg_v2055_remote_mode', enabled);
    this.notify();
  }

  public async callGas(action: string, payload: Record<string, any> = {}): Promise<any> {
    try {
      const res = await fetch('/api/gas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          gasUrl: this.gasUrl || GasBackendService.DEFAULT_GAS_URL,
          ...payload,
        }),
      });
      return await res.json();
    } catch (err: any) {
      console.warn('Error llamando al proxy de Google Apps Script:', err);
      return { error: true, mensaje: err.message || 'Error de conexión' };
    }
  }

  public async syncWithRemote(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const resAdmin = await this.callGas('obtenerDatosAdmin');
      if (!resAdmin || resAdmin.error) {
        return {
          success: false,
          message: resAdmin?.mensaje || 'No se pudo obtener respuesta de Google Apps Script.',
        };
      }

      // Si llegaron jugadores desde Google Sheets
      if (Array.isArray(resAdmin.jugadores) && resAdmin.jugadores.length > 0) {
        this.jugadores = resAdmin.jugadores.map((j: any, idx: number) => ({
          id: String(j.id || j.nombre || `TRG-${idx}`),
          nombre: String(j.nombre || ''),
          pin: String(j.pin || '1234'),
          email: String(j.correo || j.email || ''),
          saldoJornadas: Number(j.saldo) || 0,
          activo: String(j.estado || 'ACTIVO').toUpperCase() !== 'INACTIVO',
          totalPuntos: Number(j.puntos) || 0,
          totalAciertos: Number(j.aciertos) || 0,
          jornadasJugadas: Number(j.jornadasJugadas) || 0,
          rol: j.rol || (j.nombre === 'ADMIN' ? 'ADMIN' : 'USER'),
          equipoFavorito: j.avatar || j.equipoFavorito || 'Real Madrid',
        }));
      }

      // Si llegaron partidos desde Google Sheets
      if (Array.isArray(resAdmin.partidos) && resAdmin.partidos.length > 0) {
        this.partidos = resAdmin.partidos.map((p: any, idx: number) => {
          const num = idx + 1;
          const local = p.l || p.local || `Equipo L${num}`;
          const visit = p.v || p.visitante || `Equipo V${num}`;
          const localCrest = getClubCrest(local, p.logoL || p.escudo_l);
          const visitCrest = getClubCrest(visit, p.logoV || p.escudo_v);

          const rawP1 = Number(p.p1);
          const rawPx = Number(p.px);
          const rawP2 = Number(p.p2);

          // Si vienen sin definir, en 0, o con el valor plano de plantilla 33/34/33, se calculan automáticamente
          const isFlat =
            (!rawP1 && !rawP2) ||
            (rawP1 === 33 && rawPx === 34 && rawP2 === 33) ||
            rawP1 + rawPx + rawP2 === 0;

          let p1 = rawP1;
          let px = rawPx;
          let p2 = rawP2;

          if (isFlat && local && visit) {
            const calculated = calculateMatchProbabilities(local, visit);
            p1 = calculated.prob1;
            px = calculated.probX;
            p2 = calculated.prob2;
          }

          return {
            id: num,
            numero: num,
            equipoLocal: local,
            equipoVisitante: visit,
            escudoLocal: p.logoL || p.escudo_l || localCrest.url,
            escudoVisitante: p.logoV || p.escudo_v || visitCrest.url,
            fechaHora: p.f || p.fecha || '',
            resultado: p.resultado || p.res || undefined,
            prob1: p1 || 40,
            probX: px || 32,
            prob2: p2 || 28,
          };
        });
      }

      // Estado de jornada y relés T-X / T-Y (horas antes del primer partido cronológico T)
      if (resAdmin.estado) {
        this.estado.abierta = resAdmin.estado.toUpperCase() === 'ABIERTO';
        this.estado.fase = this.estado.abierta ? 'FASE_1_APERTURA' : 'FASE_2_EN_VIVO';
      }
      if (resAdmin.horasTX !== undefined) {
        this.estado.horaTx = String(resAdmin.horasTX);
      }
      if (resAdmin.horasTY !== undefined) {
        this.estado.horaTy = String(resAdmin.horasTY);
      }

      const txVal = parseInt(this.estado.horaTx || '12', 10) || 12;
      const tyVal = parseInt(this.estado.horaTy || '8', 10) || 8;
      const relesSync = calcularRelesCronologicos(this.partidos, txVal, tyVal);
      if (relesSync.fechaHoraTyTexto) {
        this.estado.fechaLimiteTx = `${relesSync.fechaHoraTxTexto} (Aviso T-${txVal}h)`;
        this.estado.fechaLimiteTy = `${relesSync.fechaHoraTyTexto} (Cierre T-${tyVal}h)`;
      }

      // Marquesina
      if (resAdmin.marquesina) {
        this.marquee = {
          activa: Boolean(resAdmin.marquesina.activa),
          texto: resAdmin.marquesina.texto || this.marquee.texto,
          tipo: 'info',
        };
      }

      this.addLog('INFO', 'SYNC_REMOTO', 'Sincronización con Google Sheets ejecutada con éxito.');
      this.notify();
      return { success: true, message: 'Datos sincronizados exitosamente con Google Sheets.', data: resAdmin };
    } catch (err: any) {
      return { success: false, message: err.message || 'Fallo al sincronizar con Google Sheets.' };
    }
  }

  public static getInstance(): GasBackendService {
    if (!GasBackendService.instance) {
      GasBackendService.instance = new GasBackendService();
    }
    return GasBackendService.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    setStorage(STORAGE_KEYS.JUGADORES, this.jugadores);
    setStorage(STORAGE_KEYS.PARTIDOS, this.partidos);
    setStorage(STORAGE_KEYS.ESTADO, this.estado);
    setStorage(STORAGE_KEYS.MARQUEE, this.marquee);
    setStorage(STORAGE_KEYS.CANALES, this.canales);
    setStorage(STORAGE_KEYS.BOLETOS, this.boletos);
    setStorage(STORAGE_KEYS.LOGS, this.logs);
    setStorage(STORAGE_KEYS.NOTIFS, this.notifs);
    setStorage(STORAGE_KEYS.GAS_URL, this.gasUrl);

    this.listeners.forEach(fn => fn());
  }

  // Getters
  public getJugadores(): Jugador[] {
    return [...this.jugadores];
  }

  public getActivos(): Jugador[] {
    return this.jugadores.filter(j => j.activo);
  }

  public getPartidos(): Partido[] {
    return [...this.partidos];
  }

  public getEstado(): EstadoJornada {
    return { ...this.estado };
  }

  public getMarquee(): MarqueeConfig {
    return { ...this.marquee };
  }

  public getCanales(): CanalTV[] {
    return [...this.canales];
  }

  public getBoletos(jugadorId?: string): QuinielaBoleto[] {
    if (jugadorId) {
      return this.boletos.filter(b => b.jugadorId === jugadorId);
    }
    return [...this.boletos];
  }

  public getLogs(): LogSistema[] {
    return [...this.logs];
  }

  public getNotifs(): NotificacionPush[] {
    return [...this.notifs];
  }

  public getGasUrl(): string {
    return this.gasUrl;
  }

  public setGasUrl(url: string): void {
    this.gasUrl = url.trim();
    this.notify();
  }

  // Log helper
  public addLog(nivel: LogSistema['nivel'], accion: string, detalles: string): void {
    const entry: LogSistema = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      nivel,
      accion,
      detalles,
    };
    this.logs.unshift(entry);
    if (this.logs.length > 50) this.logs.pop();
    this.notify();
  }

  // Sellar Quiniela
  public sellarQuiniela(params: {
    jugadorId: string;
    pin: string;
    columna1: Record<number, '1' | 'X' | '2'>;
    columna2?: Record<number, '1' | 'X' | '2'>;
    pleno15: { local: '0' | '1' | '2' | 'M'; visitante: '0' | '1' | '2' | 'M' };
  }): { success: boolean; message: string; boleto?: QuinielaBoleto; saldoRestante?: number } {
    const jugador = this.jugadores.find(j => j.id === params.jugadorId);
    if (!jugador) {
      return { success: false, message: 'Usuario no encontrado en la base de datos de JUGADORES.' };
    }

    if (!jugador.activo) {
      return { success: false, message: 'La cuenta del usuario se encuentra inactiva. Contacta al Administrador.' };
    }

    if (jugador.pin !== params.pin) {
      return { success: false, message: 'PIN de seguridad incorrecto. Verificación fallida.' };
    }

    // Comprobación de Relé T-Y (Cierre inapelable Y horas antes del primer partido T)
    const horasTxNum = parseInt(this.estado.horaTx || '12', 10) || 12;
    const horasTyNum = parseInt(this.estado.horaTy || '8', 10) || 8;
    const reles = calcularRelesCronologicos(this.partidos, horasTxNum, horasTyNum);

    if (!this.estado.abierta || reles.plazoCerradoPorTy) {
      if (this.estado.abierta && reles.plazoCerradoPorTy) {
        this.estado.abierta = false;
        this.estado.fase = 'FASE_2_EN_VIVO';
        this.notify();
      }
      return {
        success: false,
        message: `⛔ El plazo para el envío de apuestas ha finalizado (Relé T-Y activo: cerrado ${horasTyNum}h antes del primer partido ${reles.primerPartidoTexto}).`,
      };
    }

    if (jugador.saldoJornadas <= 0) {
      return {
        success: false,
        message: '⚠️ Saldo agotado (0 jornadas restantes). Debes recargar tu saldo con el administrador para sellar el boleto.'
      };
    }

    // Validar partidos 1..14 completos en columna 1
    for (let i = 1; i <= 14; i++) {
      if (!params.columna1[i]) {
        return { success: false, message: `Falta completar el pronóstico del partido #${i} en la Columna 1.` };
      }
    }

    // Validar pleno al 15
    if (!params.pleno15.local || !params.pleno15.visitante) {
      return { success: false, message: 'Debes seleccionar los goles de ambos equipos para el Pleno al 15.' };
    }

    // Deducción de saldo
    jugador.saldoJornadas -= 1;

    // Generación de resguardo
    const codAleatorio = Math.floor(10000 + Math.random() * 90000);
    const codigoResguardo = `TRG-J${this.estado.numeroJornada}-${codAleatorio}`;
    const now = new Date();
    const fechaSellado = now.toLocaleDateString('es-ES') + ' ' + now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const nuevoBoleto: QuinielaBoleto = {
      id: `BOL-J${this.estado.numeroJornada}-${Date.now()}`,
      jornada: this.estado.numeroJornada,
      jugadorId: jugador.id,
      jugadorNombre: jugador.nombre,
      fechaSellado,
      codigoResguardo,
      columna1: { ...params.columna1 },
      columna2: params.columna2 ? { ...params.columna2 } : undefined,
      pleno15: { ...params.pleno15 },
      escrutada: false,
    };

    this.boletos.unshift(nuevoBoleto);

    // Preparar formato de pronósticos 14+1 para Google Apps Script
    const apuestasParaGas: string[] = [];
    for (let i = 1; i <= 14; i++) {
      const c1 = params.columna1[i] || '-';
      const c2 = params.columna2 ? params.columna2[i] || '-' : c1;
      apuestasParaGas.push(`${c1}${c2}`);
    }
    apuestasParaGas.push(`${params.pleno15.local}${params.pleno15.visitante}`);

    // Disparar guardado en Google Sheets a través del proxy sin bloquear la UI
    this.callGas('guardarApuesta', {
      usuario: jugador.nombre,
      apuestas: apuestasParaGas,
    }).catch(e => {
      console.warn('Registro en Google Sheets asíncrono:', e);
    });

    // Sistema de Alerta de Saldo
    let alertaSaldoMsg = '';
    if (jugador.saldoJornadas === 1) {
      alertaSaldoMsg = ' ⚠️ ¡Aviso! Te queda solo 1 jornada de saldo.';
      this.addLog('AVISO', 'AlertaSaldo', `Aviso enviado a ${jugador.nombre}: le queda 1 jornada.`);
    } else if (jugador.saldoJornadas === 0) {
      alertaSaldoMsg = ' 🚨 ¡Atención! Tu saldo ha quedado en 0 jornadas.';
      this.addLog('AVISO', 'AlertaSaldo', `Saldo agotado para ${jugador.nombre}.`);
    }

    this.addLog('INFO', 'SellarQuiniela', `Boleto ${codigoResguardo} sellado con éxito por ${jugador.nombre}. Saldo: ${jugador.saldoJornadas}.`);
    this.notify();

    return {
      success: true,
      message: `¡Boleto sellado correctamente! Código: ${codigoResguardo}.${alertaSaldoMsg}`,
      boleto: nuevoBoleto,
      saldoRestante: jugador.saldoJornadas,
    };
  }

  // Actualizar partidos
  public actualizarPartidos(partidos: Partido[]): void {
    this.partidos = partidos.map(p => {
      const localCrest = getClubCrest(p.equipoLocal, p.escudoLocal);
      const visitCrest = getClubCrest(p.equipoVisitante, p.escudoVisitante);
      return {
        ...p,
        escudoLocal: p.escudoLocal || localCrest.url,
        escudoVisitante: p.escudoVisitante || visitCrest.url,
      };
    });

    // Recalcular relés en base a las nuevas fechas u horarios de partidos
    const horasTxNum = parseInt(this.estado.horaTx || '12', 10) || 12;
    const horasTyNum = parseInt(this.estado.horaTy || '8', 10) || 8;
    const reles = calcularRelesCronologicos(this.partidos, horasTxNum, horasTyNum);
    if (reles.fechaHoraTyTexto) {
      this.estado.fechaLimiteTx = `${reles.fechaHoraTxTexto} (Aviso T-${horasTxNum}h)`;
      this.estado.fechaLimiteTy = `${reles.fechaHoraTyTexto} (Cierre T-${horasTyNum}h)`;
    }

    this.addLog('INFO', 'EditorPartidos', `Actualizados ${partidos.length} partidos de la jornada.`);
    this.notify();
  }

  // Importar JSON masivo (Fase 1)
  public importarPartidosJson(jsonString: string): { success: boolean; message: string; count?: number } {
    try {
      // Limpieza de caracteres invisibles y comillas tipográficas
      const cleaned = jsonString
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      let partidosArray: any[] = [];
      let jornadaDetectada: number | undefined = undefined;

      if (Array.isArray(parsed)) {
        partidosArray = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.partidos)) {
          partidosArray = parsed.partidos;
        }
        if (typeof parsed.numeroJornada === 'number' && parsed.numeroJornada > 0) {
          jornadaDetectada = parsed.numeroJornada;
        }
      }

      if (partidosArray.length < 15) {
        return {
          success: false,
          message: `El JSON debe contener al menos 15 partidos (14 principales + Pleno al 15). Se recibieron ${partidosArray.length}.`,
        };
      }

      if (jornadaDetectada) {
        this.estado.numeroJornada = jornadaDetectada;
        this.marquee.texto = `⚽ ¡JORNADA ${jornadaDetectada} ABIERTA! Plazo hasta el sábado para sellar tu boleto.`;
      }

      const nuevos: Partido[] = partidosArray.slice(0, 15).map((item, index) => {
        const num = index + 1;
        const local = item.local || item.equipoLocal || `Equipo L${num}`;
        const visitante = item.visitante || item.equipoVisitante || `Equipo V${num}`;
        const localCrest = getClubCrest(local, item.escudoLocal);
        const visitCrest = getClubCrest(visitante, item.escudoVisitante);

        return {
          id: num,
          numero: num,
          equipoLocal: local,
          equipoVisitante: visitante,
          escudoLocal: item.escudoLocal || localCrest.url,
          escudoVisitante: item.escudoVisitante || visitCrest.url,
          fechaHora: item.fechaHora || item.fecha || 'Horario por confirmar',
          canalTv: item.canalTv || item.canal || 'Directo TV',
          prob1: Number(item.prob1) || 45,
          probX: Number(item.probX) || 30,
          prob2: Number(item.prob2) || 25,
          resultado: item.resultado || undefined,
          golesLocal: item.golesLocal || undefined,
          golesVisitante: item.golesVisitante || undefined,
        };
      });

      this.partidos = nuevos;
      this.addLog('INFO', 'ImportacionJSON', `Importados con éxito los 15 partidos de la jornada con escudos generados.`);
      this.notify();
      return { success: true, message: '¡15 partidos importados correctamente!', count: 15 };
    } catch (e: any) {
      return { success: false, message: `Error de sintaxis en el JSON: ${e?.message || 'Revisa el formato'}` };
    }
  }

  // Control de Fases
  public cambiarFase(fase: FaseJornada): void {
    this.estado.fase = fase;
    if (fase === 'FASE_1_APERTURA') {
      this.estado.abierta = true;
      this.estado.releForzadoTy = false;
      this.marquee.activa = true;
      this.marquee.texto = `⚽ ¡JORNADA ${this.estado.numeroJornada} ABIERTA! Plazo hasta el sábado para sellar tu boleto.`;
      this.marquee.tipo = 'warning';
      this.addLog('INFO', 'Fase1_Apertura', `Jornada ${this.estado.numeroJornada} abierta para apuestas.`);
    } else if (fase === 'FASE_2_EN_VIVO') {
      this.estado.abierta = false;
      this.marquee.activa = true;
      this.marquee.texto = `🔴 JORNADA ${this.estado.numeroJornada} EN VIVO: Partidos en juego. ¡Sigue los directos en la pestaña TV!`;
      this.marquee.tipo = 'urgent';
      this.addLog('CIERRE', 'Fase2_EnVivo', `Jornada ${this.estado.numeroJornada} en juego. Sellado cerrado.`);
    } else if (fase === 'FASE_3_CIERRE') {
      this.estado.abierta = false;
      this.marquee.activa = true;
      this.marquee.texto = `🏆 JORNADA ${this.estado.numeroJornada} CONCLUIDA: Escrutinio completado y ranking actualizado.`;
      this.marquee.tipo = 'success';
      this.addLog('INFO', 'Fase3_Cierre', `Jornada ${this.estado.numeroJornada} cerrada y escrutada.`);
    }
    this.notify();
  }

  // Forzar Cierre T-Y de Emergencia
  public forzarCierreTy(): void {
    this.estado.abierta = false;
    this.estado.releForzadoTy = true;
    this.estado.fase = 'FASE_2_EN_VIVO';
    this.marquee.texto = `⚠️ CIERRE FORZADO (Relé T-Y): El plazo de sellado ha concluido inmediatamente.`;
    this.marquee.tipo = 'urgent';
    this.addLog('CIERRE', 'ReléTY_Forzado', 'El Administrador ha ejecutado el cierre forzado inmediato de plazos.');
    this.notify();
  }

  // Escrutinio Matemático (Fase 3)
  public escrutarJornada(): { success: boolean; message: string; informe: string } {
    // Validar que todos los partidos tengan resultado
    const sinResultado = this.partidos.filter(p => {
      if (p.numero <= 14) return !p.resultado;
      return !p.golesLocal || !p.golesVisitante;
    });

    if (sinResultado.length > 0) {
      return {
        success: false,
        message: `Faltan resultados por registrar en ${sinResultado.length} partido(s): [${sinResultado.map(p => `#${p.numero}`).join(', ')}].`,
        informe: '',
      };
    }

    const pleno15Real = {
      local: this.partidos[14].golesLocal!,
      visitante: this.partidos[14].golesVisitante!,
    };

    let totalBoletosJornada = 0;
    const tablaResultadosJugadores: Array<{
      jugador: string;
      aciertosCol1: number;
      aciertosCol2: number;
      maxAciertos: number;
      plenoOk: boolean;
      puntosGanados: number;
    }> = [];

    this.boletos.forEach(boleto => {
      if (boleto.jornada !== this.estado.numeroJornada) return;
      totalBoletosJornada++;

      let aciertosCol1 = 0;
      let aciertosCol2 = 0;

      for (let i = 1; i <= 14; i++) {
        const resultadoReal = this.partidos[i - 1].resultado;
        if (boleto.columna1[i] === resultadoReal) aciertosCol1++;
        if (boleto.columna2 && boleto.columna2[i] === resultadoReal) aciertosCol2++;
      }

      const plenoOk =
        boleto.pleno15.local === pleno15Real.local &&
        boleto.pleno15.visitante === pleno15Real.visitante;

      const maxAciertos = Math.max(aciertosCol1, aciertosCol2);
      const puntosGanados = maxAciertos + (plenoOk ? 1 : 0);

      boleto.escrutada = true;
      boleto.aciertosCol1 = aciertosCol1;
      boleto.aciertosCol2 = aciertosCol2;
      boleto.aciertoPleno15 = plenoOk;
      boleto.maxAciertos = maxAciertos;
      boleto.puntosGanados = puntosGanados;

      // Actualizar estadísticas del jugador
      const jugador = this.jugadores.find(j => j.id === boleto.jugadorId);
      if (jugador) {
        jugador.totalPuntos += puntosGanados;
        jugador.totalAciertos += maxAciertos;
        jugador.jornadasJugadas += 1;
      }

      tablaResultadosJugadores.push({
        jugador: boleto.jugadorNombre,
        aciertosCol1,
        aciertosCol2,
        maxAciertos,
        plenoOk,
        puntosGanados,
      });
    });

    // Ordenar tabla de escrutinio
    tablaResultadosJugadores.sort((a, b) => b.puntosGanados - a.puntosGanados);

    // Cambiar fase a Fase 3
    this.estado.fase = 'FASE_3_CIERRE';
    this.estado.abierta = false;

    const informe = `📊 INFORME OFICIAL DE ESCRUTINIO - JORNADA ${this.estado.numeroJornada}\n` +
      `------------------------------------------------------------\n` +
      `Total de boletos procesados: ${totalBoletosJornada}\n\n` +
      `CLASIFICACIÓN DE LA JORNADA:\n` +
      tablaResultadosJugadores.map((r, i) => `${i + 1}º ${r.jugador}: ${r.maxAciertos}/14 aciertos ${r.plenoOk ? '🏆 [PLENO AL 15 ACERTADO!]' : ''} -> +${r.puntosGanados} pts`).join('\n');

    this.addLog('INFO', 'EscrutinioMatematico', `Escrutinio completado para ${totalBoletosJornada} boletos de la Jornada ${this.estado.numeroJornada}.`);
    this.notify();

    return {
      success: true,
      message: `¡Escrutinio completado! Se han procesado ${totalBoletosJornada} quinielas y se han sumado los puntos.`,
      informe,
    };
  }

  // Gestión de Usuarios y Saldos
  public recargarSaldo(jugadorId: string, cantidad: number): void {
    const jugador = this.jugadores.find(j => j.id === jugadorId);
    if (jugador) {
      jugador.saldoJornadas += cantidad;
      this.addLog('INFO', 'RecargaSaldo', `Recargadas +${cantidad} jornadas a ${jugador.nombre}. Saldo actual: ${jugador.saldoJornadas}.`);
      this.notify();
    }
  }

  public recargarSaldoMasivo(cantidad: number): void {
    this.jugadores.forEach(j => {
      if (j.activo) {
        j.saldoJornadas += cantidad;
      }
    });
    this.addLog('INFO', 'RecargaMasiva', `Recargadas +${cantidad} jornadas a todos los jugadores activos.`);
    this.notify();
  }

  public crearJugador(nuevo: Omit<Jugador, 'id'>): Jugador {
    const nextIdNum = this.jugadores.length + 1;
    const id = `TRG-${String(nextIdNum).padStart(3, '0')}`;
    const colores = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#e11d48'];
    const avatarColor = colores[nextIdNum % colores.length];

    const jugador: Jugador = {
      id,
      ...nuevo,
      avatarColor,
    };
    this.jugadores.push(jugador);
    this.addLog('INFO', 'CrearJugador', `Nuevo usuario registrado: ${jugador.nombre} (${jugador.id}).`);
    this.notify();
    return jugador;
  }

  public actualizarJugador(jugador: Jugador): void {
    const idx = this.jugadores.findIndex(j => j.id === jugador.id);
    if (idx !== -1) {
      this.jugadores[idx] = { ...jugador };
      this.addLog('INFO', 'EditarJugador', `Datos actualizados para ${jugador.nombre}.`);
      this.notify();
    }
  }

  // Marquesina
  public actualizarMarquesina(config: MarqueeConfig): void {
    this.marquee = { ...config };
    this.addLog('INFO', 'Marquesina', `Marquesina actualizada: "${config.texto.slice(0, 40)}..." (Activa: ${config.activa})`);
    this.notify();
  }

  // Megáfono Push
  public enviarMegafonoPush(notif: { titulo: string; mensaje: string; destinatario: 'TODOS' | string }): void {
    const nueva: NotificacionPush = {
      id: `push-${Date.now()}`,
      titulo: notif.titulo,
      mensaje: notif.mensaje,
      fecha: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      destinatario: notif.destinatario,
      prioridad: 'alta',
    };
    this.notifs.unshift(nueva);

    // Si el navegador soporta Notification API y tiene permisos, dispararla
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notif.titulo, {
          body: notif.mensaje,
          icon: '/icon-192.png',
        });
      } catch (e) {
        console.warn('Native notification suppressed in frame', e);
      }
    }

    this.addLog('INFO', 'MegafonoPush', `Push enviado a ${notif.destinatario}: "${notif.titulo}"`);
    this.notify();
  }

  // Preaviso Relé T-X: Envío masivo de recordatorio a los jugadores rezagados
  public ejecutarAvisoRezagadosTx(): { enviados: number; rezagados: string[] } {
    const horasTxNum = parseInt(this.estado.horaTx || '12', 10) || 12;
    const horasTyNum = parseInt(this.estado.horaTy || '8', 10) || 8;
    const reles = calcularRelesCronologicos(this.partidos, horasTxNum, horasTyNum);

    // Obtener jugadores activos que aún NO han sellado su quiniela
    const rezagados = this.jugadores.filter(j => {
      if (!j.activo) return false;
      const yaSello = this.boletos.some(b => b.jornada === this.estado.numeroJornada && b.jugadorId === j.id);
      return !yaSello;
    });

    const nombres = rezagados.map(r => r.nombre);

    // Notificación Push de Aviso Previo
    this.enviarMegafonoPush({
      titulo: `⚠️ ¡Aviso Previo Jornada ${this.estado.numeroJornada} (Relé T-X)!`,
      mensaje: `Quedan pocas horas para el cierre definitivo (${horasTyNum}h antes de ${reles.primerPartido?.equipoLocal || 'primer partido'}). Si aún no has sellado tu quiniela, hazlo antes del límite previsto a las ${reles.fechaHoraTyTexto}.`,
      destinatario: 'TODOS',
    });

    this.addLog(
      'AVISO',
      'ReléT-X_Rezagados',
      `Aviso Relé T-X ejecutado (${horasTxNum}h antes de T). Recordatorio emitido a ${rezagados.length} jugadores pendientes: ${nombres.slice(0, 4).join(', ')}${nombres.length > 4 ? ` y ${nombres.length - 4} más` : ''}.`
    );

    this.notify();
    return { enviados: rezagados.length, rezagados: nombres };
  }

  // Cierre Relé T-Y: Bloqueo de apuestas y generación/envío de archivo oficial EduLosilla a Telegram
  public ejecutarCierreApuestasTy(botToken?: string, chatId?: string): {
    boletosSellados: number;
    resultadoEdu: ResultadoExportacionEduLosilla;
  } {
    const horasTxNum = parseInt(this.estado.horaTx || '12', 10) || 12;
    const horasTyNum = parseInt(this.estado.horaTy || '8', 10) || 8;
    const reles = calcularRelesCronologicos(this.partidos, horasTxNum, horasTyNum);

    this.estado.abierta = false;
    this.estado.fase = 'FASE_2_EN_VIVO';
    this.estado.ultimoCierreTy = new Date().toISOString().split('T')[0];

    const boletosSellados = this.boletos.filter(b => b.jornada === this.estado.numeroJornada).length;

    // Generar inmediatamente el archivo oficial EduLosilla (16 caracteres/apuesta: 14 signos + 2 Pleno 15)
    const resultadoEdu = this.generarArchivoEduLosilla();
    this.estado.archivoEduLosillaGenerado = true;
    this.estado.ultimoArchivoEduLosillaTxt = resultadoEdu.contenidoTxt;
    this.estado.totalApuestasEduLosilla = resultadoEdu.totalLineas;
    this.estado.fechaEnvioEduLosilla = new Date().toISOString();

    // Despacho automático al Bot de Telegram para que el admin tenga tiempo de sellarlo antes de la hora T
    const token = (botToken || this.estado.telegramBotToken || '').trim();
    const targetChat = (chatId || this.estado.telegramChatId || '').trim();

    enviarArchivoEduLosillaATelegram({
      contenidoTxt: resultadoEdu.contenidoTxt,
      nombreArchivo: resultadoEdu.nombreArchivo,
      jornada: this.estado.numeroJornada,
      totalApuestas: resultadoEdu.totalLineas,
      botToken: token,
      chatId: targetChat,
    })
      .then(res => {
        this.estado.telegramEnvioExitoso = res.success;
        this.estado.telegramUltimoMensaje = res.mensaje;
        this.addLog(
          res.success ? 'INFO' : 'AVISO',
          'Telegram_EduLosilla_TY',
          `Despacho a Telegram en cierre T-Y: ${res.mensaje}`
        );
        this.notify();
      })
      .catch(err => {
        this.estado.telegramEnvioExitoso = false;
        this.estado.telegramUltimoMensaje = err.message || 'Error conectando con Telegram';
        this.notify();
      });

    // Notificación Push de Cierre y Despacho a Telegram
    this.enviarMegafonoPush({
      titulo: `🔒 ¡Plazo Cerrado (Relé T-Y) y EduLosilla a Telegram!`,
      mensaje: `Ha concluido el plazo para enviar pronósticos de la Jornada ${this.estado.numeroJornada} (${horasTyNum}h antes de T). Archivo oficial EduLosilla con ${resultadoEdu.totalLineas} apuestas enviado a Telegram para sellar en EduLosilla antes del inicio del primer partido.`,
      destinatario: 'TODOS',
    });

    this.addLog(
      'CIERRE',
      'ReléT-Y_Cierre',
      `Cierre definitivo Relé T-Y (${horasTyNum}h antes de T). Plazo cerrado (${boletosSellados} boletos). Archivo TXT EduLosilla (${resultadoEdu.totalLineas} apuestas) despachado al Bot de Telegram.`
    );

    this.notify();
    return { boletosSellados, resultadoEdu };
  }

  // Generar Archivo TXT Formato EduLosilla Oficial (16 caracteres por apuesta)
  public generarArchivoEduLosilla(): ResultadoExportacionEduLosilla {
    return generarArchivoTxtEduLosilla(this.boletos, this.estado.numeroJornada);
  }

  // Envío manual o directo de archivo EduLosilla a Telegram
  public async enviarEduLosillaATelegramDirecto(botToken?: string, chatId?: string): Promise<{
    success: boolean;
    mensaje: string;
    resultado: ResultadoExportacionEduLosilla;
    telegramResult: any;
  }> {
    const resultado = this.generarArchivoEduLosilla();

    this.estado.archivoEduLosillaGenerado = true;
    this.estado.ultimoArchivoEduLosillaTxt = resultado.contenidoTxt;
    this.estado.totalApuestasEduLosilla = resultado.totalLineas;
    this.estado.fechaEnvioEduLosilla = new Date().toISOString();

    if (botToken) this.estado.telegramBotToken = botToken;
    if (chatId) this.estado.telegramChatId = chatId;

    const telegramRes = await enviarArchivoEduLosillaATelegram({
      contenidoTxt: resultado.contenidoTxt,
      nombreArchivo: resultado.nombreArchivo,
      jornada: this.estado.numeroJornada,
      totalApuestas: resultado.totalLineas,
      botToken: botToken || this.estado.telegramBotToken,
      chatId: chatId || this.estado.telegramChatId,
    });

    this.estado.telegramEnvioExitoso = telegramRes.success;
    this.estado.telegramUltimoMensaje = telegramRes.mensaje;

    this.addLog(
      telegramRes.success ? 'INFO' : 'AVISO',
      'EduLosilla_Telegram_Manual',
      `Envío de archivo EduLosilla a Telegram: ${telegramRes.mensaje}`
    );

    this.notify();
    return {
      success: telegramRes.success,
      mensaje: telegramRes.mensaje,
      resultado,
      telegramResult: telegramRes,
    };
  }

  // Alias compatible para exportación EduLosilla
  public ejecutarExportacionEduLosillaPostT(forzarManual: boolean = false): {
    success: boolean;
    mensaje: string;
    resultado: ResultadoExportacionEduLosilla;
  } {
    const res = this.ejecutarCierreApuestasTy();
    return {
      success: true,
      mensaje: `Archivo EduLosilla generado y despachado al cerrar el plazo (${res.resultadoEdu.totalLineas} apuestas).`,
      resultado: res.resultadoEdu,
    };
  }

  // Motor Autómata de Tiempos (Anti-Spam)
  public ejecutarMotorAutomataTiempos(): { mensaje: string; accionEjecutada: string } {
    const now = new Date();
    const hoyStr = now.toISOString().split('T')[0];
    const horasTxNum = parseInt(this.estado.horaTx || '12', 10) || 12;
    const horasTyNum = parseInt(this.estado.horaTy || '8', 10) || 8;

    const reles = calcularRelesCronologicos(this.partidos, horasTxNum, horasTyNum);

    let accion = 'Sin acción requerida (Condiciones horarias no cumplidas)';

    // 1. Comprobación de Aviso T-X (X horas antes del primer partido T)
    if (reles.fechaHoraTx && now.getTime() >= reles.fechaHoraTx.getTime() && this.estado.ultimoAvisoTx !== hoyStr) {
      this.estado.ultimoAvisoTx = hoyStr;
      const resAviso = this.ejecutarAvisoRezagadosTx();
      accion = `Relé T-X activado: Preaviso enviado a ${resAviso.enviados} rezagados (${horasTxNum}h antes de T).`;
    }

    // 2. Comprobación de Cierre Inapelable T-Y (Y horas antes del primer partido T)
    // Se ejecuta al cerrar el periodo de apuestas para enviar el archivo al Bot de Telegram
    // y tener tiempo para sellarlo en EduLosilla antes de la hora T.
    if (reles.fechaHoraTy && now.getTime() >= reles.fechaHoraTy.getTime()) {
      if (this.estado.abierta) {
        this.estado.ultimoCierreTy = hoyStr;
        const resCierre = this.ejecutarCierreApuestasTy();
        accion = `Relé T-Y activado: Plazo cerrado a ${horasTyNum}h de T. Registrados ${resCierre.boletosSellados} boletos y archivo EduLosilla enviado al bot de Telegram para sellar antes de la hora T.`;
      }
    }

    this.notify();
    return {
      mensaje: 'Motor autómata de tiempos evaluado correctamente según el primer partido cronológico (T).',
      accionEjecutada: accion,
    };
  }

  // Convenience Aliases for UI Components
  public getEstadoJornada(): EstadoJornada {
    return this.getEstado();
  }

  public getMarquesina(): MarqueeConfig {
    return this.getMarquee();
  }

  public savePartidos(partidos: Partido[]): void {
    this.actualizarPartidos(partidos);
  }

  public saveMarquesina(config: MarqueeConfig): void {
    this.actualizarMarquesina(config);
  }

  public saveCanales(newCanales: CanalTV[]): void {
    this.canales = [...newCanales];
    this.addLog('INFO', 'CanalesTV', `Actualizados ${newCanales.length} canales directos.`);
    this.notify();
  }

  public saveRelays(horaTx: string, horaTy: string): void {
    const horasTxNum = parseInt(horaTx, 10) || 12;
    const horasTyNum = parseInt(horaTy, 10) || 8;
    this.estado.horaTx = String(horasTxNum);
    this.estado.horaTy = String(horasTyNum);

    const reles = calcularRelesCronologicos(this.partidos, horasTxNum, horasTyNum);
    this.estado.fechaLimiteTx = `${reles.fechaHoraTxTexto} (Aviso T-${horasTxNum}h)`;
    this.estado.fechaLimiteTy = `${reles.fechaHoraTyTexto} (Cierre T-${horasTyNum}h)`;

    if (reles.plazoCerradoPorTy && this.estado.abierta) {
      this.estado.abierta = false;
      this.estado.fase = 'FASE_2_EN_VIVO';
    }

    this.addLog(
      'INFO',
      'ConfiguracionRelés',
      `Relés calculados respecto a T (${reles.primerPartidoTexto}): Preaviso T-${horasTxNum}h (${reles.fechaHoraTxTexto}) y Cierre T-${horasTyNum}h (${reles.fechaHoraTyTexto}).`
    );
    this.notify();
  }

  public setFaseJornada(fase: FaseJornada): void {
    this.cambiarFase(fase);
  }

  public ejecutarEscrutinioMatematico(): { success: boolean; message: string; informe: string } {
    return this.escrutarJornada();
  }

  public ejecutarResetNuclearTemporada(): void {
    this.resetNuclearTemporada();
  }

  public updateJugador(jugador: Jugador): void {
    this.actualizarJugador(jugador);
  }

  public addJugador(nuevo: Omit<Jugador, 'totalPuntos' | 'totalAciertos' | 'jornadasJugadas'>): Jugador {
    return this.crearJugador({
      ...nuevo,
      totalPuntos: 0,
      totalAciertos: 0,
      jornadasJugadas: 0,
    } as any);
  }

  public addPushNotification(notif: { titulo: string; mensaje: string; destinatario?: string; [key: string]: any }): void {
    this.enviarMegafonoPush({
      titulo: notif.titulo,
      mensaje: notif.mensaje,
      destinatario: (notif.destinatario as any) || 'TODOS',
    });
  }

  public clearLogs(): void {
    this.logs = [];
    this.notify();
  }

  public getApiUrl(): string {
    return this.getGasUrl();
  }

  public setApiUrl(url: string): void {
    this.setGasUrl(url);
  }

  public sellarBoleto(
    jugadorId: string,
    columna1: Record<number, '1' | 'X' | '2'>,
    columna2?: Record<number, '1' | 'X' | '2'>,
    pleno15?: { local: '0' | '1' | '2' | 'M'; visitante: '0' | '1' | '2' | 'M' }
  ) {
    const jugador = this.jugadores.find(j => j.id === jugadorId);
    if (!jugador) {
      return { success: false, message: 'Jugador no encontrado.' };
    }
    return this.sellarQuiniela({
      jugadorId,
      pin: jugador.pin,
      columna1,
      columna2,
      pleno15: pleno15 || { local: '0', visitante: '0' },
    });
  }

  // Reset Nuclear de Temporada
  public resetNuclearTemporada(): void {
    this.jugadores.forEach(j => {
      j.saldoJornadas = 0;
      j.totalPuntos = 0;
      j.totalAciertos = 0;
      j.jornadasJugadas = 0;
    });
    this.boletos = [];
    this.estado.numeroJornada = 1;
    this.estado.fase = 'FASE_1_APERTURA';
    this.estado.abierta = true;
    this.estado.releForzadoTy = false;
    this.addLog('ERROR', 'RESET_NUCLEAR', 'Se ha ejecutado el RESET NUCLEAR DE TEMPORADA. Todos los saldos y estadísticas han sido reseteados a 0.');
    this.notify();
  }

  // Código oficial de Google Apps Script (.gs) para Google Sheets
  public getCodigoGoogleAppsScript(): string {
    return `/**
 * ====================================================================
 * APP TR - VERSIÓN 20.57 MASTER
 * Backend centralizado para Google Apps Script & Google Sheets
 * ====================================================================
 * Hojas requeridas en el archivo de cálculo:
 * 1. JUGADORES  (ID, NOMBRE, PIN, EMAIL, SALDO, ACTIVO, PUNTOS, ACIERTOS)
 * 2. PARTIDOS   (NUM, LOCAL, VISITANTE, FECHA, CANAL, PROB1, PROBX, PROB2, RES_REAL)
 * 3. QUINIELAS  (ID_RESGUARDO, JORNADA, JUGADOR_ID, FECHA, C1_P1..C1_P14, PLENO, ACIERTOS)
 * 4. LOGS       (TIMESTAMP, NIVEL, ACCION, DETALLES)
 * ====================================================================
 */

const CONFIG = {
  NOMBRE_LIGA: "App TR",
  VERSION: "20.57 Master",
  HORA_AVISO_TX: 20, // Viernes 20:00
  HORA_CIERRE_TY: 13.5, // Sábado 13:30
  TELEGRAM_BOT_TOKEN: "TU_TELEGRAM_BOT_TOKEN",
  TELEGRAM_CHAT_ID: "TU_TELEGRAM_CHAT_ID",
  FCM_SERVER_KEY: "TU_FIREBASE_FCM_SERVER_KEY"
};

/**
 * Enrutador REST principal (doPost)
 * Limpia comillas tipográficas y caracteres invisibles
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return respuestaJSON({ success: false, error: "Cuerpo de solicitud vacío" });
    }

    // Limpieza de caracteres invisibles y comillas tipográficas
    var rawText = e.postData.contents
      .replace(/[\\u201C\\u201D\\u201E\\u201F\\u2033\\u2036]/g, '"')
      .replace(/[\\u2018\\u2019\\u201A\\u201B\\u2032\\u2035]/g, "'")
      .replace(/[\\u200B-\\u200D\\uFEFF]/g, "")
      .trim();

    var payload = JSON.parse(rawText);
    var action = payload.action;

    switch (action) {
      case "getInitialData":
        return respuestaJSON(obtenerDatosIniciales());

      case "sellarQuiniela":
        return respuestaJSON(procesarSellado(payload));

      case "escrutarJornada":
        return respuestaJSON(ejecutarEscrutinio(payload));

      case "recargarSaldo":
        return respuestaJSON(procesarRecargaSaldo(payload));

      case "actualizarMarquesina":
        return respuestaJSON(guardarMarquesina(payload));

      case "enviarMegafonoPush":
        return respuestaJSON(dispararPush(payload));

      case "resetNuclear":
        return respuestaJSON(ejecutarResetNuclear(payload));

      case "exportarEduLosillaPostT":
        return respuestaJSON(generarTxtEduLosilla(payload));

      default:
        return respuestaJSON({ success: false, error: "Acción no reconocida: " + action });
    }
  } catch (err) {
    registrarLog("ERROR", "doPost", err.toString());
    return respuestaJSON({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Procesa el sellado de quiniela, valida PIN, descuenta saldo y envía email HTML
 */
function procesarSellado(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetJugadores = ss.getSheetByName("JUGADORES");
  var sheetQuinielas = ss.getSheetByName("QUINIELAS");

  var jugadorId = payload.jugadorId;
  var pin = String(payload.pin);

  var dataJug = sheetJugadores.getDataRange().getValues();
  var filaJugador = -1;
  var jugador = null;

  for (var i = 1; i < dataJug.length; i++) {
    if (String(dataJug[i][0]) === jugadorId) {
      filaJugador = i + 1;
      jugador = {
        id: dataJug[i][0],
        nombre: dataJug[i][1],
        pin: String(dataJug[i][2]),
        email: dataJug[i][3],
        saldo: Number(dataJug[i][4]) || 0,
        activo: dataJug[i][5] === true || String(dataJug[i][5]).toUpperCase() === "SI"
      };
      break;
    }
  }

  if (!jugador) throw new Error("Jugador no encontrado");
  if (!jugador.activo) throw new Error("Jugador inactivo");
  if (jugador.pin !== pin) throw new Error("PIN de seguridad incorrecto");
  if (jugador.saldo <= 0) throw new Error("Saldo de jornadas insuficiente");

  // Descontar saldo
  var nuevoSaldo = jugador.saldo - 1;
  sheetJugadores.getRange(filaJugador, 5).setValue(nuevoSaldo);

  // Generar código de resguardo
  var codResguardo = "TRG-J" + payload.jornada + "-" + Math.floor(10000 + Math.random() * 90000);

  // Guardar en hoja QUINIELAS
  sheetQuinielas.appendRow([
    codResguardo,
    payload.jornada,
    jugador.id,
    new Date(),
    JSON.stringify(payload.columna1),
    JSON.stringify(payload.columna2 || {}),
    JSON.stringify(payload.pleno15),
    0 // Aciertos iniciales
  ]);

  // Enviar resguardo por correo electrónico HTML
  enviarResguardoHTML(jugador.email, jugador.nombre, codResguardo, payload, nuevoSaldo);

  // Alerta de saldo por email si saldo == 1 o 0
  if (nuevoSaldo <= 1) {
    enviarAlertaSaldoEmail(jugador.email, jugador.nombre, nuevoSaldo);
  }

  registrarLog("INFO", "SellarQuiniela", "Boleto " + codResguardo + " registrado para " + jugador.nombre);

  return {
    success: true,
    codigoResguardo: codResguardo,
    saldoRestante: nuevoSaldo,
    alertaSaldo: nuevoSaldo <= 1
  };
}

/**
 * Genera y envía el resguardo HTML oficial de App TR
 */
function enviarResguardoHTML(email, nombre, codigo, payload, saldoRestante) {
  if (!email || email.indexOf("@") === -1) return;

  var html = "<div style='font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 600px; margin: auto;'>" +
    "<h2 style='color: #38bdf8; margin-top: 0;'>⚽ Resguardo Oficial - App TR (v20.57)</h2>" +
    "<p>Hola <strong>" + nombre + "</strong>, tu pronóstico para la <strong>Jornada " + payload.jornada + "</strong> ha sido sellado con éxito.</p>" +
    "<div style='background: #1e293b; padding: 16px; border-radius: 8px; border: 1px solid #334155; margin-bottom: 20px;'>" +
      "<p style='margin: 4px 0;'><strong>Código de Resguardo:</strong> <span style='color: #fbbf24; font-size: 18px; font-weight: bold;'>" + codigo + "</span></p>" +
      "<p style='margin: 4px 0;'><strong>Fecha y Hora:</strong> " + new Date().toLocaleString() + "</p>" +
      "<p style='margin: 4px 0;'><strong>Saldo restante:</strong> " + saldoRestante + " jornada(s)</p>" +
    "</div>" +
    "<p style='font-size: 12px; color: #94a3b8;'>Conserva este resguardo como comprobante oficial para el escrutinio de la liga.</p>" +
  "</div>";

  MailApp.sendEmail({
    to: email,
    subject: "Resguardo App TR - Boleto " + codigo,
    htmlBody: html
  });
}

/**
 * Automatismo horario: Motor de Tiempos Anti-Spam
 * Configurar con activador de reloj cada 1 hora en script.google.com
 */
function motorAutomataTiempos() {
  var props = PropertiesService.getScriptProperties();
  var hoy = Utilities.formatDate(new Date(), "GMT+1", "yyyy-MM-dd");
  var now = new Date();
  var dia = now.getDay(); // 5 = Viernes, 6 = Sábado
  var hora = now.getHours();

  var ultimoAvisoTx = props.getProperty("ULTIMO_AVISO_TX");
  var ultimoCierreTy = props.getProperty("ULTIMO_CIERRE_TY");

  // Viernes: Aviso previo T-X
  if (dia === 5 && hora >= CONFIG.HORA_AVISO_TX && ultimoAvisoTx !== hoy) {
    props.setProperty("ULTIMO_AVISO_TX", hoy);
    dispararNotificacionTX();
    registrarLog("AVISO", "motorAutomataTiempos", "Aviso previo T-X enviado a la comunidad.");
  }

  // Sábado: Cierre inapelable T-Y
  if (dia === 6 && hora >= CONFIG.HORA_CIERRE_TY && ultimoCierreTy !== hoy) {
    props.setProperty("ULTIMO_CIERRE_TY", hoy);
    cerrarPlazosTY();
    registrarLog("CIERRE", "motorAutomataTiempos", "Cierre T-Y de plazos ejecutado automáticamente.");
  }
}

/**
 * Genera el archivo TXT para EduLosilla (16 caracteres por línea: 14 signos 1X2 + 2 goles Pleno 15)
 * Se ejecuta al superar la hora T (después de T).
 */
function generarTxtEduLosilla(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetQuinielas = ss.getSheetByName("QUINIELAS");
  var data = sheetQuinielas.getDataRange().getValues();
  var jornada = payload.jornada || 28;
  var lineas = [];

  for (var i = 1; i < data.length; i++) {
    if (Number(data[i][1]) === Number(jornada)) {
      var c1 = JSON.parse(data[i][4] || "{}");
      var p15 = JSON.parse(data[i][6] || "{}");

      var linea = "";
      for (var p = 1; p <= 14; p++) {
        linea += (c1[p] || "1").toUpperCase();
      }
      var gL = String(p15.local || "0").toUpperCase();
      var gV = String(p15.visitante || "0").toUpperCase();
      if (gL !== "0" && gL !== "1" && gL !== "2") gL = "M";
      if (gV !== "0" && gV !== "1" && gV !== "2") gV = "M";
      linea += gL + gV;

      lineas.push(linea);
    }
  }

  var contenidoTxt = lineas.join("\\r\\n") + "\\r\\n";
  registrarLog("INFO", "EduLosilla_PostT", "Generadas " + lineas.length + " apuestas para web de loterías tras hora T.");

  return {
    success: true,
    totalApuestas: lineas.length,
    contenidoTxt: contenidoTxt,
    nombreArchivo: "quiniela_jornada_" + jornada + "_edulosilla.txt"
  };
}

function registrarLog(nivel, accion, detalles) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("LOGS");
    if (sheet) {
      sheet.appendRow([new Date(), nivel, accion, detalles]);
    }
  } catch (e) {}
}

function respuestaJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
  }
}

export const backend = GasBackendService.getInstance();
export const gasBackend = backend;
