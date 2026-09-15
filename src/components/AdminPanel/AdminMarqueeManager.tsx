import React, { useState } from 'react';
import { Megaphone, Check, ToggleLeft, ToggleRight, Sparkles, MessageSquare } from 'lucide-react';
import { ConfiguracionMarquesina } from '../../types';

interface Props {
  marquesina: ConfiguracionMarquesina;
  numeroJornada?: number;
  onUpdateMarquesina: (config: ConfiguracionMarquesina) => void;
}

export const AdminMarqueeManager: React.FC<Props> = ({
  marquesina,
  numeroJornada = 7,
  onUpdateMarquesina,
}) => {
  const mensajesPredeterminados = [
    {
      tipo: 'urgent' as const,
      texto: '⏰ ¡ATENCIÓN! Quedan menos de 2 horas para el cierre definitivo de apuestas (Relé T-Y). Sella tu boleto antes de las 13:30.',
      titulo: 'Aviso Urgente Cierre T-Y',
    },
    {
      tipo: 'info' as const,
      texto: `⚽ ¡Jornada ${numeroJornada} abierta! Consulta los 15 partidos y recuerda verificar tu saldo de jornadas en la sección Perfil.`,
      titulo: 'Apertura de Jornada',
    },
    {
      tipo: 'warning' as const,
      texto: '⚠️ Recordatorio a jugadores con 1 sola jornada restante: Solicita tu recarga antes del inicio de los partidos.',
      titulo: 'Alerta de Saldo Mínimo',
    },
    {
      tipo: 'success' as const,
      texto: '🏆 ¡Escrutinio completado! La clasificación general ha sido actualizada con los nuevos puntos.',
      titulo: 'Fin de Escrutinio',
    },
    {
      tipo: 'info' as const,
      texto: '🔴 Partidos en directo: Sigue las retransmisiones oficiales en la pestaña TV (Central de Directos).',
      titulo: 'Directo TV',
    },
  ];

  const [activo, setActivo] = useState(marquesina.activo);
  const [texto, setTexto] = useState(marquesina.texto);
  const [tipo, setTipo] = useState(marquesina.tipo);
  const [saved, setSaved] = useState(false);

  const handleApplyPreset = (preset: { texto: string; tipo: typeof marquesina.tipo }) => {
    setTexto(preset.texto);
    setTipo(preset.tipo);
  };

  const handleSave = () => {
    onUpdateMarquesina({
      activo,
      texto: texto.trim(),
      tipo,
      velocidad: 30,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Control de Marquesina Superior</h3>
            <p className="text-xs text-slate-400">Barra de anuncios desplazables en tiempo real</p>
          </div>
        </div>

        {/* Interruptor de activación */}
        <button
          onClick={() => setActivo(!activo)}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
            activo
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {activo ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
          <span>{activo ? 'MARQUESINA ACTIVA' : 'DESACTIVADA'}</span>
        </button>
      </div>

      {/* Editor del Mensaje */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-4">
        {/* Selector de Tipo / Tono */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-2 block">Tono del Anuncio</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['info', 'warning', 'urgent', 'success'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition border cursor-pointer ${
                  tipo === t
                    ? t === 'urgent'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                      : t === 'warning'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                      : t === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                {t === 'urgent' ? '🚨 Urgente' : t === 'warning' ? '⚠️ Alerta' : t === 'success' ? '🏆 Éxito' : 'ℹ️ Informativo'}
              </button>
            ))}
          </div>
        </div>

        {/* Texto Personalizado */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-2 block">Texto del Mensaje</label>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white focus:outline-none focus:border-sky-500"
            placeholder="Escribe aquí el texto que se desplazará continuamente por la parte superior de la app..."
          />
        </div>

        {/* Mensajes Preprogramados */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-2 block flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Plantillas Preprogramadas</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {mensajesPredeterminados.map((preset, i) => (
              <button
                key={i}
                onClick={() => handleApplyPreset(preset)}
                className="text-left p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer group"
              >
                <p className="text-xs font-bold text-sky-400 group-hover:text-sky-300">{preset.titulo}</p>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{preset.texto}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Guardar */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition active:scale-95 cursor-pointer"
          >
            {saved ? <Check className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            <span>{saved ? '¡Marquesina Actualizada!' : 'Publicar Marquesina'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
