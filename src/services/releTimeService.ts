import { Partido } from '../types';

export interface ReleCalculations {
  primerPartido: Partido | null;
  fechaHoraPrimerPartido: Date | null;
  primerPartidoTexto: string;
  horasTx: number;
  horasTy: number;
  fechaHoraTx: Date | null;
  fechaHoraTy: Date | null;
  fechaHoraTxTexto: string;
  fechaHoraTyTexto: string;
  plazoCerradoPorTy: boolean;
  horaTPasada: boolean; // Si la hora actual ya superó el inicio del primer partido (T)
}

/**
 * Parsea cadenas de fecha comunes como '2026-09-11 21:00', '2026-09-11T21:00:00'
 * o formatos textuales como 'Viernes 21:00', 'Sábado 18:30', 'Domingo 14:00'.
 */
export function parseFechaPartido(fechaStr?: string): Date | null {
  if (!fechaStr) return null;

  // 1. Formato ISO o 'YYYY-MM-DD HH:mm'
  const isoMatch = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})/);
  if (isoMatch) {
    const [_, y, m, d, h, min] = isoMatch;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min));
  }

  // 2. Formato textual en español ej. 'Viernes 21:00', 'Sábado 16:15'
  const diasMap: Record<string, number> = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    miércoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    sábado: 6,
  };

  const textMatch = fechaStr.toLowerCase().match(/(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s*(\d{1,2}):(\d{2})/);
  if (textMatch) {
    const diaNombre = textMatch[1];
    const horas = Number(textMatch[2]);
    const minutos = Number(textMatch[3]);
    const targetDayOfWeek = diasMap[diaNombre];

    if (targetDayOfWeek !== undefined) {
      const now = new Date();
      const currentDayOfWeek = now.getDay();
      // Calcular diferencia respecto a la jornada semanal de viernes a domingo
      let diff = targetDayOfWeek - currentDayOfWeek;
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, horas, minutos, 0, 0);
      return targetDate;
    }
  }

  const d = new Date(fechaStr);
  if (!isNaN(d.getTime())) return d;
  return null;
}

/**
 * Encuentra el primer partido de la jornada en comenzar cronológicamente (T)
 * y calcula T-X (horas antes para aviso previo) y T-Y (horas antes para cierre inapelable).
 */
export function calcularRelesCronologicos(
  partidos: Partido[],
  horasTxNum: number = 12,
  horasTyNum: number = 8
): ReleCalculations {
  let earliestDate: Date | null = null;
  let earliestPartido: Partido | null = null;

  for (const partido of partidos) {
    const parsed = parseFechaPartido(partido.fechaHora);
    if (parsed) {
      if (!earliestDate || parsed.getTime() < earliestDate.getTime()) {
        earliestDate = parsed;
        earliestPartido = partido;
      }
    }
  }

  if (!earliestDate || !earliestPartido) {
    return {
      primerPartido: null,
      fechaHoraPrimerPartido: null,
      primerPartidoTexto: 'Pendiente de definir fechas/horarios en los 15 partidos',
      horasTx: horasTxNum,
      horasTy: horasTyNum,
      fechaHoraTx: null,
      fechaHoraTy: null,
      fechaHoraTxTexto: `T-${horasTxNum} horas antes de T`,
      fechaHoraTyTexto: `T-${horasTyNum} horas antes de T`,
      plazoCerradoPorTy: false,
      horaTPasada: false,
    };
  }

  const fechaHoraPrimerPartido = new Date(earliestDate);
  const fechaHoraTx = new Date(earliestDate.getTime() - horasTxNum * 60 * 60 * 1000);
  const fechaHoraTy = new Date(earliestDate.getTime() - horasTyNum * 60 * 60 * 1000);

  const formato = (date: Date) => {
    return date.toLocaleString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const now = new Date();
  const plazoCerradoPorTy = now.getTime() >= fechaHoraTy.getTime();
  const horaTPasada = now.getTime() >= fechaHoraPrimerPartido.getTime();

  return {
    primerPartido: earliestPartido,
    fechaHoraPrimerPartido,
    primerPartidoTexto: `#${earliestPartido.numero} ${earliestPartido.equipoLocal} vs ${earliestPartido.equipoVisitante} (${formato(fechaHoraPrimerPartido)})`,
    horasTx: horasTxNum,
    horasTy: horasTyNum,
    fechaHoraTx,
    fechaHoraTy,
    fechaHoraTxTexto: formato(fechaHoraTx),
    fechaHoraTyTexto: formato(fechaHoraTy),
    plazoCerradoPorTy,
    horaTPasada,
  };
}

/**
 * Obtiene la lista de jugadores activos que aún NO han sellado su quiniela
 * para la jornada indicada (rezagados).
 */
export function obtenerJugadoresRezagados(
  jugadores: { id: string; nombre: string; activo: boolean; email?: string }[],
  boletos: { jornada: number; jugadorId: string }[],
  jornadaActual: number
): { id: string; nombre: string; activo: boolean; email?: string }[] {
  return jugadores.filter((j) => {
    if (!j.activo) return false;
    const yaSello = boletos.some((b) => b.jornada === jornadaActual && b.jugadorId === j.id);
    return !yaSello;
  });
}
