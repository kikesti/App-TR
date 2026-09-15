import React, { useState } from 'react';
import {
  Layers,
  Upload,
  Radio,
  FileCheck2,
  AlertOctagon,
  Sparkles,
  Send,
  Download,
  CheckCircle,
  FileText
} from 'lucide-react';
import { EstadoJornada, FaseJornada } from '../../types';
import { AdminJornadaImageScanner, ExtractionResult } from './AdminJornadaImageScanner';

interface Props {
  estado: EstadoJornada;
  onCambiarFase: (fase: FaseJornada) => void;
  onImportarJson: (json: string) => { success: boolean; message: string };
  onForzarCierreTy: () => void;
  onEscrutar: () => { success: boolean; message: string; informe: string };
  onEnviarAnuncio: () => void;
}

const SAMPLE_JSON_PARTIDOS = JSON.stringify([
  { "local": "Real Madrid", "visitante": "Atlético de Madrid", "fechaHora": "Sábado 21:00", "canalTv": "DAZN LaLiga", "prob1": 48, "probX": 30, "prob2": 22 },
  { "local": "FC Barcelona", "visitante": "Sevilla FC", "fechaHora": "Domingo 21:00", "canalTv": "Movistar+ LaLiga", "prob1": 65, "probX": 21, "prob2": 14 },
  { "local": "Athletic Club", "visitante": "Real Sociedad", "fechaHora": "Sábado 18:30", "canalTv": "DAZN LaLiga", "prob1": 44, "probX": 32, "prob2": 24 },
  { "local": "Real Betis", "visitante": "Villarreal CF", "fechaHora": "Domingo 18:30", "canalTv": "Movistar+ LaLiga", "prob1": 40, "probX": 31, "prob2": 29 },
  { "local": "Valencia CF", "visitante": "Girona FC", "fechaHora": "Sábado 16:15", "canalTv": "DAZN LaLiga", "prob1": 36, "probX": 29, "prob2": 35 },
  { "local": "Celta de Vigo", "visitante": "Osasuna", "fechaHora": "Viernes 21:00", "canalTv": "Gol Play", "prob1": 46, "probX": 30, "prob2": 24 },
  { "local": "RCD Mallorca", "visitante": "Getafe CF", "fechaHora": "Sábado 14:00", "canalTv": "Movistar+ LaLiga", "prob1": 42, "probX": 35, "prob2": 23 },
  { "local": "Rayo Vallecano", "visitante": "Deportivo Alavés", "fechaHora": "Domingo 14:00", "canalTv": "DAZN LaLiga", "prob1": 45, "probX": 31, "prob2": 24 },
  { "local": "UD Las Palmas", "visitante": "RCD Espanyol", "fechaHora": "Domingo 16:15", "canalTv": "Movistar+ LaLiga", "prob1": 39, "probX": 32, "prob2": 29 },
  { "local": "Real Valladolid", "visitante": "CD Leganés", "fechaHora": "Viernes 19:00", "canalTv": "DAZN LaLiga", "prob1": 38, "probX": 33, "prob2": 29 },
  { "local": "Real Zaragoza", "visitante": "Sporting de Gijón", "fechaHora": "Sábado 18:30", "canalTv": "LaLiga TV Hypermotion", "prob1": 41, "probX": 34, "prob2": 25 },
  { "local": "Levante UD", "visitante": "Real Valladolid", "fechaHora": "Domingo 18:30", "canalTv": "LaLiga TV Hypermotion", "prob1": 45, "probX": 30, "prob2": 25 },
  { "local": "Sevilla FC", "visitante": "Real Sociedad", "fechaHora": "Sábado 21:00", "canalTv": "Movistar+ LaLiga", "prob1": 36, "probX": 32, "prob2": 32 },
  { "local": "Villarreal CF", "visitante": "Celta de Vigo", "fechaHora": "Domingo 16:15", "canalTv": "DAZN LaLiga", "prob1": 52, "probX": 26, "prob2": 22 },
  { "local": "Real Madrid", "visitante": "FC Barcelona", "fechaHora": "Domingo 21:00 (Pleno al 15)", "canalTv": "Movistar+ LaLiga", "prob1": 42, "probX": 25, "prob2": 33 }
], null, 2);

export const AdminPhaseControl: React.FC<Props> = ({
  estado,
  onCambiarFase,
  onImportarJson,
  onForzarCierreTy,
  onEscrutar,
  onEnviarAnuncio,
}) => {
  const [importMode, setImportMode] = useState<'scanner' | 'manual'>('scanner');
  const [jsonText, setJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string>('');
  const [escrutinioReport, setEscrutinioReport] = useState<string>('');

  const handleApplyFromScanner = (data: ExtractionResult, jsonString: string) => {
    setJsonText(jsonString);
    const res = onImportarJson(jsonString);
    setImportStatus(res.message);
    if (res.success) {
      alert(`✅ ¡15 partidos importados y actualizados con éxito para la Jornada ${data.numeroJornada || estado.numeroJornada}!`);
    } else {
      alert(`⚠️ ${res.message}`);
    }
  };

  const handleImport = () => {
    if (!jsonText.trim()) {
      setImportStatus('Pega primero el JSON con los 15 partidos');
      return;
    }
    const res = onImportarJson(jsonText);
    setImportStatus(res.message);
  };

  const handleLoadSample = () => {
    setJsonText(SAMPLE_JSON_PARTIDOS);
    setImportStatus('Plantilla oficial de 15 partidos cargada. Pulsa "Procesar e Importar".');
  };

  const handleExecuteEscrutinio = () => {
    const res = onEscrutar();
    if (res.success) {
      setEscrutinioReport(res.informe);
      alert('🏆 ' + res.message);
    } else {
      alert('⚠️ ' + res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pasos de Fase (Workflow 1 -> 2 -> 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Paso 1: Apertura */}
        <div className={`p-4 rounded-2xl border transition relative ${
          estado.fase === 'FASE_1_APERTURA'
            ? 'bg-sky-950/40 border-sky-500/70 shadow-lg shadow-sky-500/10'
            : 'bg-slate-900 border-slate-800 opacity-80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400">
              PASO 1
            </span>
            {estado.fase === 'FASE_1_APERTURA' && (
              <span className="text-xs text-sky-400 font-bold animate-pulse">● ACTIVO</span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Fase 1: Apertura</h3>
          <p className="text-xs text-slate-400 mb-3">
            Importación de 15 partidos vía JSON, asignación automática de escudos y apertura de plazos.
          </p>
          <button
            onClick={() => onCambiarFase('FASE_1_APERTURA')}
            className="w-full py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition active:scale-95 cursor-pointer"
          >
            Activar Apertura
          </button>
        </div>

        {/* Paso 2: En Vivo */}
        <div className={`p-4 rounded-2xl border transition relative ${
          estado.fase === 'FASE_2_EN_VIVO'
            ? 'bg-amber-950/40 border-amber-500/70 shadow-lg shadow-amber-500/10'
            : 'bg-slate-900 border-slate-800 opacity-80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
              PASO 2
            </span>
            {estado.fase === 'FASE_2_EN_VIVO' && (
              <span className="text-xs text-amber-400 font-bold animate-pulse">● ACTIVO</span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Fase 2: En Vivo</h3>
          <p className="text-xs text-slate-400 mb-3">
            Cierre de sellado de boletos, seguimiento de partidos en juego y forzado de emergencia T-Y.
          </p>
          <button
            onClick={() => onCambiarFase('FASE_2_EN_VIVO')}
            className="w-full py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition active:scale-95 cursor-pointer"
          >
            Activar Modo En Vivo
          </button>
        </div>

        {/* Paso 3: Cierre */}
        <div className={`p-4 rounded-2xl border transition relative ${
          estado.fase === 'FASE_3_CIERRE'
            ? 'bg-emerald-950/40 border-emerald-500/70 shadow-lg shadow-emerald-500/10'
            : 'bg-slate-900 border-slate-800 opacity-80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
              PASO 3
            </span>
            {estado.fase === 'FASE_3_CIERRE' && (
              <span className="text-xs text-emerald-400 font-bold animate-pulse">● ACTIVO</span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Fase 3: Cierre & Escrutinio</h3>
          <p className="text-xs text-slate-400 mb-3">
            Escrutinio matemático de quinielas, asignación de puntos, ranking e informe global.
          </p>
          <button
            onClick={() => onCambiarFase('FASE_3_CIERRE')}
            className="w-full py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition active:scale-95 cursor-pointer"
          >
            Activar Cierre Oficial
          </button>
        </div>
      </div>

      {/* DETALLE FASE 1: IMPORTADOR DE PARTIDOS (MODO IMAGEN IA O JSON MANUAL) */}
      <div className="space-y-3">
        {/* Selector de Método de Carga */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-2xl">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setImportMode('scanner')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                importMode === 'scanner'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Escanear Captura con IA (Gemini Visión)</span>
            </button>

            <button
              onClick={() => setImportMode('manual')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                importMode === 'manual'
                  ? 'bg-slate-800 text-sky-400 border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Pegar JSON Manual</span>
            </button>
          </div>

          <button
            onClick={onEnviarAnuncio}
            className="hidden sm:flex px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>Anunciar Jornada (Push + Email)</span>
          </button>
        </div>

        {importMode === 'scanner' ? (
          <AdminJornadaImageScanner onApplyMatches={handleApplyFromScanner} />
        ) : (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-sky-400" />
                <h4 className="text-sm font-bold text-white">Importador Masivo JSON (Fase 1)</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLoadSample}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                >
                  Cargar Ejemplo 15 Partidos
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Pega aquí el array JSON con los 15 partidos. El sistema limpiará comillas tipográficas, generará escudos híbridos y calculará probabilidades automáticamente.
            </p>

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="[ { &quot;local&quot;: &quot;Real Madrid&quot;, &quot;visitante&quot;: &quot;Atlético&quot;, ... } ]"
              rows={6}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />

            {importStatus && (
              <p className="text-xs font-semibold text-sky-400 bg-sky-950/40 border border-sky-800 p-2 rounded-lg">
                {importStatus}
              </p>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleImport}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition active:scale-95 shadow cursor-pointer"
              >
                Procesar e Importar Partidos
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETALLE FASE 2: RELÉ T-Y DE EMERGENCIA */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-rose-400" />
          <h4 className="text-sm font-bold text-white">Relé T-Y: Cierre Inmediato de Emergencia (Fase 2)</h4>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Si necesitas clausurar el sellado de boletos antes del horario programado del sábado, este botón forzará el cierre inapelable impidiendo nuevos envíos de quinielas.
        </p>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-300 block font-semibold">
              Estado de Sellado: {estado.abierta ? 'ABIERTO (Aceptando boletos)' : 'CERRADO (Bloqueado)'}
            </span>
            <span className="text-[11px] text-slate-500">
              {estado.releForzadoTy ? '⚠️ Relé T-Y Forzado manualmente por el Administrador' : 'Controlado por temporizador'}
            </span>
          </div>

          <button
            onClick={onForzarCierreTy}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Forzar Cierre T-Y Inmediato</span>
          </button>
        </div>
      </div>

      {/* DETALLE FASE 3: ESCRUTINIO MATEMÁTICO */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Escrutinio Matemático de la Jornada (Fase 3)</h4>
          </div>
          <button
            onClick={handleExecuteEscrutinio}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ejecutar Escrutinio Matemático</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Compara los resultados reales de los 14 partidos y el Pleno al 15 contra todas las quinielas selladas en la hoja QUINIELAS. Suma automáticamente los puntos a los jugadores en la hoja JUGADORES y genera el informe oficial.
        </p>

        {escrutinioReport && (
          <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Informe Oficial Generado
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(escrutinioReport);
                  alert('Informe copiado al portapapeles.');
                }}
                className="text-[11px] text-sky-400 hover:underline"
              >
                Copiar Informe
              </button>
            </div>
            <pre className="font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {escrutinioReport}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
