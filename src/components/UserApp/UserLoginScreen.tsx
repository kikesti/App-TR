import React, { useState } from 'react';
import { Lock, Delete, AlertTriangle, Shield, Settings, Sparkles } from 'lucide-react';
import { Jugador, APP_VERSION_MASTER, APP_VERSION_STRING } from '../../types';

interface Props {
  jugadores: Jugador[];
  onLogin: (jugador: Jugador, pin: string) => boolean;
  onOpenAdmin: () => void;
  onEnterDemo?: () => void;
}

export const UserLoginScreen: React.FC<Props> = ({ jugadores, onLogin, onOpenAdmin, onEnterDemo }) => {
  const activos = jugadores.filter(j => j.activo);
  const [selectedId, setSelectedId] = useState<string>(activos[0]?.id || '');
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  const selectedJugador = jugadores.find(j => j.id === selectedId) || activos[0];

  const handleNumClick = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const verifyPin = (pinToTest: string) => {
    if (!selectedJugador) {
      setError('Selecciona un usuario válido');
      return;
    }

    const ok = onLogin(selectedJugador, pinToTest);
    if (!ok) {
      setError('PIN incorrecto. Inténtalo de nuevo.');
      setPin('');
    } else {
      setError('');
      setPin('');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8 animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl p-6 text-slate-100 flex flex-col backdrop-blur-md">
        {/* Cabecera de la App limpia */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
            Temporada Oficial
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {APP_VERSION_STRING}
          </span>
        </div>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700/80 p-1.5 shadow-xl shadow-sky-500/10 mb-3 overflow-hidden flex items-center justify-center">
            <img
              src="/icon-192.png"
              alt="Logo App TR"
              className="w-full h-full object-contain rounded-xl"
              onError={(e) => {
                e.currentTarget.src = '/icon-512.png';
              }}
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">App TR</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Temporada Oficial • {APP_VERSION_MASTER}</p>
        </div>

        {/* Selector de Usuario */}
        <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
          <span>Seleccionar Usuario</span>
          <span className="text-[11px] text-sky-400 font-normal">Hoja JUGADORES</span>
        </label>
        <div className="relative mb-3">
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setPin('');
              setError('');
            }}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 py-3 px-3 text-sm font-medium text-white focus:outline-none focus:border-sky-500 transition cursor-pointer"
          >
            {activos.map(j => (
              <option key={j.id} value={j.id}>
                {j.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Ficha del usuario seleccionado (sin mostrar saldo a terceros) */}
        {selectedJugador && (
          <div className="flex items-center justify-between p-2.5 mb-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
                style={{ backgroundColor: selectedJugador.avatarColor || '#3b82f6' }}
              >
                {selectedJugador.nombre.charAt(0)}
              </div>
              <div className="min-w-0 truncate">
                <p className="font-bold text-slate-100 truncate">{selectedJugador.nombre}</p>
                <p className="text-[10px] text-slate-400 truncate">{selectedJugador.email}</p>
              </div>
            </div>
            {selectedJugador.equipoFavorito && (
              <div className="text-right shrink-0 ml-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/60 text-slate-300 border border-slate-600/50">
                  {selectedJugador.equipoFavorito}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Display de 4 dígitos PIN */}
        <div className="flex flex-col items-center mb-5">
          <p className="text-xs text-slate-400 mb-2 font-medium">Introduce tu PIN de 4 dígitos:</p>
          <div className="flex gap-3">
            {[0, 1, 2, 3].map(index => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-11 h-12 rounded-xl border flex items-center justify-center transition-all ${
                    isFilled
                      ? 'border-sky-400 bg-sky-500/15 text-sky-400 shadow-sm shadow-sky-500/20'
                      : 'border-slate-700 bg-slate-800/50 text-slate-500'
                  }`}
                >
                  {isFilled ? <span className="w-3 h-3 rounded-full bg-sky-400 animate-in zoom-in-50 duration-150"></span> : null}
                </div>
              );
            })}
          </div>

          {error && (
            <p className="mt-2.5 text-xs text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>

        {/* Teclado Numérico */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleNumClick(num)}
              className="py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-sky-600 text-base font-bold text-slate-100 transition shadow-sm active:scale-95 cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="py-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-400 transition cursor-pointer"
          >
            Borrar
          </button>
          <button
            onClick={() => handleNumClick('0')}
            className="py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-sky-600 text-base font-bold text-slate-100 transition shadow-sm active:scale-95 cursor-pointer"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition cursor-pointer"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        {/* Acceso a Modo Demostración */}
        {onEnterDemo && (
          <div className="mb-4">
            <button
              onClick={onEnterDemo}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-sky-500/15 to-purple-500/15 hover:from-amber-500/25 hover:to-sky-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>¿No tienes PIN? Probar Modo Demo</span>
            </button>
          </div>
        )}

        {/* Pie discreto: acceso de gestión con PIN sin desvelar identidad */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Liga TRG • {APP_VERSION_STRING}</span>
          <button
            onClick={onOpenAdmin}
            className="text-slate-500 hover:text-slate-300 transition flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-800/50"
            title="Acceso de gestión con PIN"
          >
            <Lock className="w-3 h-3" />
            <span>Gestión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
