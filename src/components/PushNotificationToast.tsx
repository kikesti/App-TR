import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { NotificacionPush, Jugador } from '../types';
import { gasBackend } from '../services/gasBackend';

interface ToastItem {
  id: string;
  notif: NotificacionPush;
  visible: boolean;
}

interface Props {
  currentUser: Jugador | null;
}

export const PushNotificationToast: React.FC<Props> = ({ currentUser }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    // Suscribirse a cambios del backend
    const unsubscribe = gasBackend.subscribe(() => {
      const allNotifs = gasBackend.getNotifs();
      if (!allNotifs || allNotifs.length === 0) return;

      const latest = allNotifs[0];
      if (!latest) return;

      // Filtrar si la notificación es para este usuario o para TODOS
      const appliesToUser =
        latest.destinatario === 'TODOS' ||
        (currentUser && (latest.destinatario === currentUser.id || latest.destinatario === currentUser.nombre));

      if (!appliesToUser) return;

      // Comprobar si ya fue mostrada en esta sesión de la ventana
      const sessionShownKey = `trg_notif_seen_${latest.id}`;
      if (sessionStorage.getItem(sessionShownKey)) return;
      sessionStorage.setItem(sessionShownKey, 'true');

      // Añadir al stack de toasts visuales
      const newToast: ToastItem = {
        id: latest.id,
        notif: latest,
        visible: true,
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 2)]);

      // Auto ocultar tras 7 segundos
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === newToast.id ? { ...t, visible: false } : t))
        );
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, 400);
      }, 7000);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  const handleDismiss = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 400);
  };

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notificaciones Push"
      className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm"
    >
      {toasts.map(({ id, notif, visible }) => (
        <div
          key={id}
          className={`pointer-events-auto rounded-2xl bg-slate-900/95 border-2 border-amber-500/60 shadow-2xl p-4 backdrop-blur-md transition-all duration-300 transform ${
            visible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-4 scale-95'
          }`}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-amber-500/40 p-0.5 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="/icon-192.png"
                alt="Logo Notificación App TR"
                className="w-full h-full object-contain rounded-[9px]"
                onError={(e) => {
                  e.currentTarget.src = '/icon-512.png';
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Bell className="w-3 h-3 text-amber-400 animate-bounce" />
                  <span>Notificación Push Oficial</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {notif.fecha || notif.fechaEnvio || 'Ahora'}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white truncate leading-snug">
                {notif.titulo}
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-3">
                {notif.mensaje}
              </p>

              {notif.destinatario && notif.destinatario !== 'TODOS' && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                    Mensaje personal para ti
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => handleDismiss(id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </aside>
  );
};
