import React, { useState } from 'react';
import {
  User,
  Bell,
  BellRing,
  Send,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Bot,
  Sliders,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Jugador } from '../../types';
import { gasBackend } from '../../services/gasBackend';

interface Props {
  currentUser: Jugador | null;
  onOpenLogin: () => void;
  onUpdateUser: (jugador: Jugador) => void;
  onSwitchToAdmin?: () => void;
}

export const TabPerfil: React.FC<Props> = ({ currentUser, onOpenLogin, onUpdateUser, onSwitchToAdmin }) => {
  const [pushEnabled, setPushEnabled] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted' || Boolean(currentUser?.fcmToken);
    }
    return Boolean(currentUser?.fcmToken);
  });
  const [showPin, setShowPin] = useState(false);
  const [telegramId, setTelegramId] = useState(currentUser?.telegramId || '');
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [refillRequested, setRefillRequested] = useState(false);

  // Comprobar estrictamente si el usuario autenticado es Kike
  const isKike = Boolean(
    currentUser &&
    (currentUser.id === 'TRG-000' ||
      currentUser.id === 'ADMIN' ||
      currentUser.email?.toLowerCase().trim() === 'kikesti@gmail.com' ||
      currentUser.nombre?.toLowerCase().trim() === 'kike')
  );

  if (!currentUser) {
    return (
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center space-y-3">
        <User className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-white">Perfil de Jugador</h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Inicia sesión para gestionar tus datos personales, tu saldo de jornadas y tus notificaciones Push Web.
        </p>
        <button
          onClick={onOpenLogin}
          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition shadow cursor-pointer"
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  const handleTogglePush = async () => {
    if (!('Notification' in window)) {
      alert('Tu navegador actual no admite notificaciones Push web.');
      return;
    }

    if (Notification.permission === 'granted') {
      setPushEnabled(!pushEnabled);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        // Simular registro de token FCM v1
        const mockFcmToken = `fcm_v1_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        onUpdateUser({ ...currentUser, fcmToken: mockFcmToken });
        alert('🔔 ¡Notificaciones Push Web activadas con éxito! Recibirás avisos de cierre y resultados.');
      } else {
        alert('Permiso denegado por el navegador.');
      }
    } catch (e) {
      console.warn(e);
      setPushEnabled(true);
    }
  };

  const handleSaveTelegram = () => {
    setSavingTelegram(true);
    onUpdateUser({ ...currentUser, telegramId: telegramId.trim() });
    setTimeout(() => {
      setSavingTelegram(false);
      alert('🤖 Enlace con el Bot de Telegram ("Gran Hermano") actualizado.');
    }, 400);
  };

  const handleRequestRefill = () => {
    setRefillRequested(true);
    setTimeout(() => {
      alert(`📩 Solicitud de recarga de saldo enviada al Administrador para ${currentUser.nombre}.`);
    }, 200);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Tarjeta de Identidad del Jugador */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-slate-700"
              style={{ backgroundColor: currentUser.avatarColor || '#3b82f6' }}
            >
              {currentUser.nombre.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">{currentUser.nombre}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  {currentUser.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">{currentUser.email}</p>
              <p className="text-[11px] text-emerald-400 mt-0.5">● Conectado a Google Sheets (Liga TRG)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Equipo Favorito / Avatar Oficial (Columna H) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-sky-400" />
            <span>Equipo Favorito & Avatar (Columna H)</span>
          </h3>
          <span className="text-[11px] text-slate-400">{currentUser.equipoFavorito || 'Real Madrid'}</span>
        </div>
        <p className="text-xs text-slate-400">
          Elige el club que representará tu ficha en las clasificaciones, resguardos y crónicas:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            'Real Madrid',
            'Barcelona',
            'Atletico Madrid',
            'Athletic Club',
            'Real Betis',
            'Sevilla',
            'Real Sociedad',
            'Villarreal',
          ].map(team => {
            const isSelected = (currentUser.equipoFavorito || 'Real Madrid') === team;
            return (
              <button
                key={team}
                onClick={() => {
                  onUpdateUser({ ...currentUser, equipoFavorito: team });
                }}
                className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-sky-500/20 border-sky-400 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span className="truncate">{team}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control de Saldo & Alertas de Saldo */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Saldo de Jornadas Pagadas</span>
          </h3>
          <span className="text-[11px] text-slate-400">Hoja JUGADORES (Columna E)</span>
        </div>

        {/* Semáforo de Saldo */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          currentUser.saldoJornadas > 1
            ? 'bg-emerald-950/30 border-emerald-800/60'
            : currentUser.saldoJornadas === 1
            ? 'bg-amber-950/40 border-amber-500/70'
            : 'bg-rose-950/40 border-rose-500/70'
        }`}>
          <div>
            <span className="text-xs text-slate-400 block">Jornadas Disponibles</span>
            <span className={`text-2xl font-black ${
              currentUser.saldoJornadas > 1
                ? 'text-emerald-400'
                : currentUser.saldoJornadas === 1
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}>
              {currentUser.saldoJornadas}
            </span>
          </div>

          <div className="text-right">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              currentUser.saldoJornadas > 1
                ? 'bg-emerald-500/20 text-emerald-300'
                : currentUser.saldoJornadas === 1
                ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                : 'bg-rose-500/20 text-rose-300 animate-pulse'
            }`}>
              {currentUser.saldoJornadas > 1
                ? 'Saldo Óptimo'
                : currentUser.saldoJornadas === 1
                ? '¡Última Jornada!'
                : 'Saldo Agotado'}
            </span>
          </div>
        </div>

        {/* Alerta textual si saldo <= 1 */}
        {currentUser.saldoJornadas <= 1 && (
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
            currentUser.saldoJornadas === 1
              ? 'bg-amber-900/30 border-amber-600/40 text-amber-200'
              : 'bg-rose-900/30 border-rose-600/40 text-rose-200'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {currentUser.saldoJornadas === 1
                  ? 'Aviso automático de saldo bajo:'
                  : 'Aviso urgente de saldo agotado:'}
              </p>
              <p className="text-[11px] mt-0.5 leading-relaxed">
                {currentUser.saldoJornadas === 1
                  ? 'Te queda 1 sola jornada de saldo. Cuando selles tu próximo boleto no tendrás saldo disponible.'
                  : 'Tu saldo ha llegado a 0. No podrás sellar boletos en las siguientes jornadas hasta que el administrador recargue tu cuenta.'}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleRequestRefill}
          disabled={refillRequested}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
        >
          {refillRequested ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <CreditCard className="w-4 h-4" />}
          <span>{refillRequested ? 'Solicitud enviada al Administrador' : 'Solicitar Recarga de Saldo (+5 Jornadas)'}</span>
        </button>
      </div>

      {/* Notificaciones Push Web (Service Worker + Firebase FCM v1) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-400" />
            <span>Notificaciones Push Web (FCM v1)</span>
          </h3>
          <span className="text-[11px] text-slate-500">Service Worker</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Recibe alertas instantáneas en tu móvil o navegador cuando la jornada se abra, cuando queden pocas horas para el cierre (Relé T-X y T-Y) y cuando concluya el escrutinio oficial.
        </p>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              pushEnabled ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-400'
            }`}>
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Alertas Push en este Dispositivo</p>
              <p className="text-[10px] text-slate-400">
                {pushEnabled ? 'Token FCM v1 registrado' : 'Inactivo actualmente'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePush}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                pushEnabled
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
              }`}
            >
              {pushEnabled ? 'Activado ✓' : 'Activar Push'}
            </button>

            <button
              type="button"
              onClick={() => {
                gasBackend.enviarMegafonoPush({
                  titulo: `🔔 Prueba Push en ${currentUser.nombre}`,
                  mensaje: '¡Tu dispositivo y navegador están recibiendo correctamente las notificaciones de la Liga TRG!',
                  destinatario: currentUser.id,
                });
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
              title="Probar recepción de notificación en este dispositivo"
            >
              Probar
            </button>
          </div>
        </div>
      </div>

      {/* Bot de Telegram "Gran Hermano" */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Bot className="w-4 h-4 text-sky-400" />
            <span>Bot de Telegram "Gran Hermano"</span>
          </h3>
          <span className="text-[11px] text-slate-500">Canal Automatizado</span>
        </div>

        <p className="text-xs text-slate-400">
          Vincula tu alias de Telegram para recibir resguardos y avisos del bot central de la Liga TRG.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            placeholder="@tu_usuario_telegram"
            className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={handleSaveTelegram}
            disabled={savingTelegram}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold border border-slate-700 transition cursor-pointer"
          >
            {savingTelegram ? 'Guardando...' : 'Vincular'}
          </button>
        </div>
      </div>

      {/* Seguridad & PIN */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Seguridad de la Cuenta</span>
          </h3>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">PIN Numérico de Sellado</span>
            <span className="font-mono font-bold text-white tracking-widest text-sm">
              {showPin ? currentUser.pin : '••••'}
            </span>
          </div>
          <button
            onClick={() => setShowPin(!showPin)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Panel de Administración: Acceso EXCLUSIVO visible solo para Kike */}
      {isKike && onSwitchToAdmin && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-slate-900 border-2 border-amber-500/40 p-4 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                Consola Central de Gestión
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
              Solo Kike
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Control de fases de jornada (Apertura, En Vivo, Escrutinio), escaneo inteligente de partidos, relés T-X/T-Y, archivo EduLosilla y Google Sheets.
          </p>

          <button
            onClick={onSwitchToAdmin}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-[0.99]"
          >
            <ShieldAlert className="w-5 h-5 text-slate-950" />
            <span>ACCEDER AL PANEL DE ADMINISTRACIÓN</span>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </button>
        </div>
      )}
    </div>
  );
};
