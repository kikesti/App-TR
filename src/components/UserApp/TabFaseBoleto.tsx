import React, { useState } from 'react';
import {
  Shield,
  Trophy,
  Clock,
  Sparkles,
  Shuffle,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Tv,
  Check
} from 'lucide-react';
import { Partido, EstadoJornada, Jugador, SignoQuiniela, GolesPleno, QuinielaBoleto } from '../../types';
import { getClubCrest } from '../../services/crestService';

interface Props {
  partidos: Partido[];
  estado: EstadoJornada;
  currentUser: Jugador | null;
  onSellar: (params: {
    columna1: Record<number, SignoQuiniela>;
    columna2?: Record<number, SignoQuiniela>;
    pleno15: { local: GolesPleno; visitante: GolesPleno };
  }) => void;
  onOpenLogin: () => void;
  lastBoleto?: QuinielaBoleto | null;
}

export const TabFaseBoleto: React.FC<Props> = ({
  partidos,
  estado,
  currentUser,
  onSellar,
  onOpenLogin,
  lastBoleto,
}) => {
  const [columna1, setColumna1] = useState<Record<number, SignoQuiniela>>({});
  const [columna2, setColumna2] = useState<Record<number, SignoQuiniela>>({});
  const showCol2 = true; // Siempre se juegan 2 columnas fijas (Reglamento oficial)
  const [plenoLocal, setPlenoLocal] = useState<GolesPleno>('1');
  const [plenoVisit, setPlenoVisit] = useState<GolesPleno>('0');

  // Partidos 1 a 14
  const matches14 = partidos.filter(p => p.numero <= 14);
  // Partido 15
  const partido15 = partidos.find(p => p.numero === 15) || partidos[14];

  const handleSelectCol1 = (num: number, signo: SignoQuiniela) => {
    setColumna1(prev => ({
      ...prev,
      [num]: prev[num] === signo ? ('' as any) : signo,
    }));
  };

  const handleSelectCol2 = (num: number, signo: SignoQuiniela) => {
    setColumna2(prev => ({
      ...prev,
      [num]: prev[num] === signo ? ('' as any) : signo,
    }));
  };

  const handleCopiarCol1ACol2 = () => {
    setColumna2({ ...columna1 });
  };

  const handleInvertirCol2 = () => {
    const inv: Record<number, SignoQuiniela> = {};
    matches14.forEach(m => {
      const s1 = columna1[m.numero];
      if (s1 === '1') inv[m.numero] = '2';
      else if (s1 === '2') inv[m.numero] = '1';
      else if (s1 === 'X') inv[m.numero] = 'X';
      else inv[m.numero] = 'X';
    });
    setColumna2(inv);
  };

  const handleRellenarProbables = () => {
    const newCol1: Record<number, SignoQuiniela> = {};
    const newCol2: Record<number, SignoQuiniela> = {};
    matches14.forEach(m => {
      if (m.prob1 >= m.probX && m.prob1 >= m.prob2) {
        newCol1[m.numero] = '1';
        newCol2[m.numero] = m.probX >= m.prob2 ? 'X' : '2';
      } else if (m.prob2 >= m.prob1 && m.prob2 >= m.probX) {
        newCol1[m.numero] = '2';
        newCol2[m.numero] = m.prob1 >= m.probX ? '1' : 'X';
      } else {
        newCol1[m.numero] = 'X';
        newCol2[m.numero] = m.prob1 >= m.prob2 ? '1' : '2';
      }
    });
    setColumna1(newCol1);
    setColumna2(newCol2);
  };

  const handleRellenarAleatorio = () => {
    const opciones: SignoQuiniela[] = ['1', 'X', '2'];
    const newCol1: Record<number, SignoQuiniela> = {};
    const newCol2: Record<number, SignoQuiniela> = {};
    matches14.forEach(m => {
      newCol1[m.numero] = opciones[Math.floor(Math.random() * opciones.length)];
      newCol2[m.numero] = opciones[Math.floor(Math.random() * opciones.length)];
    });
    setColumna1(newCol1);
    setColumna2(newCol2);
  };

  const handleLimpiar = () => {
    setColumna1({});
    setColumna2({});
  };

  // Contar partidos completados en col 1 y col 2
  const completadosCol1 = Object.values(columna1).filter(Boolean).length;
  const completadosCol2 = Object.values(columna2).filter(Boolean).length;
  const isCompleto = completadosCol1 === 14 && (!showCol2 || completadosCol2 === 14) && plenoLocal && plenoVisit;

  const handleSubmit = () => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    if (currentUser.saldoJornadas <= 0) {
      alert('🔴 Saldo Agotado: No dispones de jornadas de saldo (Saldo: 0). Contacta al Administrador para renovar tu saldo.');
      return;
    }

    if (completadosCol1 < 14 || (showCol2 && completadosCol2 < 14)) {
      const faltan = 14 - Math.min(completadosCol1, showCol2 ? completadosCol2 : 14);
      if (!confirm(`⚠️ Tienes pronósticos incompletos (faltan ${faltan} eventos para completar ambas columnas). ¿Deseas sellar de todos modos?`)) {
        return;
      }
    }

    if (currentUser.saldoJornadas === 1) {
      alert('⚠️ ¡Atención de Saldo! Te quedará 0 jornadas tras este sellado. Recuerda recargar con el Administrador.');
    }

    onSellar({
      columna1,
      columna2: showCol2 ? columna2 : undefined,
      pleno15: { local: plenoLocal, visitante: plenoVisit },
    });
  };

  const golesOpciones: GolesPleno[] = ['0', '1', '2', 'M'];

  return (
    <div className="space-y-4 pb-40">
      {/* Banner de Estado de la Jornada & Relé */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              estado.abierta
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-amber-400">
                  TEMPORADA {estado.temporada}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs font-bold text-slate-300">
                  Boleto Oficial 14+1
                </span>
              </div>
              <h2 className="text-base font-black text-white">
                Jornada {estado.numeroJornada}: {estado.abierta ? 'Pronósticos Abiertos' : 'Plazo Cerrado'}
              </h2>
            </div>
          </div>

          <div className="text-xs text-slate-300 bg-slate-950/60 rounded-xl px-3 py-2 border border-slate-800/80 flex flex-col justify-center">
            <span className="text-[11px] text-slate-400">Cierre inapelable (Relé T-Y):</span>
            <span className="font-bold text-sky-300">{estado.fechaLimiteTy}</span>
          </div>
        </div>
      </div>

      {/* Barra de Herramientas de Relleno */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRellenarProbables}
            disabled={!estado.abierta}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold transition border border-slate-700 active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Rellena según las probabilidades estadísticas"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Favoritos</span>
          </button>

          <button
            onClick={handleRellenarAleatorio}
            disabled={!estado.abierta}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold transition border border-slate-700 active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Rellena al azar"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Aleatorio</span>
          </button>

          <button
            onClick={handleLimpiar}
            disabled={!estado.abierta}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition border border-slate-800 cursor-pointer"
            title="Limpiar todas las selecciones"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Acciones de Columna 2 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopiarCol1ACol2}
              disabled={!estado.abierta}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold transition border border-slate-700 active:scale-95 text-[11px] cursor-pointer"
              title="Copiar Columna 1 en Columna 2"
            >
              Copiar C1 ➔ C2
            </button>
            <button
              onClick={handleInvertirCol2}
              disabled={!estado.abierta}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold transition border border-slate-700 active:scale-95 text-[11px] cursor-pointer"
              title="Invertir signos (1 a 2, 2 a 1)"
            >
              Invertir C2
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/40 text-emerald-300">
            <span>2 Columnas Obligatorias</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>

      {/* Lista de 14 Partidos Principales */}
      <div className="space-y-2">
        {matches14.map(partido => {
          const crestLocal = getClubCrest(partido.equipoLocal, partido.escudoLocal);
          const crestVisit = getClubCrest(partido.equipoVisitante, partido.escudoVisitante);

          const selCol1 = columna1[partido.numero];
          const selCol2 = columna2[partido.numero];

          return (
            <div
              key={partido.id}
              className={`rounded-2xl bg-slate-900/90 border transition p-3 ${
                selCol1 ? 'border-slate-700/80 shadow-sm' : 'border-slate-800/70'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Info del partido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 text-[11px] text-slate-400">
                    <span className="w-5 h-5 rounded-md bg-slate-800 font-bold text-slate-200 flex items-center justify-center text-[10px]">
                      {partido.numero}
                    </span>
                    <span>{partido.fechaHora}</span>
                    {partido.canalTv && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Tv className="w-3 h-3 text-sky-400" />
                          {partido.canalTv}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Equipos con escudos híbridos */}
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm font-bold text-white">
                    {/* Local */}
                    <div className="flex items-center gap-2 min-w-0">
                      {crestLocal.url ? (
                        <img
                          src={crestLocal.url}
                          alt={partido.equipoLocal}
                          className="w-5 h-5 object-contain shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                          style={{ backgroundColor: crestLocal.bg, color: crestLocal.color }}
                        >
                          {crestLocal.fallbackText}
                        </span>
                      )}
                      <span className="truncate">{partido.equipoLocal}</span>
                    </div>

                    {/* Visitante */}
                    <div className="flex items-center gap-2 min-w-0 justify-end sm:justify-start">
                      {crestVisit.url ? (
                        <img
                          src={crestVisit.url}
                          alt={partido.equipoVisitante}
                          className="w-5 h-5 object-contain shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                          style={{ backgroundColor: crestVisit.bg, color: crestVisit.color }}
                        >
                          {crestVisit.fallbackText}
                        </span>
                      )}
                      <span className="truncate">{partido.equipoVisitante}</span>
                    </div>
                  </div>

                  {/* Barra de probabilidades visual */}
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="w-10 text-right font-medium">1: {partido.prob1}%</span>
                    <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden flex">
                      <div style={{ width: `${partido.prob1}%` }} className="bg-sky-500" />
                      <div style={{ width: `${partido.probX}%` }} className="bg-amber-400" />
                      <div style={{ width: `${partido.prob2}%` }} className="bg-emerald-400" />
                    </div>
                    <span className="w-10 text-left font-medium">2: {partido.prob2}%</span>
                  </div>
                </div>

                {/* Doble Columna Interactiva (1, X, 2) optimizada para móvil */}
                <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 w-full sm:w-auto">
                  {/* Columna 1 */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-sky-400 font-black px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30">
                      C1
                    </span>
                    {(['1', 'X', '2'] as SignoQuiniela[]).map(signo => {
                      const isSelected = selCol1 === signo;
                      return (
                        <button
                          key={`c1-${partido.numero}-${signo}`}
                          disabled={!estado.abierta}
                          onClick={() => handleSelectCol1(partido.numero, signo)}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center transition active:scale-95 cursor-pointer ${
                            isSelected
                              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 ring-2 ring-sky-300'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                          }`}
                        >
                          {signo}
                        </button>
                      );
                    })}
                  </div>

                  {/* Columna 2 (si está activa) */}
                  {showCol2 && (
                    <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                      <span className="text-[10px] text-amber-400 font-black px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                        C2
                      </span>
                      {(['1', 'X', '2'] as SignoQuiniela[]).map(signo => {
                        const isSelected = selCol2 === signo;
                        return (
                          <button
                            key={`c2-${partido.numero}-${signo}`}
                            disabled={!estado.abierta}
                            onClick={() => handleSelectCol2(partido.numero, signo)}
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center transition active:scale-95 cursor-pointer ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 ring-2 ring-amber-200'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                            }`}
                          >
                            {signo}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Partido 15: Pleno al 15 Especial */}
      {partido15 && (
        <div className="rounded-2xl bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/50 p-4 shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
                <Trophy className="w-3.5 h-3.5" />
                PARTIDO 15: PLENO AL 15
              </span>
              <span className="text-xs text-amber-300 font-semibold hidden sm:inline">
                {partido15.fechaHora}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Pronostica los goles exactos (M = 3 o más)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Goles Local */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="text-xs font-bold text-white mb-2 flex items-center justify-between">
                <span>{partido15.equipoLocal} (Local)</span>
                <span className="text-amber-400 text-[11px]">Goles: {plenoLocal}</span>
              </p>
              <div className="grid grid-cols-4 gap-2">
                {golesOpciones.map(g => (
                  <button
                    key={`pleno-loc-${g}`}
                    disabled={!estado.abierta}
                    onClick={() => setPlenoLocal(g)}
                    className={`py-2 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer ${
                      plenoLocal === g
                        ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Goles Visitante */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="text-xs font-bold text-white mb-2 flex items-center justify-between">
                <span>{partido15.equipoVisitante} (Visitante)</span>
                <span className="text-amber-400 text-[11px]">Goles: {plenoVisit}</span>
              </p>
              <div className="grid grid-cols-4 gap-2">
                {golesOpciones.map(g => (
                  <button
                    key={`pleno-vis-${g}`}
                    disabled={!estado.abierta}
                    onClick={() => setPlenoVisit(g)}
                    className={`py-2 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer ${
                      plenoVisit === g
                        ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Sellado Flotante Inferior */}
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-20 p-3 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className={completadosCol1 === 14 ? 'text-emerald-400' : 'text-amber-400'}>
                {completadosCol1}/14 partidos
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">Pleno: {plenoLocal}-{plenoVisit}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {currentUser ? `Coste: 1 jornada (Saldo actual: ${currentUser.saldoJornadas})` : 'Inicia sesión para sellar'}
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!estado.abierta || (currentUser && currentUser.saldoJornadas <= 0)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition active:scale-95 shadow-lg cursor-pointer ${
              !estado.abierta
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : currentUser && currentUser.saldoJornadas <= 0
                ? 'bg-rose-900/60 text-rose-300 border border-rose-700 cursor-not-allowed'
                : isCompleto
                ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/25 ring-2 ring-sky-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{!currentUser ? 'Iniciar Sesión' : 'Sellar Boleto Oficial'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
