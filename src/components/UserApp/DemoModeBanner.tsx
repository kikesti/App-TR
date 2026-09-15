import React from 'react';
import { Sparkles, Share2, LogIn, CheckCircle, Info } from 'lucide-react';

interface Props {
  onExitDemo: () => void;
  onShare: () => void;
}

export const DemoModeBanner: React.FC<Props> = ({ onExitDemo, onShare }) => {
  return (
    <div className="bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-purple-500/20 border-b border-amber-500/40 p-3 text-xs shadow-md">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-amber-400 uppercase tracking-wide text-[11px]">
                Modo Demostración Interactivo
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                Invitado
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Prueba los pronósticos 1X2, revisa las probabilidades y simula el sellado del boleto.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={onShare}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Invitar Amigo</span>
          </button>

          <button
            onClick={onExitDemo}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Acceder con mi PIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
