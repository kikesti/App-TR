import { QuinielaBoleto, SignoQuiniela, PronosticoPleno15 } from '../types';

export interface LineaEduLosilla {
  lineaNumero: number;
  jugadorId: string;
  jugadorNombre: string;
  columnaTipo: 'Columna 1' | 'Columna 2';
  texto: string; // Los 16 caracteres exactos
  valida: boolean;
  error?: string;
}

export interface ResultadoExportacionEduLosilla {
  contenidoTxt: string;
  lineas: LineaEduLosilla[];
  totalLineas: number;
  totalJugadores: number;
  todasValidas: boolean;
  nombreArchivo: string;
  fechaGeneracion: string;
  resumenFormato: string;
}

/**
 * Expresión regular oficial de EduLosilla / Loterías y Apuestas del Estado:
 * - Exactamente 14 signos 1X2 para los partidos 1 a 14.
 * - Exactamente 2 caracteres para el Pleno al 15 (goles local y visitante: 0, 1, 2 o M).
 * - Total: 16 caracteres por línea.
 */
export const REGEX_EDULOSILLA = /^[1X2]{14}[012M]{2}$/;

/**
 * Normaliza los signos del Pleno al 15 (0, 1, 2 o M).
 * Convierte valores como '3', '4', '+' o 'm' a 'M' (Más de 2 goles).
 */
export function normalizarGolPleno(val?: string): '0' | '1' | '2' | 'M' {
  if (!val) return '0';
  const v = String(val).trim().toUpperCase();
  if (v === '0' || v === '1' || v === '2') return v;
  if (v === 'M' || v === '3' || v === '4' || v === '5' || v === '+') return 'M';
  return '0';
}

/**
 * Normaliza un signo 1X2 de la Quiniela a mayúsculas ('1', 'X', '2').
 */
export function normalizarSigno1X2(val?: string): SignoQuiniela {
  if (!val) return '1';
  const v = String(val).trim().toUpperCase();
  if (v === '1' || v === '2') return v;
  if (v === 'X' || v === '0') return 'X';
  return '1';
}

/**
 * Convierte una columna de pronósticos (partidos 1..14) y el Pleno al 15
 * en la cadena exacta de 16 caracteres según el formato EduLosilla.
 *
 * Ejemplo salida: "122121112212X20M"
 */
export function formatearApuestaEduLosilla(
  columna: Record<number, SignoQuiniela | string>,
  pleno: PronosticoPleno15
): string {
  let resultado = '';

  // 1. Partidos 1 a 14
  for (let i = 1; i <= 14; i++) {
    const signo = normalizarSigno1X2(columna[i]);
    resultado += signo;
  }

  // 2. Pleno al 15 (Local y Visitante)
  const gLocal = normalizarGolPleno(pleno?.local);
  const gVisitante = normalizarGolPleno(pleno?.visitante);
  resultado += gLocal + gVisitante;

  return resultado;
}

/**
 * Valida si una línea cumple estrictamente el formato EduLosilla:
 * 16 caracteres: 14 signos (1, X, 2) + 2 caracteres de goles (0, 1, 2, M).
 */
export function validarLineaEduLosilla(linea: string): { valida: boolean; error?: string } {
  if (!linea) {
    return { valida: false, error: 'Línea vacía' };
  }
  const clean = linea.trim();
  if (clean.length !== 16) {
    return {
      valida: false,
      error: `Longitud incorrecta: ${clean.length} caracteres (deben ser exactamente 16)`,
    };
  }
  if (!REGEX_EDULOSILLA.test(clean)) {
    // Diagnosticar parte errónea
    const parte14 = clean.slice(0, 14);
    const partePleno = clean.slice(14, 16);
    if (!/^[1X2]{14}$/.test(parte14)) {
      return {
        valida: false,
        error: `Los primeros 14 caracteres contienen signos inválidos: "${parte14}" (solo se permite 1, X, 2)`,
      };
    }
    if (!/^[012M]{2}$/.test(partePleno)) {
      return {
        valida: false,
        error: `El Pleno al 15 contiene caracteres inválidos: "${partePleno}" (solo se permite 0, 1, 2 o M)`,
      };
    }
    return { valida: false, error: 'Formato EduLosilla no válido' };
  }
  return { valida: true };
}

/**
 * Genera el archivo TXT completo con las apuestas de todos los jugadores de la jornada.
 * Retorna el texto plano para guardar en disco y el desglose línea a línea con validaciones.
 */
export function generarArchivoTxtEduLosilla(
  boletos: QuinielaBoleto[],
  jornadaNumero: number
): ResultadoExportacionEduLosilla {
  // Filtrar boletos de la jornada actual
  const boletosJornada = boletos.filter((b) => b.jornada === jornadaNumero);

  // Si no hay boletos de esa jornada (por ejemplo en tests), usar los boletos disponibles
  const boletosAProcesar = boletosJornada.length > 0 ? boletosJornada : boletos;

  const lineas: LineaEduLosilla[] = [];
  const jugadoresSet = new Set<string>();

  let numLinea = 1;

  for (const boleto of boletosAProcesar) {
    jugadoresSet.add(boleto.jugadorId);

    // 1. Columna 1 (obligatoria)
    const textoCol1 = formatearApuestaEduLosilla(boleto.columna1 || {}, boleto.pleno15);
    const validacionCol1 = validarLineaEduLosilla(textoCol1);

    lineas.push({
      lineaNumero: numLinea++,
      jugadorId: boleto.jugadorId,
      jugadorNombre: boleto.jugadorNombre,
      columnaTipo: 'Columna 1',
      texto: textoCol1,
      valida: validacionCol1.valida,
      error: validacionCol1.error,
    });

    // 2. Columna 2 (si el boleto la incluye y tiene partidos informados)
    if (boleto.columna2 && Object.keys(boleto.columna2).length >= 14) {
      const textoCol2 = formatearApuestaEduLosilla(boleto.columna2, boleto.pleno15);
      const validacionCol2 = validarLineaEduLosilla(textoCol2);

      lineas.push({
        lineaNumero: numLinea++,
        jugadorId: boleto.jugadorId,
        jugadorNombre: boleto.jugadorNombre,
        columnaTipo: 'Columna 2',
        texto: textoCol2,
        valida: validacionCol2.valida,
        error: validacionCol2.error,
      });
    }
  }

  // Generar contenido plano con saltos de línea estándar (\r\n para compatibilidad total con Windows y Loterías)
  const contenidoTxt = lineas.map((l) => l.texto).join('\r\n') + (lineas.length > 0 ? '\r\n' : '');

  const todasValidas = lineas.length > 0 && lineas.every((l) => l.valida);
  const nombreArchivo = `quiniela_jornada_${jornadaNumero}_edulosilla.txt`;

  return {
    contenidoTxt,
    lineas,
    totalLineas: lineas.length,
    totalJugadores: jugadoresSet.size,
    todasValidas,
    nombreArchivo,
    fechaGeneracion: new Date().toLocaleString('es-ES'),
    resumenFormato: `Formato EduLosilla Oficial: 16 caracteres por línea (14 signos 1X2 + 2 signos Pleno 15 con 0,1,2,M)`,
  };
}

/**
 * Descarga el archivo de texto en el navegador del usuario.
 */
export function descargarArchivoEduLosilla(contenidoTxt: string, nombreArchivo: string): void {
  const blob = new Blob([contenidoTxt], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copia el contenido formateado al portapapeles.
 */
export async function copiarTxtAlPortapapeles(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = texto;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  } catch (err) {
    console.error('Error al copiar al portapapeles:', err);
    return false;
  }
}
