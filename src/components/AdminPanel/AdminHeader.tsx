import React from 'react';
import { Sliders, ArrowLeft, RefreshCw, AlertCircle, Shield, CheckCircle, Lock } from 'lucide-react';
import { EstadoJornada, FaseJornada, APP_VERSION } from '../../types';

interface Props {
  estado: EstadoJornada;
  onSwitchToUser: () => void;
  onRefresh: () => void;
  onLockAdmin?: () => void;
  isSyncing?: boolean;
}

export const AdminHeader: React.FC<Props> = ({
  estado,
  onSwitchToUser,
  onRefresh,
  onLockAdmin,
  isSyncing = false,
}) => {
  const faseLabels: Record<FaseJornada, { label: string; color: string }> = {
    FASE_1_APERTURA: { label: 'Fase 1: Apertura', color: 'bg-sky-500/20 text-sky-400 border-sky-500/40' },
    FASE_2_EN_VIVO: { label: 'Fase 2: En Vivo', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
    FASE_3_CIERRE: { label: 'Fase 3: Cierre & Escrutinio', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  };

  const currentFase = faseLabels[estado.fase];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Marca Admin */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToUser}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700 cursor-pointer"
            title="Volver a la App de Usuarios (PWA)"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Ver App Usuarios</span>
          </button>

          {onLockAdmin && (
            <button
              onClick={onLockAdmin}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs font-bold transition border border-rose-800/60 cursor-pointer"
              title="Cerrar y bloquear sesión de Administrador (requerirá PIN)"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Bloquear Admin</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white">Panel Master {APP_VERSION}</h1>
                <span className="text-[10px] font-bold px-1.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Control central de Google Apps Script & Sheets</p>
            </div>
          </div>
        </div>

        {/* Indicador de Jornada Activa, Fase & Sincronización */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <span>Jornada {estado.numeroJornada}</span>
          </span>

          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border hidden md:inline-flex items-center gap-1.5 ${currentFase.color}`}>
            <span className="w-2 h-2 rounded-full bg-current" />
            {currentFase.label}
          </span>

          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95 cursor-pointer"
            title="Sincronizar datos con Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : 'text-sky-400'}`} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
