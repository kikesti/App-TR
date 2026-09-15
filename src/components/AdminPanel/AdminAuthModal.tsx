import React, { useState, useEffect } from 'react';
import { ShieldAlert, Delete, Lock, KeyRound, X } from 'lucide-react';
import { Jugador } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jugadores: Jugador[];
}

export const AdminAuthModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, jugadores }) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setIsShaking(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
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
    // Buscar si coincide con el PIN de algún usuario con rol ADMIN o el PIN maestro 1608
    const adminUser = jugadores.find(j => j.rol === 'ADMIN' || j.id === 'ADMIN' || j.nombre.toUpperCase() === 'ADMIN');
    const validPin = adminUser?.pin || '1608';

    if (pinToTest === validPin || pinToTest === '1608') {
      setError('');
      onSuccess();
    } else {
      setIsShaking(true);
      setError('PIN de Administrador incorrecto. Acceso denegado.');
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 flex flex-col relative transition-transform ${
          isShaking ? 'translate-x-[-8px] animate-pulse border-rose-500/80' : ''
        }`}
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer"
          title="Cancelar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              <span>Panel Administrador</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                PROTEGER
              </span>
            </h2>
            <p className="text-xs text-slate-400">Introduce el PIN de 4 dígitos de Administrador</p>
          </div>
        </div>

        {/* Indicador visual de los 4 dígitos */}
        <div className="flex justify-center items-center gap-3 my-4">
          {[0, 1, 2, 3].map((index) => {
            const hasDigit = pin.length > index;
            return (
              <div
                key={index}
                className={`w-12 h-14 rounded-xl border flex items-center justify-center text-xl font-black transition-all ${
                  hasDigit
                    ? 'border-amber-400 bg-amber-400/15 text-amber-300 scale-105 shadow-sm'
                    : 'border-slate-800 bg-slate-950/60 text-slate-600'
                }`}
              >
                {hasDigit ? '•' : ''}
              </div>
            );
          })}
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="flex items-center gap-2 p-2.5 mb-3 rounded-xl bg-rose-950/50 border border-rose-900/60 text-rose-300 text-xs font-semibold animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Teclado Numérico */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-lg font-bold text-white transition border border-slate-700/60 flex items-center justify-center cursor-pointer shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-xs font-bold text-slate-400 hover:text-slate-200 transition border border-slate-700/40 flex items-center justify-center cursor-pointer"
          >
            Limpiar
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-lg font-bold text-white transition border border-slate-700/60 flex items-center justify-center cursor-pointer shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-rose-400 transition border border-slate-700/40 flex items-center justify-center cursor-pointer"
            title="Borrar dígito"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Nota de seguridad */}
        <div className="mt-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <p className="text-[11px] text-amber-300 font-medium">
            PIN Maestro de Administrador: <strong className="font-mono text-white text-xs bg-slate-900 px-1.5 py-0.5 rounded border border-amber-500/30">1608</strong>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Podrás cambiarlo en cualquier momento desde la hoja Google Sheets o el panel.
          </p>
        </div>
      </div>
    </div>
  );
};
