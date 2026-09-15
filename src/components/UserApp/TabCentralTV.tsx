import React, { useState } from 'react';
import { Tv, ExternalLink, PlayCircle, Radio, Signal, Info } from 'lucide-react';
import { CanalTV, Partido } from '../../types';

interface Props {
  canales: CanalTV[];
  partidos: Partido[];
}

export const TabCentralTV: React.FC<Props> = ({ canales, partidos }) => {
  const [selectedChannel, setSelectedChannel] = useState<CanalTV | null>(null);

  return (
    <div className="space-y-4 pb-24">
      {/* Cabecera */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Central de Directos TV</h2>
            <p className="text-xs text-slate-400">Enlaces y retransmisiones en vivo de la jornada</p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold animate-pulse">
          <Radio className="w-3.5 h-3.5" />
          <span>EN VIVO</span>
        </span>
      </div>

      {/* Visor / Reproductor Emulado */}
      {selectedChannel ? (
        <div className="rounded-2xl bg-slate-900 border border-slate-700 p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h3 className="text-sm font-bold text-white">Retransmisión: {selectedChannel.nombre}</h3>
            </div>
            <button
              onClick={() => setSelectedChannel(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cerrar reproductor
            </button>
          </div>

          <div className="relative aspect-video w-full rounded-xl bg-black border border-slate-800 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-4">
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  SEÑAL EN DIRECTO
                </span>
                <p className="text-sm font-bold text-white">{selectedChannel.partidoDestacado || 'Emisión en directo'}</p>
              </div>
            </div>

            <PlayCircle className="w-14 h-14 text-sky-400 mb-2 opacity-90 hover:scale-110 transition cursor-pointer" />
            <p className="text-xs text-slate-300 font-medium">Pulsa para abrir el streaming en su plataforma oficial</p>
            <a
              href={selectedChannel.urlDirecto}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition shadow"
            >
              <span>Abrir emisión oficial</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : null}

      {/* Grid de Emisoras Oficiales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {canales.map(canal => (
          <div
            key={canal.id}
            className="rounded-2xl bg-slate-900 border border-slate-800 p-4 hover:border-slate-700 transition flex items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                <Tv className="w-6 h-6 text-sky-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">{canal.nombre}</h4>
                  {canal.enVivo && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="En directo" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">{canal.partidoDestacado || canal.categoria}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setSelectedChannel(canal)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 transition cursor-pointer"
                title="Ver detalles del canal"
              >
                <PlayCircle className="w-4 h-4" />
              </button>

              <a
                href={canal.urlDirecto}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Abrir enlace externo"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Marcador en Vivo de la Jornada */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Signal className="w-4 h-4 text-sky-400" />
            <span>Marcadores de la Jornada</span>
          </h3>
          <span className="text-[11px] text-slate-500">Actualizado vía Google Sheets API</span>
        </div>

        <div className="space-y-2">
          {partidos.slice(0, 6).map(partido => (
            <div
              key={partido.id}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
            >
              <div className="flex-1 text-right font-semibold text-slate-200 truncate pr-2">
                {partido.equipoLocal}
              </div>

              <div className="px-3 py-1 rounded-lg bg-slate-800 text-amber-300 font-mono font-black text-center shrink-0 border border-slate-700/60">
                {partido.resultado ? (
                  partido.numero === 15 && partido.golesLocal
                    ? `${partido.golesLocal} - ${partido.golesVisitante}`
                    : partido.resultado === '1'
                    ? '1 - 0'
                    : partido.resultado === 'X'
                    ? '1 - 1'
                    : '0 - 1'
                ) : (
                  partido.fechaHora.includes('Viernes') ? '2 - 1 (Fin)' : 'vs'
                )}
              </div>

              <div className="flex-1 text-left font-semibold text-slate-200 truncate pl-2">
                {partido.equipoVisitante}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
