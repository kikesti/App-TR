import React, { useState } from 'react';
import { History, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { QuinielaBoleto, Partido, Jugador } from '../../types';

interface Props {
  boletos: QuinielaBoleto[];
  currentUser: Jugador | null;
  partidos: Partido[];
  onOpenLogin: () => void;
}

export const TabHistorial: React.FC<Props> = ({ boletos, currentUser, partidos, onOpenLogin }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center space-y-3">
        <History className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-white">Historial de Apuestas</h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Inicia sesión con tu PIN para consultar todos tus boletos sellados y resultados anteriores.
        </p>
        <button
          onClick={onOpenLogin}
          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition shadow-sm cursor-pointer"
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  // Filtrar boletos del usuario actual
  const userBoletos = boletos.filter(b => b.jugadorId === currentUser.id);

  return (
    <div className="space-y-4 pb-24">
      {/* Cabecera */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Historial de Quinielas</h2>
            <p className="text-xs text-slate-400">Boletos sellados por {currentUser.nombre}</p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-300 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800">
          {userBoletos.length} {userBoletos.length === 1 ? 'Boleto' : 'Boletos'}
        </span>
      </div>

      {userBoletos.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-8 text-center text-slate-400 text-xs">
          <p>Aún no has sellado ninguna quiniela con esta cuenta.</p>
          <p className="text-slate-500 mt-1">Dirígete a la pestaña Fase para sellar tu primer boleto.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {userBoletos.map(boleto => {
            const isExpanded = expandedId === boleto.id;

            return (
              <div
                key={boleto.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md transition"
              >
                {/* Resumen del Boleto */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : boleto.id)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      boleto.escrutada
                        ? (boleto.maxAciertos || 0) >= 10
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                    }`}>
                      {boleto.escrutada ? <Trophy className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">Jornada {boleto.jornada}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{boleto.codigoResguardo}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{boleto.fechaSellado}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {boleto.escrutada ? (
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-black text-emerald-400">
                            {boleto.maxAciertos}/14
                          </span>
                          {boleto.aciertoPleno15 && (
                            <span className="text-[9px] px-1 rounded bg-amber-400/20 text-amber-300 font-bold">
                              +Pleno
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          +{boleto.puntosGanados} pts
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-sky-400 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
                        Pendiente Escrutinio
                      </span>
                    )}

                    <div className="text-slate-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Desglose Expandible */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-800/80 bg-slate-950/40 text-xs space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-3">
                      Desglose de Pronósticos vs Resultados Reales:
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Array.from({ length: 14 }, (_, i) => i + 1).map(num => {
                        const partido = partidos.find(p => p.numero === num);
                        const pronostico = boleto.columna1[num];
                        const resultadoReal = partido?.resultado;
                        const esAcierto = resultadoReal && pronostico === resultadoReal;
                        const esFallo = resultadoReal && pronostico !== resultadoReal;

                        return (
                          <div
                            key={num}
                            className={`p-2 rounded-xl border flex items-center justify-between ${
                              esAcierto
                                ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                                : esFallo
                                ? 'bg-rose-950/40 border-rose-700/50 text-rose-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div>
                              <span className="text-[10px] text-slate-500 block">P#{num}</span>
                              <span className="font-bold text-xs">Tu: {pronostico || '-'}</span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block">Real</span>
                              <span className="font-bold text-xs text-white">
                                {resultadoReal || 'Por jugar'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pleno al 15 */}
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-amber-400 font-bold block text-[11px]">Pleno al 15 Pronosticado:</span>
                        <span className="font-mono font-black text-white text-sm">
                          {boleto.pleno15.local} - {boleto.pleno15.visitante}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[11px]">Resultado Real:</span>
                        <span className="font-mono font-bold text-slate-300">
                          {partidos[14]?.golesLocal !== undefined
                            ? `${partidos[14].golesLocal} - ${partidos[14].golesVisitante}`
                            : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
