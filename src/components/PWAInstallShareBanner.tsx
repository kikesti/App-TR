import React, { useEffect, useState } from 'react';
import { Download, Share2, Smartphone, Check, Copy, MessageCircle, ExternalLink, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface Props {
  isDemoMode?: boolean;
  onEnterDemo?: () => void;
  onExitDemo?: () => void;
}

export const PWAInstallShareBanner: React.FC<Props> = ({
  isDemoMode = false,
  onEnterDemo,
  onExitDemo,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Comprobar si la app ya está instalada / modo standalone
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(Boolean(isStandalone));
    };

    checkStandalone();

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowIOSModal(true);
    }
  };

  // URL para compartir que incluye automáticamente ?demo=1 para enganchar a nuevos usuarios
  const getShareUrl = () => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?demo=1`;
  };

  const shareText = '⚽ ¡Únete a App TR! Echa un vistazo a la demo interactiva y prueba tus pronósticos aquí:';

  const handleShareClick = async () => {
    const url = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'App TR (Demo)',
          text: shareText,
          url: url,
        });
        return;
      } catch (err) {
        // Si el usuario canceló el diálogo nativo, no hacemos nada
      }
    }
    // Si no soporta navigator.share o canceló, abrimos modal con WhatsApp y copiar enlace
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(`${shareText}\n${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const url = getShareUrl();
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${url}`)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* CASO 1: APP YA INSTALADA -> BOTÓN / BANNER ELEGANTE PARA COMPARTIR        */}
      {/* ========================================================================= */}
      {isInstalled ? (
        <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-sky-950/90 border-b border-emerald-800/40 px-3 py-2 text-xs shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <p className="text-slate-200 text-xs font-medium truncate">
                <strong className="text-emerald-400 font-bold">PWA Instalada</strong> • ¿Quieres invitar a un amigo?
              </p>
            </div>

            <button
              onClick={handleShareClick}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition shrink-0 cursor-pointer"
              title="Compartir enlace con Demo interactiva"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir App</span>
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* CASO 2: APP NO INSTALADA -> BANNER PERSISTENTE PARA INSTALAR              */
        /* ========================================================================= */
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border-b border-sky-500/30 px-3 sm:px-4 py-2.5 shadow-lg relative z-40 transition-all">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Lado izquierdo: Información */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-white tracking-tight">
                    Instala App TR en tu móvil
                  </h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    PWA Oficial
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate">
                  Acceso directo a pantalla completa, sin barra de navegador y sellado rápido.
                </p>
              </div>
            </div>

            {/* Lado derecho: Acciones (Instalar + Compartir Demo) */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={handleShareClick}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                title="Compartir enlace con Demo interactiva"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Compartir Demo</span>
              </button>

              <button
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar App</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GUÍA DE INSTALACIÓN EN IPHONE (SAFARI) O NAVEGADOR                   */}
      {/* ========================================================================= */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img
                src="/icon-192.png"
                alt="App TR"
                className="w-12 h-12 rounded-2xl border border-sky-500/40 shadow-md shrink-0"
              />
              <div>
                <h3 className="text-sm font-bold text-white">Instalar App TR</h3>
                <p className="text-xs text-slate-400">Icono directo en tu pantalla de inicio</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <span className="w-6 h-6 rounded-full bg-sky-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                  1
                </span>
                <div>
                  <p className="font-semibold text-white">Pulsa en Compartir</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Toca el icono <strong>Compartir</strong> (<span className="text-sky-400">⎋</span> en Safari iPhone o el menú <strong className="text-sky-400">⋮</strong> en Chrome).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <span className="w-6 h-6 rounded-full bg-sky-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                  2
                </span>
                <div>
                  <p className="font-semibold text-white">Añadir a pantalla de inicio</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Baja en las opciones y selecciona <strong>"Añadir a la pantalla de inicio"</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <span className="w-6 h-6 rounded-full bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                  3
                </span>
                <div>
                  <p className="font-semibold text-white">¡Listo!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Se creará el icono oficial de <strong>App TR</strong> en tu móvil para entrar directamente.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 py-2.5 text-xs font-black transition cursor-pointer shadow-md"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: COMPARTIR APP / INVITAR A AMIGOS CON DEMO ACTIVA                    */}
      {/* ========================================================================= */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Compartir App TR</h3>
                <p className="text-xs text-amber-400 font-medium">Incluye demostración interactiva (?demo=1)</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Quien abra este enlace podrá <strong>probar la app en directo</strong>, simular un boleto, ver las probabilidades y explorar el ranking sin necesidad de tener PIN creado.
            </p>

            <div className="space-y-2.5">
              {/* Botón WhatsApp */}
              <button
                onClick={handleWhatsAppShare}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </button>

              {/* Botón Copiar Enlace */}
              <button
                onClick={handleCopyLink}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
                <span>{copied ? '¡Enlace copiado al portapapeles!' : 'Copiar enlace con Demo'}</span>
              </button>
            </div>

            {/* Enlace en texto para ver */}
            <div className="mt-4 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 break-all">
              {getShareUrl()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
