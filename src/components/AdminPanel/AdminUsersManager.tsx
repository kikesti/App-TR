import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  Lock,
  Mail,
  Search,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Jugador } from '../../types';

interface Props {
  jugadores: Jugador[];
  onUpdateJugador: (jugador: Jugador) => void;
  onAddJugador: (jugador: Omit<Jugador, 'totalPuntos' | 'totalAciertos' | 'jornadasJugadas'>) => void;
  onRecargarMasivo: (cantidad: number) => void;
}

export const AdminUsersManager: React.FC<Props> = ({
  jugadores,
  onUpdateJugador,
  onAddJugador,
  onRecargarMasivo,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Formulario nuevo usuario
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPin, setNewPin] = useState('1234');
  const [newSaldo, setNewSaldo] = useState(5);

  const filtered = jugadores.filter(j =>
    j.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const nextId = `TRG-${String(jugadores.length + 1).padStart(3, '0')}`;
    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    onAddJugador({
      id: nextId,
      nombre: newName.trim(),
      email: newEmail.trim(),
      pin: newPin.trim() || '1234',
      saldoJornadas: Number(newSaldo) || 0,
      activo: true,
      avatarColor: randomColor,
    });

    setNewName('');
    setNewEmail('');
    setNewPin('1234');
    setNewSaldo(5);
    setShowAddModal(false);
  };

  const handleRecargar = (jugador: Jugador, delta: number) => {
    const updatedSaldo = Math.max(0, jugador.saldoJornadas + delta);
    onUpdateJugador({ ...jugador, saldoJornadas: updatedSaldo });
  };

  const handleToggleActivo = (jugador: Jugador) => {
    onUpdateJugador({ ...jugador, activo: !jugador.activo });
  };

  return (
    <div className="space-y-4">
      {/* Barra Superior con Acciones Masivas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <span>Gestión de Jugadores & Saldos (Hoja JUGADORES)</span>
          </h3>
          <p className="text-xs text-slate-400">Total: {jugadores.length} usuarios registrados</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Recargas masivas */}
          <button
            onClick={() => onRecargarMasivo(1)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold border border-slate-700 transition cursor-pointer"
            title="Suma +1 jornada a todos los usuarios activos"
          >
            +1 Masivo
          </button>
          <button
            onClick={() => onRecargarMasivo(5)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 transition cursor-pointer"
            title="Suma +5 jornadas a todos los usuarios activos"
          >
            +5 Masivo
          </button>

          {/* Añadir Usuario */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition active:scale-95 flex items-center gap-1.5 shadow cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, ID (TRG-001) o email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Tabla de Usuarios */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Usuario / ID</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3 text-center">PIN</th>
                <th className="py-3 px-3 text-center">Saldo</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3 text-right">Recarga Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(jugador => (
                <tr key={jugador.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                        style={{ backgroundColor: jugador.avatarColor || '#3b82f6' }}
                      >
                        {jugador.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">{jugador.nombre}</p>
                        <span className="text-[10px] text-slate-500 font-mono">{jugador.id}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-slate-300 truncate max-w-[150px]">
                    {jugador.email}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <input
                      type="text"
                      maxLength={4}
                      value={jugador.pin}
                      onChange={(e) => onUpdateJugador({ ...jugador, pin: e.target.value })}
                      className="w-16 text-center font-mono py-1 rounded bg-slate-950 border border-slate-800 text-sky-400 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-black ${
                      jugador.saldoJornadas > 1
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : jugador.saldoJornadas === 1
                        ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                        : 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                    }`}>
                      {jugador.saldoJornadas} {jugador.saldoJornadas === 1 ? 'jornada' : 'jornadas'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleToggleActivo(jugador)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                        jugador.activo
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {jugador.activo ? 'ACTIVO' : 'INACTIVO'}
                    </button>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleRecargar(jugador, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                        title="Restar 1 jornada"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRecargar(jugador, 1)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs transition cursor-pointer"
                        title="Sumar 1 jornada"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleRecargar(jugador, 5)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs transition cursor-pointer"
                        title="Sumar 5 jornadas"
                      >
                        +5
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Creación de Usuario */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-sky-400" />
              <span>Nuevo Jugador en Google Sheets</span>
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Roberto Carlos"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Correo Electrónico (Resguardos)</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="usuario@trg.com"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">PIN Numérico (4 dits)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full font-mono rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Saldo Inicial (Jornadas)</label>
                  <input
                    type="number"
                    min={0}
                    value={newSaldo}
                    onChange={(e) => setNewSaldo(Number(e.target.value))}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
