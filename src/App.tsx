import React, { useState, useEffect } from 'react';
import {
  Shield,
  Layers,
  Trophy,
  History,
  Tv,
  User,
  Sliders,
  Sparkles,
  Edit,
  Users,
  Megaphone,
  Radio,
  Settings,
  Code2,
  Image as ImageIcon,
  FileText
} from 'lucide-react';

import {
  Jugador,
  Partido,
  QuinielaBoleto,
  EstadoJornada,
  ConfiguracionMarquesina,
  CanalTV,
  LogEntrada,
  FaseJornada,
  SignoQuiniela,
  GolesPleno,
  NotificacionPush
} from './types';

import { gasBackend } from './services/gasBackend';
import { MarqueeBanner } from './components/MarqueeBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallShareBanner } from './components/PWAInstallShareBanner';
import { PushNotificationToast } from './components/PushNotificationToast';

// Componentes App de Usuarios
import { UserHeader } from './components/UserApp/UserHeader';
import { TabFaseBoleto } from './components/UserApp/TabFaseBoleto';
import { TabRanking } from './components/UserApp/TabRanking';
import { TabHistorial } from './components/UserApp/TabHistorial';
import { TabCentralTV } from './components/UserApp/TabCentralTV';
import { TabPerfil } from './components/UserApp/TabPerfil';
import { LoginModal } from './components/UserApp/LoginModal';
import { ResguardoModal } from './components/UserApp/ResguardoModal';
import { UserLoginScreen } from './components/UserApp/UserLoginScreen';
import { DemoModeBanner } from './components/UserApp/DemoModeBanner';

// Componentes Panel de Administración
import { AdminHeader } from './components/AdminPanel/AdminHeader';
import { AdminPhaseControl } from './components/AdminPanel/AdminPhaseControl';
import { AdminMatchesEditor } from './components/AdminPanel/AdminMatchesEditor';
import { AdminUsersManager } from './components/AdminPanel/AdminUsersManager';
import { AdminMarqueeManager } from './components/AdminPanel/AdminMarqueeManager';
import { AdminTVAndPush } from './components/AdminPanel/AdminTVAndPush';
import { AdminSystemReset } from './components/AdminPanel/AdminSystemReset';
import { AdminImageGenerator } from './components/AdminPanel/AdminImageGenerator';
import { AdminGASViewer } from './components/AdminPanel/AdminGASViewer';
import { AdminAuthModal } from './components/AdminPanel/AdminAuthModal';
import { AdminEduLosillaExport } from './components/AdminPanel/AdminEduLosillaExport';

type UserTab = 'fase' | 'ranking' | 'historial' | 'tv' | 'perfil';
type AdminTab =
  | 'fases'
  | 'partidos'
  | 'usuarios'
  | 'marquesina'
  | 'tv_push'
  | 'edulosilla'
  | 'sistema'
  | 'gemini_ia'
  | 'gas';

export default function App() {
  // Estado General del Backend Local / Google Sheets
  const [partidos, setPartidos] = useState<Partido[]>(() => gasBackend.getPartidos());
  const [jugadores, setJugadores] = useState<Jugador[]>(() => gasBackend.getJugadores());
  const [boletos, setBoletos] = useState<QuinielaBoleto[]>(() => gasBackend.getBoletos());
  const [estado, setEstado] = useState<EstadoJornada>(() => gasBackend.getEstadoJornada());
  const [marquesina, setMarquesina] = useState<ConfiguracionMarquesina>(() => gasBackend.getMarquesina());
  const [canales, setCanales] = useState<CanalTV[]>(() => gasBackend.getCanales());
  const [logs, setLogs] = useState<LogEntrada[]>(() => gasBackend.getLogs());

  // Usuario activo autenticado (inicia en null para mostrar siempre la pantalla de inicio con desplegable de usuarios)
  const [currentUser, setCurrentUser] = useState<Jugador | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Usuario simulado para explorar la app en Modo Demostración
  const DEMO_USER: Jugador = {
    id: 'INVITADO_DEMO',
    nombre: 'Invitado (Modo Demo)',
    pin: '0000',
    email: 'invitado@ligatrg.com',
    saldoJornadas: 10,
    activo: true,
    totalPuntos: 45,
    totalAciertos: 32,
    jornadasJugadas: 5,
    rol: 'USER',
    equipoFavorito: 'Liga TRG',
    avatarColor: '#10b981',
  };

  // Detectar automáticamente si se accede mediante enlace con demo (?demo=1 o ?demo=true)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('demo') || params.get('modo') === 'demo') {
        setIsDemoMode(true);
        setCurrentUser(DEMO_USER);
      }
    }
  }, []);

  const handleEnterDemo = () => {
    setIsDemoMode(true);
    setCurrentUser(DEMO_USER);
  };

  const handleExitDemo = () => {
    setIsDemoMode(false);
    setCurrentUser(null);
    if (typeof window !== 'undefined' && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Vistas y Pestañas
  const [viewMode, setViewMode] = useState<'user' | 'admin'>('user');
  const [userTab, setUserTab] = useState<UserTab>('fase');
  const [adminTab, setAdminTab] = useState<AdminTab>('fases');

  // Modales y Seguridad Admin
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [resguardoBoleto, setResguardoBoleto] = useState<QuinielaBoleto | null>(null);
  const [isSyncingRemote, setIsSyncingRemote] = useState(false);

  // Sincronizar cambios en gasBackend
  const syncStateFromBackend = () => {
    setPartidos([...gasBackend.getPartidos()]);
    setJugadores([...gasBackend.getJugadores()]);
    setBoletos([...gasBackend.getBoletos()]);
    setEstado({ ...gasBackend.getEstadoJornada() });
    setMarquesina({ ...gasBackend.getMarquesina() });
    setCanales([...gasBackend.getCanales()]);
    setLogs([...gasBackend.getLogs()]);

    if (currentUser) {
      const refreshed = gasBackend.getJugadores().find(j => j.id === currentUser.id);
      if (refreshed) setCurrentUser({ ...refreshed });
    }
  };

  const handleSyncRemote = async () => {
    setIsSyncingRemote(true);
    try {
      const result = await gasBackend.syncWithRemote();
      syncStateFromBackend();
      if (result.success) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`ℹ️ ${result.message}\n(Se mantiene la base de datos local para garantizar servicio continuo).`);
      }
    } catch (e: any) {
      alert(`Error de sincronización: ${e.message}`);
    } finally {
      setIsSyncingRemote(false);
    }
  };

  // Autenticación de Usuario
  const handleLogin = (jugador: Jugador, pin: string): boolean => {
    if (jugador.pin === pin) {
      setCurrentUser(jugador);
      setIsLoginOpen(false);
      gasBackend.addLog('INFO', 'LOGIN_USUARIO', `Acceso exitoso de ${jugador.nombre} (${jugador.id})`);
      return true;
    }
    gasBackend.addLog('AVISO', 'LOGIN_FALLIDO', `Intento de acceso fallido para ${jugador.nombre} (${jugador.id})`);
    return false;
  };

  const handleLogout = () => {
    if (currentUser) {
      gasBackend.addLog('INFO', 'LOGOUT', `Sesión cerrada por ${currentUser.nombre} (${currentUser.id})`);
    }
    setCurrentUser(null);
    setIsDemoMode(false);
    if (typeof window !== 'undefined' && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Seguridad y Acceso al Panel Admin
  const handleRequestAdminAccess = () => {
    if (isAdminAuthenticated) {
      setViewMode('admin');
    } else {
      setIsAdminAuthOpen(true);
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAdminAuthOpen(false);
    setViewMode('admin');
    gasBackend.addLog('INFO', 'ADMIN_AUTH_SUCCESS', 'Acceso autorizado al Panel de Administración con PIN');
  };

  const handleSwitchToUser = (lockAdmin: boolean = false) => {
    setViewMode('user');
    if (lockAdmin) {
      setIsAdminAuthenticated(false);
      gasBackend.addLog('INFO', 'ADMIN_LOCK', 'Sesión de Administrador bloqueada');
    }
  };

  // Sellado de Boleto (Usuario)
  const handleSellarBoleto = (params: {
    columna1: Record<number, SignoQuiniela>;
    columna2?: Record<number, SignoQuiniela>;
    pleno15: { local: GolesPleno; visitante: GolesPleno };
  }) => {
    if (!currentUser) {
      setIsLoginOpen(true);
      return;
    }

    if (isDemoMode) {
      // Simulación en Modo Demo: generar resguardo oficial de demostración sin alterar saldo real
      const demoBoleto: QuinielaBoleto = {
        id: `DEMO-${Date.now()}`,
        jornada: estado.numeroJornada,
        jugadorId: currentUser.id,
        jugadorNombre: currentUser.nombre,
        fechaSellado: new Date().toLocaleString('es-ES'),
        codigoResguardo: `TRG-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
        columna1: params.columna1,
        columna2: params.columna2,
        pleno15: params.pleno15,
        escrutada: false,
      };
      setResguardoBoleto(demoBoleto);
      return;
    }

    const res = gasBackend.sellarBoleto(
      currentUser.id,
      params.columna1,
      params.columna2,
      params.pleno15
    );

    if (res.success && res.boleto) {
      syncStateFromBackend();
      setResguardoBoleto(res.boleto);
    } else {
      alert(`⚠️ ${res.message}`);
    }
  };

  // Acciones Administrativas
  const handleCambiarFase = (nuevaFase: FaseJornada) => {
    gasBackend.setFaseJornada(nuevaFase);
    syncStateFromBackend();
  };

  const handleImportarJson = (json: string) => {
    const res = gasBackend.importarPartidosJson(json);
    if (res.success) {
      syncStateFromBackend();
    }
    return res;
  };

  const handleForzarCierreTy = () => {
    gasBackend.forzarCierreTy();
    syncStateFromBackend();
    alert('🚨 Relé T-Y activado: Plazo de sellado cerrado para todos los usuarios.');
  };

  const handleEscrutar = () => {
    const res = gasBackend.ejecutarEscrutinioMatematico();
    syncStateFromBackend();
    return res;
  };

  const handleSavePartidos = (updated: Partido[]) => {
    gasBackend.savePartidos(updated);
    syncStateFromBackend();
  };

  const handleUpdateJugador = (j: Jugador) => {
    gasBackend.updateJugador(j);
    syncStateFromBackend();
  };

  const handleAddJugador = (j: Omit<Jugador, 'totalPuntos' | 'totalAciertos' | 'jornadasJugadas'>) => {
    gasBackend.addJugador(j);
    syncStateFromBackend();
  };

  const handleRecargarMasivo = (cantidad: number) => {
    gasBackend.recargarSaldoMasivo(cantidad);
    syncStateFromBackend();
    alert(`✅ Se han sumado +${cantidad} jornadas de saldo a todos los usuarios activos.`);
  };

  const handleUpdateMarquesina = (config: ConfiguracionMarquesina) => {
    gasBackend.saveMarquesina(config);
    syncStateFromBackend();
  };

  const handleSaveCanales = (newCanales: CanalTV[]) => {
    gasBackend.saveCanales(newCanales);
    syncStateFromBackend();
  };

  const handleSendPush = (notif: NotificacionPush) => {
    gasBackend.addPushNotification(notif);
    syncStateFromBackend();
  };

  const handleSaveRelays = (horaTx: string, horaTy: string) => {
    gasBackend.saveRelays(horaTx, horaTy);
    syncStateFromBackend();
  };

  const handleResetNuclear = () => {
    gasBackend.ejecutarResetNuclearTemporada();
    syncStateFromBackend();
  };

  const handleClearLogs = () => {
    gasBackend.clearLogs();
    syncStateFromBackend();
  };

  const handleEjecutarExportacionEduLosilla = (forzar: boolean = false) => {
    const res = gasBackend.ejecutarExportacionEduLosillaPostT(forzar);
    syncStateFromBackend();
    return res;
  };

  const handleEnviarAnuncioApertura = () => {
    gasBackend.addPushNotification({
      id: `push-apertura-${Date.now()}`,
      titulo: '⚽ ¡Jornada Abierta en Liga TRG!',
      mensaje: `La Jornada ${estado.numeroJornada} ya está disponible. Revisa tus pronósticos y sella tu boleto antes del cierre.`,
      fechaEnvio: 'Ahora',
      destinatario: 'TODOS',
      leida: false,
    });
    alert('📢 Anuncio de apertura de jornada remitido vía Push y registrado para envío por email.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-slate-950 antialiased">
      {/* Notificaciones Push Toast Visuales (Garantizan recepción individual y global en UI) */}
      <PushNotificationToast currentUser={currentUser} />

      {/* Indicador de Conexión Offline / Online */}
      <OfflineIndicator />

      {/* Marquesina Superior de Avisos en Tiempo Real */}
      <MarqueeBanner config={marquesina} />

      {/* Banner Persistente para Instalar PWA (se convierte en botón Compartir App al estar instalada) */}
      <PWAInstallShareBanner
        isDemoMode={isDemoMode}
        onEnterDemo={handleEnterDemo}
        onExitDemo={handleExitDemo}
      />

      {/* Banner de Modo Demostración Activo */}
      {isDemoMode && (
        <DemoModeBanner
          onExitDemo={handleExitDemo}
          onShare={() => {
            const url = `${window.location.origin}${window.location.pathname}?demo=1`;
            const text = '⚽ ¡Únete a App TR! Echa un vistazo a la demo interactiva y prueba tus pronósticos aquí:';
            if (navigator.share) {
              navigator.share({ title: 'App TR (Demo)', text, url }).catch(() => {});
            } else {
              navigator.clipboard.writeText(`${text}\n${url}`);
              alert('¡Enlace con Modo Demo copiado al portapapeles!\nCompártelo por WhatsApp o redes.');
            }
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODO 1: APP DE USUARIOS (PWA)                                            */}
      {/* ========================================================================= */}
      {viewMode === 'user' && !currentUser && (
        <UserLoginScreen
          jugadores={jugadores}
          onLogin={handleLogin}
          onOpenAdmin={handleRequestAdminAccess}
          onEnterDemo={handleEnterDemo}
        />
      )}

      {viewMode === 'user' && currentUser && (
        <div className="flex-1 flex flex-col">
          {/* Header de Usuario */}
          <UserHeader
            currentUser={currentUser}
            estado={estado}
            isDemoMode={isDemoMode}
            onOpenLogin={() => setIsLoginOpen(true)}
            onLogout={handleLogout}
            onSwitchToAdmin={handleRequestAdminAccess}
            onSyncRemote={handleSyncRemote}
            isSyncing={isSyncingRemote}
          />

          {/* Contenido Principal según Pestaña */}
          <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 pt-4">
            {userTab === 'fase' && (
              <TabFaseBoleto
                partidos={partidos}
                estado={estado}
                currentUser={currentUser}
                onSellar={handleSellarBoleto}
                onOpenLogin={() => setIsLoginOpen(true)}
                lastBoleto={boletos[boletos.length - 1] || null}
              />
            )}

            {userTab === 'ranking' && (
              <TabRanking
                jugadores={jugadores}
                currentUserId={currentUser?.id}
              />
            )}

            {userTab === 'historial' && (
              <TabHistorial
                boletos={boletos}
                currentUser={currentUser}
                partidos={partidos}
                onOpenLogin={() => setIsLoginOpen(true)}
              />
            )}

            {userTab === 'tv' && (
              <TabCentralTV
                canales={canales}
                partidos={partidos}
              />
            )}

            {userTab === 'perfil' && (
              <TabPerfil
                currentUser={currentUser}
                onOpenLogin={() => setIsLoginOpen(true)}
                onUpdateUser={handleUpdateJugador}
                onSwitchToAdmin={handleRequestAdminAccess}
              />
            )}
          </main>

          {/* Barra de Navegación Inferior Móvil (5 Tabs de la App) */}
          <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md pb-safe">
            <div className="max-w-md mx-auto grid grid-cols-5 h-16">
              {/* Tab 1: Fase */}
              <button
                onClick={() => setUserTab('fase')}
                className={`flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  userTab === 'fase' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Shield className="w-5 h-5" />
                  {estado.abierta && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </div>
                <span className="text-[10px]">Fase</span>
              </button>

              {/* Tab 2: Ranking */}
              <button
                onClick={() => setUserTab('ranking')}
                className={`flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  userTab === 'ranking' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trophy className="w-5 h-5" />
                <span className="text-[10px]">Ranking</span>
              </button>

              {/* Tab 3: Historial */}
              <button
                onClick={() => setUserTab('historial')}
                className={`flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  userTab === 'historial' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-5 h-5" />
                <span className="text-[10px]">Historial</span>
              </button>

              {/* Tab 4: TV */}
              <button
                onClick={() => setUserTab('tv')}
                className={`flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  userTab === 'tv' ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tv className="w-5 h-5" />
                <span className="text-[10px]">Directos TV</span>
              </button>

              {/* Tab 5: Perfil */}
              <button
                onClick={() => setUserTab('perfil')}
                className={`flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  userTab === 'perfil' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-[10px]">Perfil</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODO 2: PANEL DE ADMINISTRACIÓN (admin_html)                               */}
      {/* ========================================================================= */}
      {viewMode === 'admin' && (
        <div className="flex-1 flex flex-col pb-16">
          <AdminHeader
            estado={estado}
            onSwitchToUser={() => handleSwitchToUser(false)}
            onLockAdmin={() => handleSwitchToUser(true)}
            onRefresh={handleSyncRemote}
            isSyncing={isSyncingRemote}
          />

          <div className="max-w-6xl w-full mx-auto px-4 pt-4">
            {/* Pestañas del Panel Admin */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none border-b border-slate-800 text-xs">
              <button
                onClick={() => setAdminTab('fases')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                  adminTab === 'fases'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Control de Fase (3 Pasos)</span>
              </button>

              <button
                onClick={() => setAdminTab('partidos')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                  adminTab === 'partidos'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editor de Partidos (14+1)</span>
              </button>

              <button
                onClick={() => setAdminTab('usuarios')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                  adminTab === 'usuarios'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Usuarios & Saldos</span>
              </button>

              <button
                onClick={() => setAdminTab('marquesina')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                  adminTab === 'marquesina'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Marquesina</span>
              </button>

              <button
                onClick={() => setAdminTab('tv_push')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                  adminTab === 'tv_push'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>TV & Megáfono Push</span>
              </button>

              <button
                onClick={() => setAdminTab('gemini_ia')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                  adminTab === 'gemini_ia'
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Carteles IA (Gemini)</span>
              </button>

              <button
                onClick={() => setAdminTab('edulosilla')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                  adminTab === 'edulosilla'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>EduLosilla (Post-T)</span>
              </button>

              <button
                onClick={() => setAdminTab('sistema')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                  adminTab === 'sistema'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Relés T-X/T-Y & Reset</span>
              </button>

              <button
                onClick={() => setAdminTab('gas')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                  adminTab === 'gas'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Código.gs (Apps Script)</span>
              </button>
            </div>

            {/* Contenido de la Pestaña Admin Seleccionada */}
            <main>
              {adminTab === 'fases' && (
                <AdminPhaseControl
                  estado={estado}
                  onCambiarFase={handleCambiarFase}
                  onImportarJson={handleImportarJson}
                  onForzarCierreTy={handleForzarCierreTy}
                  onEscrutar={handleEscrutar}
                  onEnviarAnuncio={handleEnviarAnuncioApertura}
                />
              )}

              {adminTab === 'partidos' && (
                <AdminMatchesEditor
                  partidos={partidos}
                  onSavePartidos={handleSavePartidos}
                />
              )}

              {adminTab === 'usuarios' && (
                <AdminUsersManager
                  jugadores={jugadores}
                  onUpdateJugador={handleUpdateJugador}
                  onAddJugador={handleAddJugador}
                  onRecargarMasivo={handleRecargarMasivo}
                />
              )}

              {adminTab === 'marquesina' && (
                <AdminMarqueeManager
                  marquesina={marquesina}
                  numeroJornada={estado.numeroJornada}
                  onUpdateMarquesina={handleUpdateMarquesina}
                />
              )}

              {adminTab === 'tv_push' && (
                <AdminTVAndPush
                  canales={canales}
                  jugadores={jugadores}
                  numeroJornada={estado.numeroJornada}
                  onSaveCanales={handleSaveCanales}
                  onSendPush={handleSendPush}
                />
              )}

              {adminTab === 'gemini_ia' && <AdminImageGenerator numeroJornada={estado.numeroJornada} />}

              {adminTab === 'edulosilla' && (
                <AdminEduLosillaExport
                  estado={estado}
                  partidos={partidos}
                  boletos={boletos}
                  onEjecutarExportacionPostT={handleEjecutarExportacionEduLosilla}
                />
              )}

              {adminTab === 'sistema' && (
                <AdminSystemReset
                  estado={estado}
                  partidos={partidos}
                  jugadores={jugadores}
                  boletos={boletos}
                  logs={logs}
                  onSaveRelays={handleSaveRelays}
                  onEjecutarAutomata={() => gasBackend.ejecutarMotorAutomataTiempos()}
                  onDispararAvisoRezagados={() => gasBackend.ejecutarAvisoRezagadosTx()}
                  onDispararCierreApuestas={() => gasBackend.ejecutarCierreApuestasTy()}
                  onEjecutarExportacionPostT={handleEjecutarExportacionEduLosilla}
                  onResetNuclear={handleResetNuclear}
                  onClearLogs={handleClearLogs}
                />
              )}

              {adminTab === 'gas' && <AdminGASViewer />}
            </main>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALES GLOBALES                                                          */}
      {/* ========================================================================= */}
      <LoginModal
        isOpen={isLoginOpen}
        jugadores={jugadores}
        onLogin={handleLogin}
        onClose={() => setIsLoginOpen(false)}
      />

      <ResguardoModal
        boleto={resguardoBoleto}
        partidos={partidos}
        saldoRestante={currentUser?.saldoJornadas}
        userEmail={currentUser?.email}
        onClose={() => setResguardoBoleto(null)}
      />

      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        jugadores={jugadores}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={handleAdminAuthSuccess}
      />
    </div>
  );
}
