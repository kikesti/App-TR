import React, { useState } from 'react';
import { Tv, Radio, Send, Bell, Plus, Trash2, ExternalLink, Users, User, CheckCircle, Sparkles } from 'lucide-react';
import { CanalTV, Jugador, NotificacionPush } from '../../types';

interface Props {
  canales: CanalTV[];
  jugadores: Jugador[];
  numeroJornada?: number;
  onSaveCanales: (canales: CanalTV[]) => void;
  onSendPush: (notif: NotificacionPush) => void;
}

export const AdminTVAndPush: React.FC<Props> = ({
  canales,
  jugadores,
  numeroJornada = 7,
  onSaveCanales,
  onSendPush,
}) => {
  // Estado para gestión de canales
  const [listaCanales, setListaCanales] = useState<CanalTV[]>(canales);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaUrl, setNuevaUrl] = useState('');
  const [nuevoPartido, setNuevoPartido] = useState('');

  // Estado para Megáfono Push
  const [pushDestino, setPushDestino] = useState<'TODOS' | string>('TODOS');
  const [pushTitulo, setPushTitulo] = useState(`⚽ ¡Aviso Jornada ${numeroJornada} Liga TRG!`);
  const [pushMensaje, setPushMensaje] = useState('');
  const [pushEnviada, setPushEnviada] = useState(false);

  const plantillasRapidas = [
    {
      titulo: `⚽ ¡Jornada ${numeroJornada} Abierta!`,
      mensaje: `Ya están disponibles los 15 partidos de la Jornada ${numeroJornada}. Sella tu pronóstico oficial antes del cierre.`,
    },
    {
      titulo: `⏰ Recordatorio Cierre Jornada ${numeroJornada}`,
      mensaje: `Quedan pocas horas para el cierre definitivo de apuestas de la Jornada ${numeroJornada}. ¡No te quedes sin jugar!`,
    },
    {
      titulo: `🏆 Escrutinio Jornada ${numeroJornada} Finalizado`,
      mensaje: `Los resultados y clasificación de la Jornada ${numeroJornada} ya están publicados. Comprueba tus aciertos en la app.`,
    },
  ];

  const handleAddCanal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevaUrl.trim()) return;

    const nuevo: CanalTV = {
      id: `canal-${Date.now()}`,
      nombre: nuevoNombre.trim(),
      urlDirecto: nuevaUrl.trim(),
      partidoDestacado: nuevoPartido.trim() || undefined,
      enVivo: true,
      categoria: 'LaLiga',
      logo: '📺',
    };

    const updated = [...listaCanales, nuevo];
    setListaCanales(updated);
    onSaveCanales(updated);
    setNuevoNombre('');
    setNuevaUrl('');
    setNuevoPartido('');
  };

  const handleDeleteCanal = (id: string) => {
    const updated = listaCanales.filter(c => c.id !== id);
    setListaCanales(updated);
    onSaveCanales(updated);
  };

  const handleSendPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushMensaje.trim()) return;

    onSendPush({
      id: `push-${Date.now()}`,
      titulo: pushTitulo,
      mensaje: pushMensaje,
      fechaEnvio: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      destinatario: pushDestino === 'TODOS' ? 'TODOS' : pushDestino,
      leida: false,
    });

    setPushEnviada(true);
    setPushMensaje('');
    setTimeout(() => setPushEnviada(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. CENTRAL DE TV: GESTIÓN DE ENLACES */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold text-white">Central de Directos TV</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{listaCanales.length} Canales</span>
        </div>

        {/* Lista de canales */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {listaCanales.map(canal => (
            <div
              key={canal.id}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="min-w-0 flex-1 pr-2">
                <p className="font-bold text-white truncate">{canal.nombre}</p>
                <p className="text-[11px] text-slate-400 truncate">{canal.urlDirecto}</p>
                {canal.partidoDestacado && (
                  <span className="text-[10px] text-sky-400">● {canal.partidoDestacado}</span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={canal.urlDirecto}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => handleDeleteCanal(canal.id)}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Formulario añadir canal */}
        <form onSubmit={handleAddCanal} className="space-y-2 pt-2 border-t border-slate-800 text-xs">
          <p className="font-bold text-slate-300 text-xs">Añadir Canal o Emisión en Directo:</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Nombre (ej. Movistar+)"
              className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-white focus:outline-none focus:border-sky-500"
            />
            <input
              type="text"
              value={nuevoPartido}
              onChange={(e) => setNuevoPartido(e.target.value)}
              placeholder="Partido Destacado"
              className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-white focus:outline-none focus:border-sky-500"
            />
          </div>
          <input
            type="url"
            required
            value={nuevaUrl}
            onChange={(e) => setNuevaUrl(e.target.value)}
            placeholder="URL del streaming o web oficial (https://...)"
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-white focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs border border-slate-700 transition cursor-pointer"
          >
            + Añadir Canal a la App
          </button>
        </form>
      </div>

      {/* 2. MEGÁFONO PUSH: NOTIFICACIONES A USUARIOS */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Megáfono Push (FCM v1)</h3>
          </div>
          <span className="text-[11px] text-slate-400">Envío instantáneo</span>
        </div>

        <p className="text-xs text-slate-400">
          Envía un aviso emergente al navegador y dispositivo de tus jugadores (individualmente o a todos los registrados).
        </p>

        <form onSubmit={handleSendPush} className="space-y-3 text-xs">
          {/* Destinatario */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Destinatario</label>
            <select
              value={pushDestino}
              onChange={(e) => setPushDestino(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="TODOS">📢 A Todos los Jugadores Activos ({jugadores.filter(j => j.activo).length})</option>
              {jugadores.filter(j => j.activo).map(j => (
                <option key={j.id} value={j.id}>
                  👤 {j.nombre} ({j.id})
                </option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Título de la Notificación</label>
            <input
              type="text"
              required
              value={pushTitulo}
              onChange={(e) => setPushTitulo(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Plantillas Rápidas Dinámicas de Jornada */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Plantillas Rápidas (Jornada {numeroJornada})</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {plantillasRapidas.map((plantilla, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPushTitulo(plantilla.titulo);
                    setPushMensaje(plantilla.mensaje);
                  }}
                  className="text-left p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer text-[11px]"
                >
                  <p className="font-bold text-sky-400 truncate">{plantilla.titulo}</p>
                  <p className="text-slate-400 line-clamp-1 text-[10px] mt-0.5">{plantilla.mensaje}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Cuerpo del Mensaje</label>
            <textarea
              required
              rows={3}
              value={pushMensaje}
              onChange={(e) => setPushMensaje(e.target.value)}
              placeholder="Ej. Quedan 30 minutos para el cierre de la jornada..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {pushEnviada && (
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>¡Notificación Push enviada! Emitida a pantalla (Toast) y al canal de notificaciones nativo del dispositivo.</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Disparar Notificación Push</span>
          </button>
        </form>
      </div>
    </div>
  );
};
