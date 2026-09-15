import React, { useState, useEffect } from 'react';
import { Code, Copy, Check, Download, ExternalLink, Link, Database, Server, HelpCircle, ChevronDown, ChevronUp, RefreshCw, AlertCircle, CheckCircle2, FileSpreadsheet, LogIn, LogOut } from 'lucide-react';
import { gasBackend } from '../../services/gasBackend';
import { OFFICIAL_SPREADSHEET_ID, OFFICIAL_SPREADSHEET_URL } from '../../data/escudosList';
import { googleSignIn, googleSignOut, initAuth, readSheetRange, auth } from '../../services/googleSheetsService';
import { User } from 'firebase/auth';
import { APP_VERSION_STRING, APP_VERSION_MASTER } from '../../types';

export const AdminGASViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [apiUrl, setApiUrl] = useState(gasBackend.getApiUrl());
  const [savedUrl, setSavedUrl] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Google Sheets Direct OAuth State
  const [googleUser, setGoogleUser] = useState<User | null>(auth.currentUser);
  const [oauthToken, setOauthToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [sheetsDataStatus, setSheetsDataStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setOauthToken(token);
      },
      () => {
        setGoogleUser(null);
        setOauthToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleAuth = async () => {
    try {
      setIsAuthenticating(true);
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setOauthToken(res.accessToken);
        setSheetsDataStatus('¡Conectado exitosamente con Google Sheets API!');
      }
    } catch (err: any) {
      console.error(err);
      setSheetsDataStatus(`Error de autenticación: ${err.message}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleTestReadSheets = async () => {
    try {
      setSheetsDataStatus('Leyendo pestañas de Google Sheets...');
      const rows = await readSheetRange('JUGADORES', 'A1:E10');
      if (rows && rows.length > 0) {
        setSheetsDataStatus(`¡Éxito! Se leyeron ${rows.length} filas de la pestaña JUGADORES.`);
      } else {
        setSheetsDataStatus('Pestaña leída correctamente (vacía o sin filas adicionales).');
      }
    } catch (err: any) {
      setSheetsDataStatus(`Error al leer hoja: ${err.message}`);
    }
  };

  const gasCode = gasBackend.getCodigoGoogleAppsScript();

  const handleCopy = () => {
    navigator.clipboard.writeText(gasCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([gasCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Codigo_GoogleAppsScript_TRG_${APP_VERSION_STRING}.gs`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    gasBackend.setApiUrl(apiUrl.trim());
    setSavedUrl(true);
    setTestResult(null);
    setTimeout(() => setSavedUrl(false), 2000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await gasBackend.syncWithRemote();
      if (res.success) {
        setTestResult({
          ok: true,
          message: '¡Conexión establecida con éxito! Se han sincronizado los datos desde tu Google Sheet.',
        });
      } else {
        setTestResult({
          ok: false,
          message: res.message || 'No se pudo conectar. Verifica que la Web App esté desplegada con acceso "Cualquiera" y que la URL sea correcta.',
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: `Error al probar conexión: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Conexión Directa con Google Sheets (OAuth Oficial) */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Google Sheets API Oficial (OAuth)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {googleUser ? 'CONECTADO' : 'HABILITADO'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sheet ID: <span className="font-mono text-emerald-300">{OFFICIAL_SPREADSHEET_ID}</span>
              </p>
            </div>
          </div>

          <div>
            {!googleUser ? (
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isAuthenticating}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>{isAuthenticating ? 'Conectando...' : 'Iniciar Sesión con Google'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestReadSheets}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Probar Lectura Sheets</span>
                </button>
                <button
                  type="button"
                  onClick={googleSignOut}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Desconectar
                </button>
              </div>
            )}
          </div>
        </div>

        {sheetsDataStatus && (
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
            {sheetsDataStatus}
          </div>
        )}
      </div>

      {/* Cabecera & Enlace de Google Sheets */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Backend Centralizado Google Apps Script</h3>
              <p className="text-xs text-slate-400">
                Código.gs para desplegar como Web App en script.google.com
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Código.gs'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .gs</span>
            </button>
          </div>
        </div>

        {/* Configuración de Endpoint Web App */}
        <form onSubmit={handleSaveApiUrl} className="pt-2 border-t border-slate-800 text-xs space-y-2">
          <label className="font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-sky-400" />
              <span>URL de la Web App desplegada de tu Google Sheet:</span>
            </span>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showGuide ? 'Ocultar Guía' : 'Ver Guía Paso a Paso'}</span>
            </button>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
            />
            <div className="flex gap-2 shrink-0">
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black border border-sky-400/40 transition cursor-pointer"
              >
                {savedUrl ? '¡Guardada!' : 'Guardar URL'}
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold border border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Comprobando...' : 'Probar Conexión'}</span>
              </button>
            </div>
          </div>

          {/* Resultado de la prueba de conexión */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in ${
                testResult.ok
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold">{testResult.ok ? 'Conexión Exitosa' : 'Aviso de Conexión'}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">{testResult.message}</p>
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-500">
            * Esta URL permite leer y escribir automáticamente en tu Google Sheet (partidos, clasificaciones y resguardos).
          </p>
        </form>
      </div>

      {/* Guía Paso a Paso para Conectar Google Sheets */}
      {showGuide && (
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-sky-500/30 p-5 shadow-xl space-y-4 text-xs text-slate-300 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-black">
                📖
              </div>
              <h4 className="font-bold text-white text-sm">
                Cómo conectar tu hoja de Google Sheets en 4 sencillos pasos
              </h4>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
              Tiempo estimado: 3 minutos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <p className="font-bold text-sky-400 text-xs flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-[10px] font-black">1</span>
                <span>Pestañas en tu Google Sheet</span>
              </p>
              <p className="text-slate-400">
                Tu archivo debe tener 4 hojas con estos nombres exactos en mayúsculas:
                <br />
                <code className="text-white font-mono font-bold">JUGADORES</code>, <code className="text-white font-mono font-bold">PARTIDOS</code>, <code className="text-white font-mono font-bold">QUINIELAS</code> y <code className="text-white font-mono font-bold">LOGS</code>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <p className="font-bold text-sky-400 text-xs flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-[10px] font-black">2</span>
                <span>Abrir Editor de Apps Script</span>
              </p>
              <p className="text-slate-400">
                En tu Google Sheet, abre el menú superior:
                <br />
                <strong className="text-white">Extensiones ➔ Apps Script</strong>.
                <br />
                Borra el código que aparezca por defecto.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <p className="font-bold text-sky-400 text-xs flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-[10px] font-black">3</span>
                <span>Pegar Código.gs y Guardar</span>
              </p>
              <p className="text-slate-400">
                Pulsa el botón <strong>"Copiar Código.gs"</strong> (arriba) y pégalo en el editor de Apps Script. Pulsa el icono del disquete 💾 para guardar el proyecto.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-1">
              <p className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-[10px] font-black">4</span>
                <span>Desplegar como Aplicación Web</span>
              </p>
              <p className="text-slate-400">
                Pulsa <strong className="text-white">Implementar ➔ Nueva implementación</strong>:
                <br />
                • Tipo: <strong>Aplicación web</strong> (icono de engranaje)
                <br />
                • Ejecutar como: <strong>Yo (tu cuenta)</strong>
                <br />
                • Quién tiene acceso: <strong className="text-emerald-300">Cualquiera</strong> <em>(¡Muy importante!)</em>
                <br />
                Copia la URL <code className="text-white font-mono text-[10px]">https://script.google.com/macros/s/.../exec</code>, pégala arriba y pulsa <strong>Guardar</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visor de Código Fuente */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-mono text-slate-400">Código.gs • Google Apps Script {APP_VERSION_MASTER}</span>
          <span className="text-[11px] text-emerald-400">doPost(e) + Enrutador de Acciones</span>
        </div>

        <pre className="p-4 font-mono text-xs text-slate-300 max-h-[500px] overflow-y-auto leading-relaxed selection:bg-sky-500 selection:text-slate-950">
          <code>{gasCode}</code>
        </pre>
      </div>
    </div>
  );
};
