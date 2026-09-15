import React, { useState } from 'react';
import { ShieldCheck, Delete, User, Lock, AlertTriangle } from 'lucide-react';
import { Jugador, APP_VERSION_MASTER } from '../../types';

interface Props {
  jugadores: Jugador[];
  onLogin: (jugador: Jugador, pin: string) => boolean;
  onClose?: () => void;
  isOpen: boolean;
}

export const LoginModal: React.FC<Props> = ({ jugadores, onLogin, onClose, isOpen }) => {
  const activos = jugadores.filter(j => j.activo);
  const [selectedId, setSelectedId] = useState<string>(activos[0]?.id || '');
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

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
    const jugador = jugadores.find(j => j.id === selectedId);
    if (!jugador) {
      setError('Selecciona un usuario válido');
      return;
    }

    const ok = onLogin(jugador, pinToTest);
    if (!ok) {
      setError('PIN incorrecto. Inténtalo de nuevo.');
      setPin('');
    } else {
      setError('');
      setPin('');
    }
  };

  const selectedJugador = jugadores.find(j => j.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow">
            <img
              src="/icon-192.png"
              alt="Logo App TR"
              className="w-full h-full object-contain rounded-[9px]"
              onError={(e) => {
                e.currentTarget.src = '/icon-512.png';
              }}
            />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Acceso a App TR</h2>
            <p className="text-xs text-slate-400">{APP_VERSION_MASTER} • Autenticación PIN</p>
          </div>
        </div>

        {/* Selector de Usuario Activo */}
        <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
          <span>Seleccionar Usuario</span>
          <span className="text-[11px] text-sky-400 font-normal">Hoja JUGADORES</span>
        </label>
        <div className="relative mb-4">
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setPin('');
              setError('');
            }}
            className="w-full rounded-xl bg-slate-800/90 border border-slate-700 py-2.5 px-3 text-sm text-white focus:outline-none focus:border-sky-500 transition cursor-pointer"
          >
            {activos.map(j => (
              <option key={j.id} value={j.id}>
                {j.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Info del usuario seleccionado (sin saldo expuesto) */}
        {selectedJugador && (
          <div className="flex items-center justify-between p-2.5 mb-4 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                style={{ backgroundColor: selectedJugador.avatarColor || '#3b82f6' }}
              >
                {selectedJugador.nombre.charAt(0)}
              </div>
              <div className="min-w-0 truncate">
                <p className="font-semibold text-slate-200 truncate">{selectedJugador.nombre}</p>
                <p className="text-[10px] text-slate-400 truncate">{selectedJugador.email}</p>
              </div>
            </div>
            {selectedJugador.equipoFavorito && (
              <div className="text-right shrink-0 ml-2">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/60 text-slate-300 border border-slate-600/50">
                  {selectedJugador.equipoFavorito}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Display de 4 dígitos PIN */}
        <div className="flex flex-col items-center mb-4">
          <p className="text-xs text-slate-400 mb-2">Introduce tu PIN numérico de 4 dígitos:</p>
          <div className="flex gap-3">
            {[0, 1, 2, 3].map(index => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-11 h-12 rounded-xl border flex items-center justify-center transition-all ${
                    isFilled
                      ? 'border-sky-400 bg-sky-500/10 text-sky-400'
                      : 'border-slate-700 bg-slate-800/40 text-slate-500'
                  }`}
                >
                  {isFilled ? <span className="w-3 h-3 rounded-full bg-sky-400"></span> : null}
                </div>
              );
            })}
          </div>

          {error && (
            <p className="mt-2 text-xs text-rose-400 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}
        </div>

        {/* Teclado Numérico Seguro */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleNumClick(num)}
              className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-sky-600 text-base font-bold text-slate-100 transition shadow-sm active:scale-95 cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-xs font-semibold text-slate-400 transition cursor-pointer"
          >
            Borrar
          </button>
          <button
            onClick={() => handleNumClick('0')}
            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-sky-600 text-base font-bold text-slate-100 transition cursor-pointer"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition cursor-pointer"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};
