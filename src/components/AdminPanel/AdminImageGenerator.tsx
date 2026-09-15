import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Ratio,
  Maximize2,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  CheckCircle2,
  Layers
} from 'lucide-react';

interface Props {
  numeroJornada?: number;
}

export const AdminImageGenerator: React.FC<Props> = ({ numeroJornada = 7 }) => {
  const [prompt, setPrompt] = useState(
    `Cartel épico oficial de fútbol para la Jornada ${numeroJornada} de la Liga TRG: Estadio abarrotado bajo focos nocturnos, césped reluciente, trofeo dorado en el centro y ambientación cinemática hiperrealista de alta definición.`
  );
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [imageSize, setImageSize] = useState<string>('1K');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const aspectRatios = [
    { label: '1:1 (Cuadrado)', value: '1:1' },
    { label: '16:9 (Panorámico TV)', value: '16:9' },
    { label: '9:16 (Historia/Story)', value: '9:16' },
    { label: '4:3 (Estándar)', value: '4:3' },
    { label: '3:4 (Retrato)', value: '3:4' },
    { label: '3:2 (Fotografía)', value: '3:2' },
    { label: '2:3 (Póster Vertical)', value: '2:3' },
    { label: '21:9 (Cinemascope)', value: '21:9' },
  ];

  const imageSizes = ['512px', '1K', '2K', '4K'];

  const presets = [
    {
      title: 'Cartel de Jornada',
      prompt:
        'Cartel promocional oficial para la Jornada de Quiniela: Gran estadio nocturno con gradas llenas de pasión, humo dramático, balón de fútbol oficial en primer plano y destellos dorados.',
      ratio: '16:9',
    },
    {
      title: 'Duelo Estelar Clásico',
      prompt:
        'Duelo de titanes del fútbol español: Dos capitanes frente a frente en un túnel de vestuarios con iluminación de cine dramática y las banderas de sus clubes.',
      ratio: '3:2',
    },
    {
      title: 'Póster Móvil (Stories)',
      prompt:
        'Póster vertical de fútbol moderno con gráficos de App TR, silueta de delantero rematando una chilena bajo la lluvia con efectos de neón.',
      ratio: '9:16',
    },
    {
      title: 'Emblema de Club',
      prompt:
        'Escudo heráldico de club de fútbol profesional bordado en oro y plata sobre tela de camiseta deportiva de alta costura.',
      ratio: '1:1',
    },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          imageSize,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al generar la imagen.');
      }

      setResultImage(data.imageUrl);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ||
          'No se pudo generar la imagen. Asegúrate de que GEMINI_API_KEY esté configurada.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `LigaTRG_Cartel_${aspectRatio.replace(':', 'x')}_${imageSize}.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Generador de Carteles & Gráficos con IA (Gemini Image)
            </h3>
            <p className="text-xs text-slate-400">
              Crea promociones de jornada, fondos y creatividades en alta resolución (1K, 2K, 4K)
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-bold self-start sm:self-auto">
          gemini-3.1-flash-image
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controles de Configuración */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-4 shadow-md">
            {/* Aspect Ratio */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Ratio className="w-3.5 h-3.5 text-sky-400" />
                  <span>Relación de Aspecto (Aspect Ratio)</span>
                </span>
                <span className="text-[11px] text-sky-400">{aspectRatio}</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {aspectRatios.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setAspectRatio(r.value)}
                    className={`py-1.5 px-2.5 rounded-xl text-[11px] font-semibold transition border text-left truncate cursor-pointer ${
                      aspectRatio === r.value
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolución / Image Size */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Resolución de Salida (Image Size)</span>
                </span>
                <span className="text-[11px] text-amber-400">{imageSize}</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {imageSizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setImageSize(size)}
                    className={`py-1.5 rounded-xl text-xs font-black transition border cursor-pointer ${
                      imageSize === size
                        ? 'bg-amber-400 text-slate-950 border-amber-400 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                Descripción del Cartel o Escudo (Prompt)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                placeholder="Describe la imagen que deseas generar..."
              />
            </div>

            {/* Plantillas Rápidas */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">
                Ideas & Plantillas Rápidas:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(p.prompt);
                      setAspectRatio(p.ratio);
                    }}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white hover:border-slate-700 text-left truncate cursor-pointer"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Botón Generar */}
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:opacity-90 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generando Imagen con Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generar Cartel con IA</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Visor de Resultado */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col items-center justify-center min-h-[420px] shadow-md relative overflow-hidden">
            {resultImage ? (
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Cartel Generado ({imageSize} • {aspectRatio})</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownload}
                      className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800 shadow-2xl max-h-[500px]">
                  <img
                    src={resultImage}
                    alt="Cartel generado por IA"
                    className="max-h-[480px] w-auto object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center p-8 space-y-3 text-slate-500">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-400">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-300">Lienzo Vacío</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Configura la resolución y el formato deseado y pulsa "Generar Cartel con IA" para producir una imagen oficial de la jornada.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
