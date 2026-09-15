import React from 'react';
import { Shield, User, LogOut, AlertCircle, Sparkles, Layers, Sliders, RefreshCw, Lock } from 'lucide-react';
import { Jugador, EstadoJornada, APP_VERSION_STRING } from '../../types';
import { PWAInstallButton } from '../PWAInstallButton';

interface Props {
  currentUser: Jugador | null;
  estado: EstadoJornada;
  isDemoMode?: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  onSwitchToAdmin: () => void;
  onSyncRemote?: () => void;
  isSyncing?: boolean;
}

export const UserHeader: React.FC<Props> = ({
  currentUser,
  estado,
  isDemoMode = false,
  onOpenLogin,
  onLogout,
  onSwitchToAdmin,
  onSyncRemote,
  isSyncing = false,
}) => {
  return (
    <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
      {/* Barra principal superior */}
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo & Marca */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 p-0.5 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="/icon-192.png"
              alt="App TR Logo"
              className="w-full h-full object-contain rounded-[9px]"
              onError={(e) => {
                e.currentTarget.src = '/icon-512.png';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
                APP TR
              </h1>
              <span
                className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60 select-none"
                title={`App TR ${APP_VERSION_STRING}`}
              >
                {APP_VERSION_STRING}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
              <span>Jornada {estado.numeroJornada}</span>
              <span>•</span>
              <span className={`font-semibold ${
                estado.abierta ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {estado.abierta ? 'Plazo Abierto' : 'Cerrado'}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones del encabezado: PWA, Sincronización, Saldo, Usuario, Admin switch */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onSyncRemote && (
            <button
              onClick={onSyncRemote}
              disabled={isSyncing}
              className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              title="Sincronizar datos con Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden md:inline">Sincronizar</span>
            </button>
          )}

          <div className="hidden sm:block">
            <PWAInstallButton />
          </div>

          {/* Estado de Usuario */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-800">
              {isDemoMode ? (
                <div className="flex flex-col items-end px-2 py-1 rounded-xl border border-amber-500/40 bg-amber-950/40 text-amber-300 text-right">
                  <span className="text-[9px] text-amber-400/80 font-bold leading-none mb-0.5">Modo</span>
                  <span className="text-xs font-black leading-none">DEMO</span>
                </div>
              ) : (
                /* Badge de saldo interactivo optimizado para móvil */
                <div
                  className={`flex flex-col items-end px-2 py-1 rounded-xl border text-right ${
                    currentUser.saldoJornadas > 1
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : currentUser.saldoJornadas === 1
                      ? 'bg-amber-950/60 border-amber-500/70 text-amber-300 animate-pulse'
                      : 'bg-rose-950/60 border-rose-500/70 text-rose-300 animate-pulse'
                  }`}
                >
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium leading-none mb-0.5">Saldo</span>
                  <span className="text-xs font-black leading-none">
                    {currentUser.saldoJornadas} <span className="hidden sm:inline">{currentUser.saldoJornadas === 1 ? 'jornada' : 'jornadas'}</span><span className="sm:hidden">jor</span>
                  </span>
                </div>
              )}

              {/* Botón de Perfil / Logout */}
              <button
                onClick={onLogout}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-rose-400 transition cursor-pointer"
                title={`Cerrar sesión (${currentUser.nombre})`}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerta de Saldo Automática (si saldo == 1 o saldo == 0) */}
      {currentUser && currentUser.saldoJornadas <= 1 && (
        <div
          className={`px-4 py-1.5 text-xs font-bold flex items-center justify-between border-t ${
            currentUser.saldoJornadas === 1
              ? 'bg-amber-950/90 border-amber-800 text-amber-200'
              : 'bg-rose-950/90 border-rose-800 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {currentUser.saldoJornadas === 1
                ? '⚠️ ¡ATENCIÓN! Te queda solo 1 jornada de saldo restante. Contacta al administrador para recargar.'
                : '🚨 ¡SALDO AGOTADO! Tienes 0 jornadas disponibles. No podrás sellar el boleto hasta recargar saldo.'}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
