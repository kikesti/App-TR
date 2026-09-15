import React from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Flame } from 'lucide-react';
import { Jugador } from '../../types';

interface Props {
  jugadores: Jugador[];
  currentUserId?: string;
}

export const TabRanking: React.FC<Props> = ({ jugadores, currentUserId }) => {
  // Ordenar todos los jugadores activos por totalPuntos desc, luego totalAciertos desc
  const sorted = [...jugadores]
    .filter(j => j.activo && !j.nombre?.toLowerCase().includes('(admin'))
    .sort((a, b) => {
      if (b.totalPuntos !== a.totalPuntos) return b.totalPuntos - a.totalPuntos;
      return b.totalAciertos - a.totalAciertos;
    });

  const top1 = sorted[0];
  const top2 = sorted[1];
  const top3 = sorted[2];

  return (
    <div className="space-y-4 pb-24">
      {/* Cabecera de la Clasificación */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Clasificación General Liga TRG</h2>
            <p className="text-xs text-slate-400">Puntuación matemática oficial de la temporada</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
          <Users className="w-3.5 h-3.5 text-sky-400" />
          <span>{sorted.length} Jugadores</span>
        </div>
      </div>

      {/* Podio Visual Top 3 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4 pb-2 items-end">
        {/* 2º Puesto (Plata) */}
        {top2 && (
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-lg border-2 border-slate-300"
                style={{ backgroundColor: top2.avatarColor || '#64748b' }}
              >
                {top2.nombre.charAt(0)}
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-300 text-slate-900 flex items-center justify-center text-xs font-black shadow">
                2
              </span>
            </div>
            <span className="text-xs font-bold text-slate-200 text-center truncate max-w-[90px] sm:max-w-[120px]">
              {top2.nombre.split(' ')[0]}
            </span>
            <span className="text-sm sm:text-base font-black text-slate-300">
              {top2.totalPuntos} <span className="text-[10px] font-normal text-slate-400">pts</span>
            </span>
            <div className="w-full h-16 sm:h-20 bg-slate-800/80 rounded-t-xl border-t border-x border-slate-700/80 mt-2 flex items-center justify-center text-slate-400 font-black text-xs">
              2º
            </div>
          </div>
        )}

        {/* 1º Puesto (Oro) */}
        {top1 && (
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-amber-400 animate-bounce">
                <Trophy className="w-5 h-5 fill-amber-400" />
              </div>
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl border-2 border-amber-400 ring-4 ring-amber-400/20"
                style={{ backgroundColor: top1.avatarColor || '#f59e0b' }}
              >
                {top1.nombre.charAt(0)}
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black shadow">
                1
              </span>
            </div>
            <span className="text-xs sm:text-sm font-black text-amber-300 text-center truncate max-w-[100px] sm:max-w-[130px]">
              {top1.nombre.split(' ')[0]}
            </span>
            <span className="text-base sm:text-lg font-black text-amber-400">
              {top1.totalPuntos} <span className="text-[10px] font-normal text-slate-400">pts</span>
            </span>
            <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-amber-500/20 to-slate-800 rounded-t-xl border-t-2 border-x border-amber-400/80 mt-2 flex items-center justify-center text-amber-400 font-black text-sm shadow-inner">
              👑 LÍDER
            </div>
          </div>
        )}

        {/* 3º Puesto (Bronce) */}
        {top3 && (
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-lg border-2 border-amber-700"
                style={{ backgroundColor: top3.avatarColor || '#b45309' }}
              >
                {top3.nombre.charAt(0)}
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center text-xs font-black shadow">
                3
              </span>
            </div>
            <span className="text-xs font-bold text-slate-200 text-center truncate max-w-[90px] sm:max-w-[120px]">
              {top3.nombre.split(' ')[0]}
            </span>
            <span className="text-sm sm:text-base font-black text-amber-600">
              {top3.totalPuntos} <span className="text-[10px] font-normal text-slate-400">pts</span>
            </span>
            <div className="w-full h-12 sm:h-16 bg-slate-800/80 rounded-t-xl border-t border-x border-slate-700/80 mt-2 flex items-center justify-center text-slate-400 font-black text-xs">
              3º
            </div>
          </div>
        )}
      </div>

      {/* Tabla Completa de Clasificación */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 sm:py-3 px-2 sm:px-3 w-10 sm:w-12 text-center">Pos</th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-3">Jugador</th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center">
                  <span className="hidden sm:inline">Jornadas</span>
                  <span className="sm:hidden">Jor.</span>
                </th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center">
                  <span className="hidden sm:inline">Aciertos</span>
                  <span className="sm:hidden">Ac.</span>
                </th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-right">
                  <span className="hidden sm:inline">Puntos</span>
                  <span className="sm:hidden">Pts</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {sorted.map((jugador, index) => {
                const isCurrent = jugador.id === currentUserId;
                const pos = index + 1;

                return (
                  <tr
                    key={jugador.id}
                    className={`transition ${
                      isCurrent
                        ? 'bg-sky-500/10 hover:bg-sky-500/15 font-bold text-white'
                        : 'hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center">
                      {pos === 1 ? (
                        <span className="inline-flex w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black items-center justify-center text-xs">
                          1
                        </span>
                      ) : pos === 2 ? (
                        <span className="inline-flex w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black items-center justify-center text-xs">
                          2
                        </span>
                      ) : pos === 3 ? (
                        <span className="inline-flex w-6 h-6 rounded-full bg-amber-700 text-white font-black items-center justify-center text-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-500 font-bold">{pos}</span>
                      )}
                    </td>

                    <td className="py-2.5 sm:py-3 px-2 sm:px-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                          style={{ backgroundColor: jugador.avatarColor || '#3b82f6' }}
                        >
                          {jugador.nombre.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-white flex items-center gap-1">
                            {jugador.nombre}
                            {isCurrent && (
                              <span className="text-[10px] text-sky-400 font-normal px-1 py-0.2 rounded bg-sky-500/20">
                                (Tú)
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500">{jugador.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-slate-400">
                      {jugador.jornadasJugadas}
                    </td>

                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-slate-300 font-semibold">
                      {jugador.totalAciertos}
                    </td>

                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-right">
                      <span className="text-sm font-black text-sky-400">
                        {jugador.totalPuntos}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
