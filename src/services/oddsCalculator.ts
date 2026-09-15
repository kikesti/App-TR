/**
 * Motor de Cálculo Estadístico de Probabilidades (1X2) para la Quiniela
 * Aplica modelo de fuerza relativa (ELO/Rating) + Ventaja de campo histórica (+8%)
 */

interface TeamStrength {
  name: string;
  rating: number;
}

const TEAM_RATINGS: Record<string, number> = {
  // LaLiga EA Sports - Top
  'real madrid': 94,
  'fc barcelona': 92,
  'barcelona': 92,
  'atletico de madrid': 86,
  'atletico madrid': 86,
  'atletico': 86,
  'athletic club': 82,
  'athletic': 82,
  'real sociedad': 81,
  'villarreal': 80,
  'villarreal cf': 80,
  'real betis': 80,
  'betis': 80,
  'girona': 79,
  'girona fc': 79,
  'sevilla': 76,
  'sevilla fc': 76,
  'valencia': 75,
  'valencia cf': 75,
  'celta de vigo': 74,
  'celta': 74,
  'osasuna': 74,
  'ca osasuna': 74,
  'mallorca': 73,
  'rcd mallorca': 73,
  'getafe': 72,
  'getafe cf': 72,
  'rayo vallecano': 72,
  'rayo': 72,
  'alaves': 71,
  'deportivo alaves': 71,
  'las palmas': 71,
  'ud las palmas': 71,
  'leganes': 70,
  'cd leganes': 70,
  'valladolid': 70,
  'real valladolid': 70,
  'espanyol': 70,
  'rcd espanyol': 70,

  // LaLiga Hypermotion (Segunda División)
  'cadiz': 67,
  'cadiz cf': 67,
  'almeria': 66,
  'ud almeria': 66,
  'granada': 66,
  'granada cf': 66,
  'eibar': 65,
  'sd eibar': 65,
  'racing de santander': 66,
  'racing': 66,
  'real oviedo': 65,
  'oviedo': 65,
  'sporting de gijon': 65,
  'sporting': 65,
  'levante': 65,
  'levante ud': 65,
  'elche': 65,
  'elche cf': 65,
  'tenerife': 64,
  'cd tenerife': 64,
  'real zaragoza': 64,
  'zaragoza': 64,
  'deportivo de la coruña': 64,
  'deportivo': 64,
  'depor': 64,
  'malaga': 63,
  'malaga cf': 63,
  'burgos': 63,
  'burgos cf': 63,
  'albacete': 62,
  'castellon': 62,
  'huesca': 62,
  'sd huesca': 62,
  'cordoba': 61,
  'racing de ferrol': 61,
  'cartagena': 60,
  'eldense': 60,
  'mirandes': 60,

  // Liga F (Fútbol Femenino)
  'barcelona (f)': 98,
  'fc barcelona (f)': 98,
  'real madrid (f)': 88,
  'atletico de madrid (f)': 82,
  'atletico madrid (f)': 82,
  'levante (f)': 77,
  'levante ud (f)': 77,
  'madrid cff (f)': 75,
  'athletic club (f)': 74,
  'real sociedad (f)': 74,
  'sevilla (f)': 72,
  'sevilla fc (f)': 72,
  'costa adeje tenerife (f)': 70,
  'eibar (f)': 68,
  'valencia (f)': 67,
  'valencia cf (f)': 67,
  'granada (f)': 66,
  'real betis (f)': 66,
  'deportivo (f)': 65,
  'espanyol (f)': 65,
  'badalona w. (f)': 64,
  'levante las planas (f)': 64,
  'logroño (f)': 62,
  'alaves (f)': 64,
};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(cf|fc|sad|cd|ud|sd|rcd)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getTeamStrength(teamName: string): number {
  if (!teamName) return 65;
  const rawLower = teamName.toLowerCase().trim();
  if (TEAM_RATINGS[rawLower]) return TEAM_RATINGS[rawLower];

  const norm = normalizeName(teamName);
  for (const [key, val] of Object.entries(TEAM_RATINGS)) {
    if (normalizeName(key) === norm) return val;
  }

  // Búsqueda por subcadena
  for (const [key, val] of Object.entries(TEAM_RATINGS)) {
    if (norm.length > 3 && (norm.includes(normalizeName(key)) || normalizeName(key).includes(norm))) {
      return val;
    }
  }

  return 65; // Valor medio estándar
}

export interface MatchProbabilities {
  prob1: number;
  probX: number;
  prob2: number;
}

/**
 * Calcula probabilidades estadísticas 1X2 realistas
 * Aplica ventaja de campo local (+8 pts de fuerza)
 */
export function calculateMatchProbabilities(localName: string, visitName: string): MatchProbabilities {
  const localStrength = getTeamStrength(localName);
  const visitStrength = getTeamStrength(visitName);

  // Ventaja de jugar en casa en fútbol (+8 puntos)
  const homeAdvantage = 8;
  const effectiveLocal = localStrength + homeAdvantage;
  const diff = effectiveLocal - visitStrength; // Rango típico entre -20 y +35

  // Cálculo logístico base de probabilidad
  // En fútbol profesional el empate ronda el 26% - 33%
  let p1: number;
  let px: number;
  let p2: number;

  if (diff >= 30) {
    // Muy favorito local (ej. Real Madrid vs Rayo)
    p1 = 75;
    px = 16;
    p2 = 9;
  } else if (diff >= 20) {
    p1 = 66;
    px = 21;
    p2 = 13;
  } else if (diff >= 12) {
    p1 = 56;
    px = 26;
    p2 = 18;
  } else if (diff >= 5) {
    // Favorito moderado local (ej. Celta vs Osasuna)
    p1 = 46;
    px = 29;
    p2 = 25;
  } else if (diff >= -3) {
    // Muy parejos con ligera ventaja local por jugar en casa (ej. Cádiz vs Las Palmas)
    p1 = 40;
    px = 33;
    p2 = 27;
  } else if (diff >= -10) {
    // Visitante ligeramente superior pero compensado por campo
    p1 = 33;
    px = 32;
    p2 = 35;
  } else if (diff >= -20) {
    // Favorito visitante moderado
    p1 = 25;
    px = 28;
    p2 = 47;
  } else {
    // Muy favorito visitante (ej. equipo modesto vs Real Madrid/Barça)
    p1 = 14;
    px = 22;
    p2 = 64;
  }

  // Pequeña variación determinista basada en los caracteres de los nombres
  // para que dos partidos con fuerzas similares no tengan números idénticos
  const hash = (localName.length * 3 + visitName.length * 7) % 5 - 2; // de -2 a +2
  p1 = Math.max(10, Math.min(85, p1 + hash));
  p2 = Math.max(10, Math.min(85, p2 - hash));
  px = 100 - (p1 + p2);

  return { prob1: p1, probX: px, prob2: p2 };
}
