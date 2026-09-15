// Motor Híbrido de Escudos de Fútbol TRG (4 Capas)
// Extraído de la base oficial de Código.gs de Liga TRG v20.57 Master

export const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/861/861512.png";

export const COUNTRY_MAP: Record<string, string> = {
  espana: "es",
  españa: "es",
  argentina: "ar",
  brasil: "br",
  francia: "fr",
  alemania: "de",
  portugal: "pt",
  inglaterra: "gb-eng",
  mexico: "mx",
  méxico: "mx",
  usa: "us",
  eeuu: "us",
  "estados unidos": "us",
  canada: "ca",
  canadá: "ca",
  italia: "it",
  holanda: "nl",
  "paises bajos": "nl",
  "países bajos": "nl",
  netherlands: "nl",
  belgica: "be",
  bélgica: "be",
  uruguay: "uy",
  colombia: "co",
  marruecos: "ma",
  japon: "jp",
  japón: "jp",
  croacia: "hr",
  suiza: "ch",
  dinamarca: "dk",
  serbia: "rs",
  polonia: "pl",
  suecia: "se",
  chile: "cl",
  ecuador: "ec",
  peru: "pe",
  perú: "pe",
  venezuela: "ve",
  paraguay: "py",
  costa_rica: "cr",
  "costa rica": "cr",
  panama: "pa",
  panamá: "pa",
  senegal: "sn",
  egipto: "eg",
  nigeria: "ng",
  camerun: "cm",
  camerún: "cm",
  argelia: "dz",
  ghana: "gh",
  "corea del sur": "kr",
  iran: "ir",
  irán: "ir",
  "arabia saudi": "sa",
  "arabia saudí": "sa",
  australia: "au",
  qatar: "qa",
};

export interface ShieldItem {
  n: string;
  u: string;
  a: string[];
  primaryColor?: string;
  secondaryColor?: string;
}

export const BASE_SHIELDS: ShieldItem[] = [
  {
    n: "Real Madrid",
    u: "https://tmssl.akamaized.net/images/wappen/head/418.png",
    a: ["real madrid", "madrid", "rmadrid", "real madrid cf"],
    primaryColor: "#ffffff",
    secondaryColor: "#3b82f6",
  },
  {
    n: "Barcelona",
    u: "https://tmssl.akamaized.net/images/wappen/head/131.png",
    a: ["barcelona", "barca", "barça", "fcb", "fc barcelona"],
    primaryColor: "#004d98",
    secondaryColor: "#a50044",
  },
  {
    n: "Atletico Madrid",
    u: "https://tmssl.akamaized.net/images/wappen/head/13.png",
    a: ["atletico madrid", "atletico", "atm", "at madrid", "atleti", "atletico de madrid", "atlético madrid"],
    primaryColor: "#cb3524",
    secondaryColor: "#ffffff",
  },
  {
    n: "Athletic Club",
    u: "https://tmssl.akamaized.net/images/wappen/head/621.png",
    a: ["athletic club", "athletic", "bilbao", "athletic bilbao"],
    primaryColor: "#ee2523",
    secondaryColor: "#ffffff",
  },
  {
    n: "Real Sociedad",
    u: "https://tmssl.akamaized.net/images/wappen/head/681.png",
    a: ["real sociedad", "sociedad", "rsociedad"],
    primaryColor: "#0067b1",
    secondaryColor: "#ffffff",
  },
  {
    n: "Real Betis",
    u: "https://tmssl.akamaized.net/images/wappen/head/150.png",
    a: ["real betis", "betis", "balompie", "real betis balompié"],
    primaryColor: "#00954c",
    secondaryColor: "#ffffff",
  },
  {
    n: "Villarreal",
    u: "https://tmssl.akamaized.net/images/wappen/head/1050.png",
    a: ["villarreal", "villarreal cf", "villareal"],
    primaryColor: "#ffe600",
    secondaryColor: "#005bac",
  },
  {
    n: "Valencia",
    u: "https://tmssl.akamaized.net/images/wappen/head/1049.png",
    a: ["valencia", "valencia cf", "vcf", "valència cf"],
    primaryColor: "#ffffff",
    secondaryColor: "#ea5a0b",
  },
  {
    n: "Osasuna",
    u: "https://tmssl.akamaized.net/images/wappen/head/331.png",
    a: ["osasuna", "ca osasuna", "pamplona"],
    primaryColor: "#d61a21",
    secondaryColor: "#091c3e",
  },
  {
    n: "Alaves",
    u: "https://tmssl.akamaized.net/images/wappen/head/1108.png",
    a: ["alaves", "deportivo alaves", "vitoria", "alavés"],
    primaryColor: "#005ba9",
    secondaryColor: "#ffffff",
  },
  {
    n: "Getafe",
    u: "https://tmssl.akamaized.net/images/wappen/head/3709.png",
    a: ["getafe", "getafe cf"],
    primaryColor: "#005ba9",
    secondaryColor: "#ffffff",
  },
  {
    n: "Celta Vigo",
    u: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTN4WKXGZpzEye4NmGtOq-Kc3Xv-ZjQJMTfg&s",
    a: ["celta vigo", "celta", "vigo", "celta de vigo"],
    primaryColor: "#8ac3ee",
    secondaryColor: "#ffffff",
  },
  {
    n: "Mallorca",
    u: "https://tmssl.akamaized.net/images/wappen/head/237.png",
    a: ["mallorca", "rcd mallorca"],
    primaryColor: "#e20613",
    secondaryColor: "#000000",
  },
  {
    n: "Sevilla",
    u: "https://tmssl.akamaized.net/images/wappen/head/368.png",
    a: ["sevilla", "sevilla fc", "sfc"],
    primaryColor: "#ffffff",
    secondaryColor: "#d4001f",
  },
  {
    n: "Las Palmas",
    u: "https://tmssl.akamaized.net/images/wappen/head/472.png",
    a: ["las palmas", "ud las palmas", "udlp"],
    primaryColor: "#ffd700",
    secondaryColor: "#004fa3",
  },
  {
    n: "Rayo Vallecano",
    u: "https://tmssl.akamaized.net/images/wappen/head/367.png",
    a: ["rayo vallecano", "rayo", "vallecas", "vallecano"],
    primaryColor: "#ffffff",
    secondaryColor: "#e30613",
  },
  {
    n: "Real Valladolid",
    u: "https://tmssl.akamaized.net/images/wappen/head/366.png",
    a: ["real valladolid", "valladolid", "pucela"],
    primaryColor: "#572b7a",
    secondaryColor: "#ffffff",
  },
  {
    n: "Leganes",
    u: "https://cpcacereno.com/wp-content/uploads/2021/08/CD-Leganes.png",
    a: ["leganes", "cd leganes", "lega", "leganés"],
    primaryColor: "#005ba9",
    secondaryColor: "#ffffff",
  },
  {
    n: "Espanyol",
    u: "https://tmssl.akamaized.net/images/wappen/head/714.png",
    a: ["espanyol", "rcd espanyol", "pericos"],
    primaryColor: "#0077c8",
    secondaryColor: "#ffffff",
  },
  {
    n: "Girona",
    u: "https://logodownload.org/wp-content/uploads/2022/10/girona-fc-logo-1-1.png",
    a: ["girona", "girona fc"],
    primaryColor: "#cd1425",
    secondaryColor: "#ffffff",
  },
  {
    n: "Eibar",
    u: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjOisLXebU1D05pmNr1QGbAUh6nzevnQ8iOpbhxDzLf5cPxuopWK4UICfuzSjl9nh90Sr6xIamOqGhVCR9j82tuJaWoXezWpioimQDLcGRbB_vemtIwMZZfpk7unYfYkTOL_fYrkpHlwxq5/w1200-h630-p-k-no-nu/SD+Eibar.png",
    a: ["eibar", "sd eibar"],
  },
  {
    n: "Racing Santander",
    u: "https://toppng.com/uploads/preview/real-racing-club-de-santander-vector-logo-11574288407vqufgqbf8f.png",
    a: ["racing santander", "racing", "santander", "racing de santander"],
  },
  {
    n: "Sporting Gijon",
    u: "https://tmssl.akamaized.net/images/wappen/head/2448.png",
    a: ["sporting gijon", "sporting", "gijon", "sporting de gijon", "sporting de gijón"],
  },
  {
    n: "Real Oviedo",
    u: "https://comprarpegatinas.com/images/stories/virtuemart/product/pegatinas/Real_Oviedo_CF.png",
    a: ["real oviedo", "oviedo"],
  },
  {
    n: "Levante",
    u: "https://tmssl.akamaized.net/images/wappen/head/3368.png",
    a: ["levante", "levante ud", "lud"],
  },
  {
    n: "Real Zaragoza",
    u: "https://tmssl.akamaized.net/images/wappen/head/142.png",
    a: ["real zaragoza", "zaragoza"],
  },
  {
    n: "España",
    u: "https://flagcdn.com/w160/es.png",
    a: ["espana", "españa", "spain", "rfef"],
  },
  {
    n: "Argentina",
    u: "https://flagcdn.com/w160/ar.png",
    a: ["argentina", "albiceleste"],
  },
  {
    n: "Brasil",
    u: "https://flagcdn.com/w160/br.png",
    a: ["brasil", "brazil"],
  },
  {
    n: "Francia",
    u: "https://flagcdn.com/w160/fr.png",
    a: ["francia", "france"],
  },
  {
    n: "Alemania",
    u: "https://flagcdn.com/w160/de.png",
    a: ["alemania", "germany"],
  },
  {
    n: "Portugal",
    u: "https://flagcdn.com/w160/pt.png",
    a: ["portugal"],
  },
  {
    n: "Inglaterra",
    u: "https://flagcdn.com/w160/gb-eng.png",
    a: ["inglaterra", "england"],
  },
];

function cleanString(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getClubCrest(
  teamName: string,
  customCrestUrl?: string
): { url: string; fallbackText: string; bg: string; color: string } {
  if (customCrestUrl && customCrestUrl.trim().length > 0) {
    return {
      url: customCrestUrl,
      fallbackText: teamName.slice(0, 3).toUpperCase(),
      bg: "#1e293b",
      color: "#f8fafc",
    };
  }

  const clean = cleanString(teamName);

  // Capa 1: Diccionario Local
  const matched = BASE_SHIELDS.find(
    (b) =>
      cleanString(b.n) === clean ||
      b.a.some((alias) => clean === cleanString(alias) || clean.includes(cleanString(alias)))
  );

  if (matched) {
    return {
      url: matched.u,
      fallbackText: teamName.slice(0, 3).toUpperCase(),
      bg: matched.primaryColor || "#1e293b",
      color: matched.secondaryColor || "#ffffff",
    };
  }

  // Capa 2: FlagCDN para Países y Selecciones
  if (COUNTRY_MAP[clean]) {
    const code = COUNTRY_MAP[clean];
    return {
      url: `https://flagcdn.com/w160/${code}.png`,
      fallbackText: teamName.slice(0, 3).toUpperCase(),
      bg: "#1e293b",
      color: "#ffffff",
    };
  }

  // Fallback con iniciales y color determinista
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const bg = `hsl(${hue}, 65%, 35%)`;

  return {
    url: DEFAULT_LOGO,
    fallbackText: teamName.slice(0, 3).toUpperCase(),
    bg,
    color: "#ffffff",
  };
}
