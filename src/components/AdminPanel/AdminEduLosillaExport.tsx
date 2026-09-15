import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Send,
  ShieldCheck,
  Info,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Bot
} from 'lucide-react';
import { EstadoJornada, Partido, QuinielaBoleto } from '../../types';
import { calcularRelesCronologicos } from '../../services/releTimeService';
import {
  generarArchivoTxtEduLosilla,
  descargarArchivoEduLosilla,
  copiarTxtAlPortapapeles,
  validarLineaEduLosilla,
  ResultadoExportacionEduLosilla
} from '../../services/edulosillaService';
import { gasBackend } from '../../services/gasBackend';

interface Props {
  estado: EstadoJornada;
  partidos: Partido[];
  boletos: QuinielaBoleto[];
  onEjecutarExportacionPostT: (forzar: boolean) => { success: boolean; mensaje: string; resultado: ResultadoExportacionEduLosilla };
}

export const AdminEduLosillaExport: React.FC<Props> = ({
  estado,
  partidos,
  boletos,
  onEjecutarExportacionPostT,
}) => {
  const [copiado, setCopiado] = useState(false);
  const [mostrarTextoPlano, setMostrarTextoPlano] = useState(false);
  const [lineaPrueba, setLineaPrueba] = useState('122121112212X20M');
  const [feedback, setFeedback] = useState<{ tipo: 'success' | 'error' | 'info'; texto: string } | null>(null);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [botToken, setBotToken] = useState(estado.telegramBotToken || '');
  const [chatId, setChatId] = useState(estado.telegramChatId || '');

  // Cálculos de Relés (especialmente T = inicio primer partido y T-Y = cierre de apuestas)
  const horasTxNum = parseInt(estado.horaTx || '12', 10) || 12;
  const horasTyNum = parseInt(estado.horaTy || '8', 10) || 8;
  const reles = useMemo(() => {
    return calcularRelesCronologicos(partidos, horasTxNum, horasTyNum);
  }, [partidos, horasTxNum, horasTyNum]);

  // Generación reactiva del archivo EduLosilla
  const exportacion = useMemo(() => {
    return generarArchivoTxtEduLosilla(boletos, estado.numeroJornada);
  }, [boletos, estado.numeroJornada]);

  // Validación de la línea de prueba
  const validacionPrueba = useMemo(() => {
    return validarLineaEduLosilla(lineaPrueba);
  }, [lineaPrueba]);

  const handleDescargar = () => {
    if (exportacion.lineas.length === 0) {
      setFeedback({ tipo: 'error', texto: 'No hay pronósticos registrados para descargar.' });
      return;
    }
    descargarArchivoEduLosilla(exportacion.contenidoTxt, exportacion.nombreArchivo);
    setFeedback({
      tipo: 'success',
      texto: `📥 Archivo "${exportacion.nombreArchivo}" descargado correctamente con ${exportacion.totalLineas} apuestas.`,
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCopiar = async () => {
    if (exportacion.lineas.length === 0) {
      setFeedback({ tipo: 'error', texto: 'No hay pronósticos que copiar.' });
      return;
    }
    const ok = await copiarTxtAlPortapapeles(exportacion.contenidoTxt);
    if (ok) {
      setCopiado(true);
      setFeedback({
        tipo: 'success',
        texto: '📋 ¡Pronósticos copiados al portapapeles! Listos para pegar en la web de EduLosilla.',
      });
      setTimeout(() => {
        setCopiado(false);
        setFeedback(null);
      }, 3500);
    }
  };

  const handleEnviarTelegram = async () => {
    setIsSendingTelegram(true);
    setFeedback({ tipo: 'info', texto: '⏳ Despachando archivo EduLosilla al Bot de Telegram...' });
    try {
      const res = await gasBackend.enviarEduLosillaATelegramDirecto(botToken, chatId);
      if (res.success) {
        setFeedback({
          tipo: 'success',
          texto: `✈️ ${res.mensaje}`,
        });
      } else {
        setFeedback({
          tipo: 'error',
          texto: `⚠️ ${res.mensaje}`,
        });
      }
    } catch (err: any) {
      setFeedback({
        tipo: 'error',
        texto: `Error enviando a Telegram: ${err.message}`,
      });
    } finally {
      setIsSendingTelegram(false);
      setTimeout(() => setFeedback(null), 7000);
    }
  };

  const handleEjecutarCierreYEnvio = () => {
    const res = onEjecutarExportacionPostT(true);
    if (res.success) {
      setFeedback({
        tipo: 'success',
        texto: `🚀 ${res.mensaje}`,
      });
    } else {
      setFeedback({
        tipo: 'error',
        texto: `⚠️ ${res.mensaje}`,
      });
    }
    setTimeout(() => setFeedback(null), 6000);
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-5">
      {/* Feedback contextual */}
      {feedback && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          feedback.tipo === 'success'
            ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30'
            : feedback.tipo === 'error'
            ? 'bg-rose-950/50 text-rose-300 border-rose-500/30'
            : 'bg-sky-950/50 text-sky-300 border-sky-500/30'
        }`}>
          <span>{feedback.texto}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white font-bold ml-2 cursor-pointer">×</button>
        </div>
      )}

      {/* CABECERA & ESTADO DEL RELÉ T-Y Y ENVÍO A TELEGRAM */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Exportación Oficial EduLosilla & Bot de Telegram</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono font-bold">
                16 car. / apuesta
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Genera y transmite el archivo <code className="text-amber-300 font-mono">.txt</code> al bot de Telegram inmediatamente tras el cierre de apuestas (Relé T-Y) para tener tiempo de sellarlo antes de la hora T.
            </p>
          </div>
        </div>

        {/* Badge de estado del plazo y envío */}
        <div className="flex items-center gap-2">
          {!estado.abierta ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Plazo Cerrado (Relé T-Y ejecutado)
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Periodo Abierto (Envío automático programado al cerrar T-Y)
            </span>
          )}
        </div>
      </div>

      {/* TARJETA INFORMATIVA: REGLA DE ENVÍO AL CIERRE T-Y ANTES DE LA HORA T */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-sky-400 shrink-0" />
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Plazo de Sellado en EduLosilla:
            </span>
            <span className="text-white font-semibold">
              Cierre de apuestas (Relé T-Y): {reles.fechaHoraTyTexto} ➔ Primer partido (Hora T): {reles.primerPartidoTexto}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Margen para sellar en EduLosilla:</span>
          <span className="font-mono font-bold text-amber-400">
            {horasTyNum} horas de margen hasta el inicio de T
          </span>
        </div>
      </div>

      {/* SECCIÓN CONFIGURACIÓN Y ESTADO DE TELEGRAM */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 via-slate-950 to-indigo-950/40 border border-sky-500/30 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Despacho Automático a Telegram (Bot / Canal)
            </span>
          </div>
          {estado.telegramEnvioExitoso ? (
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <Check className="w-3 h-3" /> Último envío a Telegram confirmado
            </span>
          ) : estado.telegramUltimoMensaje ? (
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              {estado.telegramUltimoMensaje}
            </span>
          ) : null}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Al cerrarse el periodo de apuestas (Relé T-Y), el sistema genera el archivo <strong className="text-white font-mono">{exportacion.nombreArchivo}</strong> y lo transmite de inmediato al Bot de Telegram con el resumen de apuestas para que el administrador disponga de tiempo hasta la hora T para sellarla en edulosilla.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1 font-semibold">
              Telegram Bot Token (opcional, o desde .env):
            </label>
            <input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="Ej: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1 font-semibold">
              Telegram Chat ID / Canal (opcional, o desde .env):
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Ej: -1001234567890 o @mi_canal"
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleEnviarTelegram}
            disabled={isSendingTelegram}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingTelegram ? 'Enviando...' : 'Mandar Archivo a Telegram Ahora'}</span>
          </button>
        </div>
      </div>

      {/* EXPLICACIÓN DEL FORMATO EDULOSILLA & COMPROBADOR INTERACTIVO */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Info className="w-4 h-4 text-sky-400" />
            Especificación del Formato Oficial EduLosilla / Loterías
          </span>
          <span className="text-[10px] text-slate-400">
            Formato estándar compatible con importadores TXT de EduLosilla, Megaquin y Quiñones
          </span>
        </div>

        {/* Anatomía del formato */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="text-sky-400 font-bold block text-[11px]">
              Posiciones 1 a 14 (14 caracteres):
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Pronósticos de los 14 partidos principales en estricto orden cronológico.
              Valores permitidos: <strong className="text-white font-mono">1</strong>, <strong className="text-white font-mono">X</strong>, <strong className="text-white font-mono">2</strong>.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="text-amber-400 font-bold block text-[11px]">
              Posiciones 15 y 16 (2 caracteres - Pleno al 15):
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Posición 15: Goles del equipo Local. Posición 16: Goles del equipo Visitante.
              Valores: <strong className="text-white font-mono">0</strong>, <strong className="text-white font-mono">1</strong>, <strong className="text-white font-mono">2</strong> o <strong className="text-white font-mono">M</strong> (más de 2 goles).
            </p>
          </div>
        </div>

        {/* Validador interactivo de líneas */}
        <div className="pt-2 border-t border-slate-800/80">
          <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">
            Comprobador rápido de formato (ejemplo adjuntado por el usuario):
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={lineaPrueba}
              onChange={(e) => setLineaPrueba(e.target.value.trim().toUpperCase())}
              placeholder="Ej: 122121112212X20M"
              maxLength={16}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs w-60 tracking-wider focus:outline-none focus:border-sky-500"
            />
            {validacionPrueba.valida ? (
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Formato Válido (16 caracteres)
              </span>
            ) : (
              <span className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {validacionPrueba.error}
              </span>
            )}
            <button
              type="button"
              onClick={() => setLineaPrueba('21222X212222120M')}
              className="text-[10px] text-sky-400 hover:text-sky-300 underline cursor-pointer"
            >
              Probar segundo ejemplo (21222X212222120M)
            </button>
          </div>
        </div>
      </div>

      {/* BOTONERA DE ACCIÓN: DESCARGA, COPIA Y CIERRE T-Y */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDescargar}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar .TXT ({exportacion.nombreArchivo})</span>
          </button>

          <button
            type="button"
            onClick={handleCopiar}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 border border-slate-700 cursor-pointer"
          >
            {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
            <span>{copiado ? '¡Copiado!' : 'Copiar Texto EduLosilla'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMostrarTextoPlano(!mostrarTextoPlano)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer"
          >
            {mostrarTextoPlano ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{mostrarTextoPlano ? 'Ocultar Texto Plano' : 'Ver Texto Plano'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleEjecutarCierreYEnvio}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow cursor-pointer"
            title="Cierra el periodo de apuestas y despacha el archivo EduLosilla a Telegram"
          >
            <Clock className="w-4 h-4" />
            <span>Generar y Despachar al Cerrar T-Y</span>
          </button>
        </div>
      </div>

      {/* VISTA PREVIA DE TEXTO PLANO (RAW TXT) */}
      {mostrarTextoPlano && (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Contenido exacto del archivo TXT para EduLosilla ({exportacion.totalLineas} líneas, 16 car/línea):</span>
            <span className="font-mono text-amber-400">{exportacion.nombreArchivo}</span>
          </div>
          <textarea
            readOnly
            rows={Math.min(10, Math.max(3, exportacion.totalLineas + 1))}
            value={exportacion.contenidoTxt}
            className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2.5 font-mono text-xs text-sky-300 select-all tracking-wider focus:outline-none"
          />
        </div>
      )}

      {/* TABLA DETALLADA DE PRONÓSTICOS FORMATEADOS POR JUGADOR */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white">
            Pronósticos de Jugadores Formateados ({exportacion.totalLineas} apuestas de {exportacion.totalJugadores} jugadores):
          </span>
          <span className="text-[11px] text-slate-400">
            {exportacion.todasValidas ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 100% de apuestas válidas en formato EduLosilla
              </span>
            ) : (
              <span className="text-rose-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Se detectaron errores de formato
              </span>
            )}
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Jugador</th>
                <th className="py-2.5 px-3">Apuesta</th>
                <th className="py-2.5 px-3 font-mono">Pronóstico (14 signos 1X2 + Pleno 15)</th>
                <th className="py-2.5 px-3 text-center">Longitud</th>
                <th className="py-2.5 px-3 text-right">Estado EduLosilla</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/50 font-mono">
              {exportacion.lineas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">
                    No hay boletos sellados en la jornada {estado.numeroJornada}. Cuando los jugadores sellen, aparecerán aquí automáticamente en formato EduLosilla.
                  </td>
                </tr>
              ) : (
                exportacion.lineas.map((linea) => {
                  const signos14 = linea.texto.slice(0, 14);
                  const pleno2 = linea.texto.slice(14, 16);

                  return (
                    <tr key={linea.lineaNumero} className="hover:bg-slate-800/40 transition">
                      <td className="py-2 px-3 text-slate-500">{linea.lineaNumero}</td>
                      <td className="py-2 px-3 font-sans font-semibold text-white">
                        {linea.jugadorNombre}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-400 text-[11px]">
                        {linea.columnaTipo}
                      </td>
                      <td className="py-2 px-3 tracking-widest text-sm">
                        <span className="text-sky-300 font-bold">{signos14}</span>
                        <span className="text-amber-400 font-black bg-amber-500/10 px-1 py-0.5 rounded ml-1 border border-amber-500/30">
                          {pleno2}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center text-slate-400 text-xs">
                        {linea.texto.length} car.
                      </td>
                      <td className="py-2 px-3 text-right">
                        {linea.valida ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-sans font-semibold">
                            <Check className="w-3 h-3" /> Válida
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-sans font-semibold">
                            <AlertCircle className="w-3 h-3" /> Error
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
