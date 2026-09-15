import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Mail, Copy, Check, QrCode, Share2, X } from 'lucide-react';
import { QuinielaBoleto, Partido, APP_VERSION_STRING } from '../../types';

interface Props {
  boleto: QuinielaBoleto | null;
  partidos: Partido[];
  saldoRestante?: number;
  userEmail?: string;
  onClose: () => void;
}

export const ResguardoModal: React.FC<Props> = ({
  boleto,
  partidos,
  saldoRestante,
  userEmail,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  if (!boleto) return null;

  const handleCopy = () => {
    const text = `🏆 RESGUARDO OFICIAL APP TR (${APP_VERSION_STRING})\nCódigo: ${boleto.codigoResguardo}\nJornada: ${boleto.jornada}\nJugador: ${boleto.jugadorNombre}\nFecha: ${boleto.fechaSellado}\n\nPRONÓSTICOS:\n` +
      Object.entries(boleto.columna1).map(([num, signo]) => `#${num}: ${signo}`).join(' | ') +
      `\nPleno al 15: ${boleto.pleno15.local} - ${boleto.pleno15.visitante}\nSaldo restante: ${saldoRestante ?? ''} jornada(s)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 flex flex-col my-8">
        {/* Cabecera del Resguardo */}
        <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-wider uppercase text-emerald-400">
                SELLADO CON ÉXITO
              </span>
              <h3 className="text-base font-black text-white">Resguardo Oficial TRG</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjeta de Resguardo Estilo Boleto */}
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 mb-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-800">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Código de Validación</p>
              <p className="text-base font-black text-amber-400 tracking-wider">{boleto.codigoResguardo}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Jornada</p>
              <p className="text-sm font-bold text-sky-400">#{boleto.jornada}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div>
              <span className="text-slate-500">Jugador:</span>
              <p className="font-semibold text-white">{boleto.jugadorNombre}</p>
            </div>
            <div>
              <span className="text-slate-500">Fecha Sellado:</span>
              <p className="font-semibold text-white">{boleto.fechaSellado}</p>
            </div>
          </div>

          {/* Cuadrícula de Pronósticos 1..14 */}
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">
              Parrilla de Pronósticos (14 Partidos)
            </span>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {Array.from({ length: 14 }, (_, i) => i + 1).map(num => (
                <div key={num} className="p-1 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">P{num}</span>
                  <span className="text-xs font-black text-sky-400">{boleto.columna1[num] || '-'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pleno al 15 */}
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300">PLENO AL 15:</span>
            <span className="font-black text-amber-400 tracking-widest text-sm">
              {boleto.pleno15.local} - {boleto.pleno15.visitante}
            </span>
          </div>

          {/* Saldo Restante */}
          {saldoRestante !== undefined && (
            <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-800 text-[11px]">
              <span className="text-slate-400">Saldo restante:</span>
              <span className={`font-black ${saldoRestante <= 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {saldoRestante} jornada(s)
              </span>
            </div>
          )}
        </div>

        {/* Notificación de Correo Automático */}
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5 mb-4 text-xs text-slate-300">
          <Mail className="w-4 h-4 text-sky-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white">Copia enviada por Correo</p>
            <p className="text-[11px] text-slate-400 truncate">
              Se ha remitido el resguardo HTML a {userEmail || 'tu email registrado'}.
            </p>
          </div>
          <button
            onClick={() => setShowEmailPreview(!showEmailPreview)}
            className="text-[11px] text-sky-400 hover:text-sky-300 underline font-semibold shrink-0 cursor-pointer"
          >
            {showEmailPreview ? 'Ocultar' : 'Ver HTML'}
          </button>
        </div>

        {/* Vista previa del email HTML si se despliega */}
        {showEmailPreview && (
          <div className="p-3 mb-4 rounded-xl bg-slate-950 border border-sky-500/30 text-[11px] text-slate-300 space-y-2">
            <p className="font-bold text-sky-400">📧 Asunto: Resguardo App TR - Boleto {boleto.codigoResguardo}</p>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 font-sans">
              <p>Hola <strong>{boleto.jugadorNombre}</strong>,</p>
              <p className="mt-1">Tu quiniela para la <strong>Jornada {boleto.jornada}</strong> ha sido sellada y registrada en la base de datos de Google Sheets (hoja QUINIELAS).</p>
              <p className="mt-1 text-amber-300 font-bold">Código oficial: {boleto.codigoResguardo}</p>
              <p className="text-[10px] text-slate-400 mt-1">Saldo restante actualizado: {saldoRestante} jornada(s).</p>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCopy}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            Aceptar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
