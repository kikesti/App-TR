import React, { useState } from 'react';
import { Edit, Save, Check, Sparkles, Tv, Calendar, Shield, Camera, Trash2, Calculator } from 'lucide-react';
import { Partido, SignoQuiniela, GolesPleno } from '../../types';
import { getClubCrest } from '../../services/crestService';
import { calculateMatchProbabilities } from '../../services/oddsCalculator';
import { AdminJornadaImageScanner, ExtractionResult } from './AdminJornadaImageScanner';

interface Props {
  partidos: Partido[];
  onSavePartidos: (partidos: Partido[]) => void;
}

export const AdminMatchesEditor: React.FC<Props> = ({ partidos, onSavePartidos }) => {
  const [editableMatches, setEditableMatches] = useState<Partido[]>(partidos);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleApplyFromScanner = (data: ExtractionResult) => {
    const nuevos: Partido[] = data.partidos.slice(0, 15).map((item, index) => {
      const num = index + 1;
      const local = item.local || `Equipo L${num}`;
      const visitante = item.visitante || `Equipo V${num}`;
      const localCrest = getClubCrest(local);
      const visitCrest = getClubCrest(visitante);

      return {
        id: num,
        numero: num,
        equipoLocal: local,
        equipoVisitante: visitante,
        escudoLocal: localCrest.url,
        escudoVisitante: visitCrest.url,
        fechaHora: item.fechaHora || 'Horario por confirmar',
        canalTv: item.canalTv || 'Directo TV',
        prob1: Number(item.prob1) || 45,
        probX: Number(item.probX) || 30,
        prob2: Number(item.prob2) || 25,
      };
    });

    setEditableMatches(nuevos);
    onSavePartidos(nuevos);
    setShowScanner(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    alert(`✅ ¡15 partidos extraídos desde la captura y guardados en el editor!`);
  };

  const handleFieldChange = (index: number, field: keyof Partido, value: any) => {
    const updated = [...editableMatches];
    updated[index] = { ...updated[index], [field]: value };
    setEditableMatches(updated);
  };

  const handleSimulateResults = () => {
    const signos: SignoQuiniela[] = ['1', 'X', '2'];
    const updated = editableMatches.map((m, idx) => {
      if (m.numero <= 14) {
        // Asignar resultado basado en probabilidades con sesgo
        const rand = Math.random() * 100;
        let res: SignoQuiniela = '1';
        if (rand < m.prob1) res = '1';
        else if (rand < m.prob1 + m.probX) res = 'X';
        else res = '2';
        return { ...m, resultado: res };
      } else {
        // Pleno al 15
        const goles: GolesPleno[] = ['0', '1', '2', 'M'];
        return {
          ...m,
          golesLocal: '2' as GolesPleno,
          golesVisitante: '1' as GolesPleno,
        };
      }
    });
    setEditableMatches(updated);
  };

  const handleRecalculateOdds = () => {
    const updated = editableMatches.map((m) => {
      if (m.equipoLocal && m.equipoVisitante) {
        const calc = calculateMatchProbabilities(m.equipoLocal, m.equipoVisitante);
        return {
          ...m,
          prob1: calc.prob1,
          probX: calc.probX,
          prob2: calc.prob2,
        };
      }
      return m;
    });
    setEditableMatches(updated);
    onSavePartidos(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    alert('✅ ¡Probabilidades 1X2 calculadas y actualizadas para todos los partidos!');
  };

  const handleSave = () => {
    onSavePartidos(editableMatches);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleClearMatches = () => {
    const confirmacion = window.confirm(
      '⚠️ ¿Estás seguro de que deseas borrar los partidos de la jornada actual?\n\nEsta acción limpiará los 15 partidos (equipos, resultados y horas) para dejar la plantilla lista para la siguiente jornada una vez emitido el PDF.'
    );
    if (!confirmacion) return;

    const cleared: Partido[] = Array.from({ length: 15 }, (_, idx) => {
      const num = idx + 1;
      return {
        id: num,
        numero: num,
        equipoLocal: '',
        equipoVisitante: '',
        escudoLocal: '',
        escudoVisitante: '',
        fechaHora: 'Horario por confirmar',
        canalTv: 'Directo TV',
        prob1: 33,
        probX: 34,
        prob2: 33,
        resultado: undefined,
        golesLocal: undefined,
        golesVisitante: undefined,
      };
    });

    setEditableMatches(cleared);
    onSavePartidos(cleared);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    alert('✅ Partidos de la jornada borrados con éxito. Listo para configurar la nueva jornada.');
  };

  return (
    <div className="space-y-4">
      {/* Barra de Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Edit className="w-4 h-4 text-sky-400" />
            <span>Editor Manual de Partidos (14 + Pleno al 15)</span>
          </h3>
          <p className="text-xs text-slate-400">Modifica equipos, fechas, emisoras y resultados reales</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowScanner(!showScanner)}
            className={`px-3 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
              showScanner
                ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-slate-950 shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{showScanner ? 'Cerrar Escáner IA' : 'Escanear Captura con IA'}</span>
          </button>

          <button
            onClick={handleSimulateResults}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            title="Genera resultados automáticamente según probabilidades para probar el escrutinio"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autocompletar Resultados</span>
          </button>

          <button
            onClick={handleRecalculateOdds}
            className="px-3 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-semibold text-xs border border-indigo-500/30 transition flex items-center gap-1.5 cursor-pointer"
            title="Calcula automáticamente las probabilidades 1X2 según la fuerza de los equipos y la ventaja de campo"
          >
            <Calculator className="w-3.5 h-3.5 text-indigo-400" />
            <span>Calcular Porcentajes 1X2</span>
          </button>

          <button
            onClick={handleClearMatches}
            className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-semibold text-xs border border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer"
            title="Borra los 15 partidos para preparar una nueva jornada tras emitir el PDF"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Borrar Partidos Jornada</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition active:scale-95 shadow flex items-center gap-1.5 cursor-pointer"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-emerald-950" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? '¡Guardado!' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>

      {/* Escáner Inteligente si está activo */}
      {showScanner && (
        <div className="mb-4">
          <AdminJornadaImageScanner onApplyMatches={handleApplyFromScanner} />
        </div>
      )}

      {/* Lista de Partidos */}
      <div className="space-y-2">
        {editableMatches.map((partido, index) => {
          const isPleno = partido.numero === 15;

          return (
            <div
              key={partido.id}
              className={`p-3.5 rounded-2xl border transition ${
                isPleno
                  ? 'bg-amber-950/20 border-amber-500/50'
                  : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Número y Equipos */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    isPleno ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-200'
                  }`}>
                    {partido.numero}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 min-w-0">
                    <input
                      type="text"
                      value={partido.equipoLocal}
                      onChange={(e) => handleFieldChange(index, 'equipoLocal', e.target.value)}
                      placeholder="Equipo Local"
                      className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      value={partido.equipoVisitante}
                      onChange={(e) => handleFieldChange(index, 'equipoVisitante', e.target.value)}
                      placeholder="Equipo Visitante"
                      className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Fecha y TV */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={partido.fechaHora}
                    onChange={(e) => handleFieldChange(index, 'fechaHora', e.target.value)}
                    placeholder="Día y hora"
                    className="w-36 rounded-xl bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                  />
                  <input
                    type="text"
                    value={partido.canalTv || ''}
                    onChange={(e) => handleFieldChange(index, 'canalTv', e.target.value)}
                    placeholder="Emisora TV"
                    className="w-32 rounded-xl bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Probabilidades 1X2 */}
                <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800 text-[11px]">
                  <span className="text-sky-400 font-bold">1:</span>
                  <input
                    type="number"
                    value={partido.prob1}
                    onChange={(e) => handleFieldChange(index, 'prob1', Number(e.target.value) || 0)}
                    className="w-9 text-center bg-slate-900 rounded border border-slate-700 text-white font-mono text-[11px] py-0.5"
                  />
                  <span className="text-amber-400 font-bold">X:</span>
                  <input
                    type="number"
                    value={partido.probX}
                    onChange={(e) => handleFieldChange(index, 'probX', Number(e.target.value) || 0)}
                    className="w-9 text-center bg-slate-900 rounded border border-slate-700 text-white font-mono text-[11px] py-0.5"
                  />
                  <span className="text-emerald-400 font-bold">2:</span>
                  <input
                    type="number"
                    value={partido.prob2}
                    onChange={(e) => handleFieldChange(index, 'prob2', Number(e.target.value) || 0)}
                    className="w-9 text-center bg-slate-900 rounded border border-slate-700 text-white font-mono text-[11px] py-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (partido.equipoLocal && partido.equipoVisitante) {
                        const c = calculateMatchProbabilities(partido.equipoLocal, partido.equipoVisitante);
                        const updated = [...editableMatches];
                        updated[index] = { ...updated[index], prob1: c.prob1, probX: c.probX, prob2: c.prob2 };
                        setEditableMatches(updated);
                      }
                    }}
                    title="Calcular probabilidades automáticamente para este partido"
                    className="ml-1 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Selector de Resultado Real */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold mr-1">Resultado:</span>
                  {!isPleno ? (
                    (['1', 'X', '2'] as SignoQuiniela[]).map(signo => (
                      <button
                        key={`res-${partido.numero}-${signo}`}
                        onClick={() => handleFieldChange(index, 'resultado', partido.resultado === signo ? undefined : signo)}
                        className={`w-8 h-8 rounded-xl font-bold text-xs transition cursor-pointer ${
                          partido.resultado === signo
                            ? 'bg-emerald-500 text-slate-950 shadow ring-2 ring-emerald-300'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                        }`}
                      >
                        {signo}
                      </button>
                    ))
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={partido.golesLocal || '1'}
                        onChange={(e) => handleFieldChange(index, 'golesLocal', e.target.value)}
                        className="rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white"
                      >
                        {['0', '1', '2', 'M'].map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <span className="text-slate-500">-</span>
                      <select
                        value={partido.golesVisitante || '0'}
                        onChange={(e) => handleFieldChange(index, 'golesVisitante', e.target.value)}
                        className="rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white"
                      >
                        {['0', '1', '2', 'M'].map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
