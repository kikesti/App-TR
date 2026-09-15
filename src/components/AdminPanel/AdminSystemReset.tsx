import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Clock,
  RotateCcw,
  Terminal,
  AlertTriangle,
  Check,
  Save,
  Trash2,
  Calendar,
  Bell,
  Lock,
  Hourglass,
  Users,
  Send,
  Play
} from 'lucide-react';
import { LogEntrada, EstadoJornada, Partido, Jugador, QuinielaBoleto } from '../../types';
import { calcularRelesCronologicos, obtenerJugadoresRezagados } from '../../services/releTimeService';
import { AdminEduLosillaExport } from './AdminEduLosillaExport';
import { ResultadoExportacionEduLosilla } from '../../services/edulosillaService';

interface Props {
  estado: EstadoJornada;
  partidos: Partido[];
  jugadores?: Jugador[];
  boletos?: QuinielaBoleto[];
  logs: LogEntrada[];
  onSaveRelays: (horaTx: string, horaTy: string) => void;
  onEjecutarAutomata?: () => { mensaje: string; accionEjecutada: string };
  onDispararAvisoRezagados?: () => { enviados: number; rezagados: string[] };
  onDispararCierreApuestas?: () => { boletosSellados: number };
  onEjecutarExportacionPostT?: (forzar: boolean) => { success: boolean; mensaje: string; resultado: ResultadoExportacionEduLosilla };
  onResetNuclear: () => void;
  onClearLogs: () => void;
}

export const AdminSystemReset: React.FC<Props> = ({
  estado,
  partidos,
  jugadores = [],
  boletos = [],
  logs,
  onSaveRelays,
  onEjecutarAutomata,
  onDispararAvisoRezagados,
  onDispararCierreApuestas,
  onEjecutarExportacionPostT,
  onResetNuclear,
  onClearLogs,
}) => {
  // Las horas T-X y T-Y representan horas relativas antes del primer partido cronológico (T)
  const [horasTxNum, setHorasTxNum] = useState<number>(() => {
    const parsed = parseInt(estado.horaTx || '12', 10);
    return isNaN(parsed) ? 12 : parsed;
  });

  const [horasTyNum, setHorasTyNum] = useState<number>(() => {
    const parsed = parseInt(estado.horaTy || '8', 10);
    return isNaN(parsed) ? 8 : parsed;
  });

  const [savedRelays, setSavedRelays] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'success' | 'info'; texto: string } | null>(null);

  // Cálculos reactivos de T (primer partido cronológico), T-X y T-Y
  const relesCalc = useMemo(() => {
    return calcularRelesCronologicos(partidos, horasTxNum, horasTyNum);
  }, [partidos, horasTxNum, horasTyNum]);

  // Lista de jugadores rezagados (activos que aún NO han sellado)
  const rezagados = useMemo(() => {
    return obtenerJugadoresRezagados(jugadores, boletos, estado.numeroJornada);
  }, [jugadores, boletos, estado.numeroJornada]);

  const totalActivos = useMemo(() => {
    return jugadores.filter(j => j.activo).length;
  }, [jugadores]);

  // Confirmación de Reset Nuclear
  const [confirmText, setConfirmText] = useState('');
  const [showNuclearModal, setShowNuclearModal] = useState(false);

  const handleSaveRelays = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRelays(String(horasTxNum), String(horasTyNum));
    setSavedRelays(true);
    setFeedbackMsg({
      tipo: 'success',
      texto: `✅ Relés calculados respecto al primer partido (${relesCalc.primerPartidoTexto}): Preaviso T-${horasTxNum}h (${relesCalc.fechaHoraTxTexto}) y Cierre T-${horasTyNum}h (${relesCalc.fechaHoraTyTexto}).`
    });
    setTimeout(() => {
      setSavedRelays(false);
      setFeedbackMsg(null);
    }, 4000);
  };

  const handleTriggerAviso = () => {
    if (onDispararAvisoRezagados) {
      const res = onDispararAvisoRezagados();
      setFeedbackMsg({
        tipo: 'info',
        texto: `📢 Preaviso T-X emitido: Notificación y alerta enviada a ${res.enviados} jugadores rezagados.`
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleTriggerCierre = () => {
    if (!confirm('¿Estás seguro de ejecutar el cierre de apuestas (Relé T-Y)? El sistema bloqueará el envío de nuevos boletos.')) {
      return;
    }
    if (onDispararCierreApuestas) {
      const res = onDispararCierreApuestas();
      setFeedbackMsg({
        tipo: 'info',
        texto: `🔒 Cierre Relé T-Y completado: Envío de apuestas bloqueado con ${res.boletosSellados} boletos sellados.`
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleTriggerAutomata = () => {
    if (onEjecutarAutomata) {
      const res = onEjecutarAutomata();
      setFeedbackMsg({
        tipo: 'info',
        texto: `⚡ Autómata evaluado: ${res.accionEjecutada}`
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleExecuteNuclear = () => {
    if (confirmText !== 'RESET') {
      alert('Escribe exactamente "RESET" para confirmar la operación.');
      return;
    }
    onResetNuclear();
    setShowNuclearModal(false);
    setConfirmText('');
    alert('☢️ RESET NUCLEAR COMPLETADO: Todos los saldos y estadísticas han sido reiniciados a cero para la nueva temporada. Las cuentas de usuario y PINs se han conservado intactas.');
  };

  return (
    <div className="space-y-6">
      {/* Mensaje de feedback temporal */}
      {feedbackMsg && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          feedbackMsg.tipo === 'success'
            ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30'
            : 'bg-sky-950/50 text-sky-300 border-sky-500/30'
        }`}>
          <span>{feedbackMsg.texto}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white ml-2 cursor-pointer font-bold">×</button>
        </div>
      )}

      {/* 1. CONFIGURACIÓN DE RELÉS TEMPORALES (T-X y T-Y) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Autómata de Tiempos & Relés Horarios (T-X y T-Y)</h3>
              <p className="text-xs text-slate-400">
                Basado en el inicio del primer partido cronológico de la jornada (<strong className="text-amber-300">T</strong>)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {relesCalc.plazoCerradoPorTy || !estado.abierta ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Plazo Cerrado por Relé T-Y
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5" /> Plazo Abierto (Cierre en T-Y)
              </span>
            )}
          </div>
        </div>

        {/* TARJETA INFORMATIVA DEL PRIMER PARTIDO CRONOLÓGICO (T) */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/30 border border-sky-500/20 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-black text-lg">
              T
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Primer Partido Cronológico de la Jornada (T)
              </div>
              <div className="text-sm font-semibold text-white mt-0.5">
                {relesCalc.primerPartidoTexto}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Referencia temporal:</span>
            <span className="text-xs font-mono font-bold text-sky-300">
              {relesCalc.fechaHoraPrimerPartido ? relesCalc.fechaHoraPrimerPartido.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + ' h' : 'Sin fecha'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveRelays} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* RELÉ T-X: AVISO PREVIO */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-400" /> Relé T-X: Horas previas de Aviso
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono font-bold">
                T - {horasTxNum}h
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Horas de antelación al inicio del primer partido (<strong className="text-white">T</strong>) en las que se envía el recordatorio masivo a los rezagados.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 block mb-1">Horas antes de T (X):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={horasTxNum}
                    onChange={(e) => setHorasTxNum(Math.max(1, Number(e.target.value) || 1))}
                    className="w-24 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-slate-400 font-bold">horas</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-right flex-1">
                <span className="text-[10px] text-slate-500 block">Momento del aviso:</span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {relesCalc.fechaHoraTxTexto}
                </span>
              </div>
            </div>
          </div>

          {/* RELÉ T-Y: CIERRE INAPELABLE */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-400 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-rose-400" /> Relé T-Y: Horas previas de Cierre
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 font-mono font-bold">
                T - {horasTyNum}h
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Horas de antelación al inicio del primer partido (<strong className="text-white">T</strong>) en las que el sellado queda estrictamente bloqueado.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 block mb-1">Horas antes de T (Y):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="48"
                    value={horasTyNum}
                    onChange={(e) => setHorasTyNum(Math.max(0, Number(e.target.value) || 0))}
                    className="w-24 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-slate-400 font-bold">horas</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-right flex-1">
                <span className="text-[10px] text-slate-500 block">Momento del cierre:</span>
                <span className="text-xs font-mono font-bold text-rose-300">
                  {relesCalc.fechaHoraTyTexto}
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow cursor-pointer"
            >
              {savedRelays ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedRelays ? '¡Relés T-X y T-Y Actualizados!' : 'Guardar Horas de Relé (T-X y T-Y)'}</span>
            </button>
          </div>
        </form>

        {/* SECCIÓN DE FUNCIONES ASOCIADAS & CONTROL DE REZAGADOS */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white">Estado de Rezagados & Funciones Asociadas</h4>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                {rezagados.length} de {totalActivos} pendientes
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTriggerAviso}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Envía la notificación masiva de preaviso a todos los jugadores que no han sellado"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ejecutar Preaviso Rezagados (T-X)</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerCierre}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Cierra el plazo y bloquea el envío de apuestas"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Ejecutar Cierre Apuestas (T-Y)</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerAutomata}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Evalúa el reloj del sistema contra los relés T-X y T-Y"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Evaluar Autómata</span>
              </button>
            </div>
          </div>

          {/* Chips de jugadores rezagados */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            <span className="text-[11px] text-slate-400 block mb-1.5">
              Jugadores que aún no han sellado boleto en la Jornada {estado.numeroJornada}:
            </span>
            {rezagados.length === 0 ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> ¡Todos los jugadores activos han sellado su boleto! No hay rezagados.
              </span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {rezagados.map((j) => (
                  <span
                    key={j.id}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-medium flex items-center gap-1"
                  >
                    <span>{j.nombre}</span>
                    <span className="text-[9px] text-amber-400/70">(Pendiente)</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. EXPORTACIÓN OFICIAL EDULOSILLA (RELÉ POST-T) */}
      <AdminEduLosillaExport
        estado={estado}
        partidos={partidos}
        boletos={boletos}
        onEjecutarExportacionPostT={
          onEjecutarExportacionPostT ||
          ((forzar: boolean) => ({
            success: true,
            mensaje: 'Generado con éxito',
            resultado: {} as any,
          }))
        }
      />

      {/* 3. REGISTRO DE EVENTOS (HOJA LOGS) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-400" />
            <h3 className="text-sm font-bold text-white">Registro de Auditoría (Hoja LOGS)</h3>
          </div>
          <button
            onClick={onClearLogs}
            className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar Registro</span>
          </button>
        </div>

        <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 max-h-52 overflow-y-auto font-mono text-[11px] space-y-1.5">
          {logs.length === 0 ? (
            <p className="text-slate-600">No hay registros recientes en la hoja LOGS.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 text-slate-300">
                <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                <span className={`font-bold shrink-0 ${
                  log.tipo === 'ERROR' ? 'text-rose-400' : log.tipo === 'WARN' ? 'text-amber-400' : 'text-sky-400'
                }`}>
                  {log.tipo}:
                </span>
                <span className="text-slate-400 shrink-0">{log.accion}</span>
                <span className="truncate flex-1">{log.detalles}</span>
                {log.usuario && (
                  <span className="text-slate-500 text-[10px] shrink-0">({log.usuario})</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. RESET NUCLEAR DE TEMPORADA */}
      <div className="rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-rose-950/40 border-2 border-rose-600/40 p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-rose-300 uppercase tracking-wider">
              Zona de Peligro: Reset de Temporada (Nuclear)
            </h3>
            <p className="text-xs text-slate-400">
              Reinicia a cero todos los saldos de jornadas, puntos acumulados y registros de boletos para dar comienzo a una nueva temporada deportiva.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-900/50 text-xs text-rose-200">
          ⚠️ <strong>Protección de Cuentas:</strong> Los nombres de los jugadores, correos electrónicos y códigos PIN de acceso <strong>permanecerán intactos</strong> en la base de datos de Google Sheets. Solo se resetean contadores numéricos y saldos.
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setShowNuclearModal(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition active:scale-95 shadow-md flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Iniciar Reset Nuclear</span>
          </button>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN NUCLEAR */}
      {showNuclearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border-2 border-rose-600 shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <div>
                <h3 className="text-base font-black text-white">¿Confirmar Reset Nuclear?</h3>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Todos los saldos de jornadas de los usuarios volverán a <strong>0</strong> y la clasificación general se reseteará. Para confirmar, escribe la palabra <strong className="text-rose-400">RESET</strong> en mayúsculas:
            </p>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escribe RESET aquí..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-center font-mono font-bold text-white tracking-widest focus:outline-none focus:border-rose-500"
            />

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  setShowNuclearModal(false);
                  setConfirmText('');
                }}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteNuclear}
                disabled={confirmText !== 'RESET'}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs transition cursor-pointer"
              >
                Ejecutar Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
