import React, { useState, useRef } from 'react';
import {
  Camera,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Tv,
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';

export interface ExtractedMatch {
  numero: number;
  local: string;
  visitante: string;
  fechaHora: string;
  canalTv?: string;
  prob1?: number;
  probX?: number;
  prob2?: number;
}

export interface ExtractionResult {
  numeroJornada?: number;
  partidos: ExtractedMatch[];
}

interface Props {
  onApplyMatches: (data: ExtractionResult, jsonString: string) => void;
}

export const AdminJornadaImageScanner: React.FC<Props> = ({ onApplyMatches }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [modelUsed, setModelUsed] = useState<string>('');
  const [rawJson, setRawJson] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecciona un archivo de imagen válido (PNG, JPG, WebP).');
      return;
    }

    setErrorMessage(null);
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
      setExtractionResult(null);
      setRawJson('');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleScanImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/extract-jornada-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: mimeType || 'image/png',
        }),
      });

      const json = await response.json();

      if (!response.ok || json.error) {
        throw new Error(json.mensaje || json.error || 'Error al procesar la imagen con Gemini Visión.');
      }

      const data: ExtractionResult = json.data;

      if (!data || !Array.isArray(data.partidos) || data.partidos.length === 0) {
        throw new Error('No se detectaron partidos válidos en la imagen analizada.');
      }

      setExtractionResult(data);
      setModelUsed(json.modelUsed || '');

      // Formatear JSON limpio compatible con importarPartidosJson
      const jsonFormatted = JSON.stringify(
        {
          numeroJornada: data.numeroJornada || 1,
          partidos: data.partidos,
        },
        null,
        2
      );
      setRawJson(jsonFormatted);
    } catch (err: any) {
      console.error('Error al extraer jornada de imagen:', err);
      setErrorMessage(
        err.message || 'No se pudo procesar la imagen. Verifica que sea una captura nítida de los partidos.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMatchEdit = (index: number, field: keyof ExtractedMatch, value: any) => {
    if (!extractionResult) return;
    const updated = [...extractionResult.partidos];
    updated[index] = { ...updated[index], [field]: value };
    const newResult = { ...extractionResult, partidos: updated };
    setExtractionResult(newResult);
    setRawJson(JSON.stringify(newResult, null, 2));
  };

  const handleJornadaNumberEdit = (num: number) => {
    if (!extractionResult) return;
    const newResult = { ...extractionResult, numeroJornada: num };
    setExtractionResult(newResult);
    setRawJson(JSON.stringify(newResult, null, 2));
  };

  const handleCopyJson = () => {
    if (!rawJson) return;
    navigator.clipboard.writeText(rawJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (!extractionResult) return;
    onApplyMatches(extractionResult, rawJson);
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-4 shadow-xl">
      {/* Cabecera con distintivo IA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-slate-950 shadow-md">
            <Sparkles className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Escanear Captura de Jornada con IA (Gemini Visión)</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                DIRECTO DESDE IMAGEN
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Sube la captura de pantalla con los 15 partidos, fechas y horas. La IA extraerá los datos automáticamente sin necesidad de copiar y pegar JSON.
            </p>
          </div>
        </div>
      </div>

      {/* Zona de Subida / Arrastre de Imagen */}
      {!selectedImage ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
            isDragOver
              ? 'border-sky-400 bg-sky-500/10'
              : 'border-slate-700 hover:border-sky-500/50 bg-slate-950/40 hover:bg-slate-950/70'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <p className="text-sm font-bold text-white">
              Arrastra tu captura aquí o pulsa para seleccionar
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Admite capturas del móvil, fotos de la administración de loterías o boletines oficiales (PNG, JPG, WebP)
            </p>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-semibold px-3 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-sky-400" />
              <span>Cámara / Galería</span>
            </span>
            <span className="text-[11px] text-slate-500">• Extrae Partidos 1-14 y Pleno al 15</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Vista Previa de la Imagen Seleccionada */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              <img
                src={selectedImage}
                alt="Captura de Jornada"
                className="w-32 h-36 object-cover rounded-xl border border-slate-700 shadow"
              />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center">
                <span className="text-[10px] text-white font-bold bg-slate-900/80 px-2 py-1 rounded">
                  Captura lista
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Imagen de Jornada Cargada
                </h4>
                <p className="text-xs text-slate-400">
                  Pulsa el botón para que Gemini Visión analice los 15 partidos, normalice los nombres de los equipos y organice los horarios.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                <button
                  onClick={handleScanImage}
                  disabled={isAnalyzing}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 font-black text-xs transition active:scale-95 shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Extrayendo con IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-slate-950" />
                      <span>Escanear y Extraer 15 Partidos</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setExtractionResult(null);
                    setRawJson('');
                    setErrorMessage(null);
                  }}
                  disabled={isAnalyzing}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                >
                  Cambiar Imagen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de Error */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Estado de Carga con Animación de Escáner */}
      {isAnalyzing && (
        <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 text-center space-y-3">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Analizando captura de la Quiniela...</h4>
            <p className="text-xs text-indigo-200/70 mt-1">
              Leyendo partidos 1 al 14, identificando el Pleno al 15, cotejando fechas y generando probabilidades.
            </p>
          </div>
        </div>
      )}

      {/* Resultados de la Extracción */}
      {extractionResult && (
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-white">
                  ¡Extracción Completada con Éxito! ({extractionResult.partidos.length} partidos)
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">Jornada Detectada:</span>
                  <input
                    type="number"
                    value={extractionResult.numeroJornada || 1}
                    onChange={(e) => handleJornadaNumberEdit(parseInt(e.target.value) || 1)}
                    className="w-14 rounded-lg bg-slate-950 border border-slate-700 px-2 py-0.5 text-xs text-amber-400 font-bold text-center focus:outline-none focus:border-amber-400"
                  />
                  {modelUsed && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-slate-700">
                      ⚡ {modelUsed}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyJson}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar JSON'}</span>
              </button>

              <button
                onClick={handleApply}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aplicar a la Jornada</span>
              </button>
            </div>
          </div>

          {/* Tabla Resumida de los 15 Partidos Extraídos */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden text-xs">
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
              {extractionResult.partidos.map((match, idx) => {
                const isPleno = match.numero === 15;
                return (
                  <div
                    key={match.numero || idx}
                    className={`p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/60 transition ${
                      isPleno ? 'bg-amber-500/5 border-l-4 border-amber-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-black shrink-0 text-xs ${
                          isPleno
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-sky-400 border border-slate-700'
                        }`}
                      >
                        {match.numero}
                      </span>

                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <input
                          type="text"
                          value={match.local}
                          onChange={(e) => handleMatchEdit(idx, 'local', e.target.value)}
                          className="flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-sky-500 focus:bg-slate-900 rounded px-1.5 py-0.5 text-white font-bold truncate focus:outline-none"
                        />
                        <span className="text-slate-500 font-bold shrink-0">-</span>
                        <input
                          type="text"
                          value={match.visitante}
                          onChange={(e) => handleMatchEdit(idx, 'visitante', e.target.value)}
                          className="flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-sky-500 focus:bg-slate-900 rounded px-1.5 py-0.5 text-white font-bold truncate focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 shrink-0 self-end sm:self-center">
                      <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                        <Calendar className="w-3 h-3 text-sky-400" />
                        <input
                          type="text"
                          value={match.fechaHora}
                          onChange={(e) => handleMatchEdit(idx, 'fechaHora', e.target.value)}
                          className="bg-transparent text-[11px] text-slate-300 w-24 focus:outline-none"
                        />
                      </div>
                      {isPleno && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          PLENO AL 15
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
