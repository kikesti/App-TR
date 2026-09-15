import React, { useState } from 'react';
import { Megaphone, AlertCircle, Info, CheckCircle2, Pause, Play } from 'lucide-react';
import { MarqueeConfig } from '../types';

interface Props {
  config: MarqueeConfig;
}

export const MarqueeBanner: React.FC<Props> = ({ config }) => {
  const [isPaused, setIsPaused] = useState(false);

  if (!config.activa || !config.texto.trim()) {
    return null;
  }

  const typeStyles = {
    warning: {
      bg: 'bg-amber-950/70 border-amber-500/40 text-amber-200',
      badge: 'bg-amber-500 text-slate-950',
      icon: AlertCircle,
      label: 'AVISO URGENTE',
    },
    urgent: {
      bg: 'bg-rose-950/70 border-rose-500/40 text-rose-200',
      badge: 'bg-rose-500 text-white',
      icon: Megaphone,
      label: 'EN VIVO',
    },
    info: {
      bg: 'bg-sky-950/70 border-sky-500/40 text-sky-200',
      badge: 'bg-sky-500 text-slate-950',
      icon: Info,
      label: 'INFO TRG',
    },
    success: {
      bg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200',
      badge: 'bg-emerald-500 text-slate-950',
      icon: CheckCircle2,
      label: 'OFICIAL',
    },
  }[config.tipo] || {
    bg: 'bg-slate-900 border-slate-700 text-slate-200',
    badge: 'bg-slate-700 text-white',
    icon: Megaphone,
    label: 'COMUNICADO',
  };

  const Icon = typeStyles.icon;

  return (
    <div
      id="marquee-top-bar"
      className={`relative overflow-hidden border-b py-2 px-3 flex items-center transition-all ${typeStyles.bg}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(prev => !prev)}
    >
      {/* Badge fijo a la izquierda */}
      <div className="z-10 flex items-center gap-1.5 shrink-0 pr-3 border-r border-slate-700/50 mr-2">
        <span className={`inline-flex items-center gap-1 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full ${typeStyles.badge}`}>
          <Icon className="w-3 h-3" />
          {typeStyles.label}
        </span>
      </div>

      {/* Contenedor del ticker continuo */}
      <div className="overflow-hidden relative w-full flex items-center">
        <div
          className="whitespace-nowrap inline-block font-medium text-xs tracking-wide"
          style={{
            animation: `marquee 28s linear infinite`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          <span className="inline-block mr-12">{config.texto}</span>
          <span className="inline-block mr-12">•</span>
          <span className="inline-block mr-12">{config.texto}</span>
          <span className="inline-block mr-12">•</span>
        </div>
      </div>

      {/* Botón de pausa sutil */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsPaused(!isPaused);
        }}
        className="z-10 shrink-0 ml-2 p-1 text-slate-400 hover:text-slate-200 transition opacity-70 hover:opacity-100"
        title={isPaused ? 'Reanudar marquesina' : 'Pausar marquesina'}
      >
        {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
