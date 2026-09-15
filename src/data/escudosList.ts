export const OFFICIAL_SPREADSHEET_ID = '1u1lY9WfuO85sZQfs7mb66I099fSglSqg6E-RV85MfKI';
export const OFFICIAL_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${OFFICIAL_SPREADSHEET_ID}/edit`;

export interface EscudoInfo {
  nombre: string;
  url: string;
  nombreNormalizado: string;
}

export const ESCUDOS_LIGA: EscudoInfo[] = [
  {
    nombre: 'Real Madrid',
    nombreNormalizado: 'real madrid',
    url: 'https://tmssl.akamaized.net/images/wappen/head/418.png',
  },
  {
    nombre: 'FC Barcelona',
    nombreNormalizado: 'fc barcelona',
    url: 'https://tmssl.akamaized.net/images/wappen/head/131.png',
  },
  {
    nombre: 'Atletico Madrid',
    nombreNormalizado: 'atletico madrid',
    url: 'https://tmssl.akamaized.net/images/wappen/head/13.png',
  },
  {
    nombre: 'Athletic Club',
    nombreNormalizado: 'athletic club',
    url: 'https://tmssl.akamaized.net/images/wappen/head/621.png',
  },
  {
    nombre: 'Real Sociedad',
    nombreNormalizado: 'real sociedad',
    url: 'https://tmssl.akamaized.net/images/wappen/head/681.png',
  },
  {
    nombre: 'Real Betis',
    nombreNormalizado: 'real betis',
    url: 'https://tmssl.akamaized.net/images/wappen/head/150.png',
  },
  {
    nombre: 'Villarreal',
    nombreNormalizado: 'villarreal',
    url: 'https://tmssl.akamaized.net/images/wappen/head/1050.png',
  },
  {
    nombre: 'Sevilla',
    nombreNormalizado: 'sevilla',
    url: 'https://tmssl.akamaized.net/images/wappen/head/368.png',
  },
  {
    nombre: 'Valencia',
    nombreNormalizado: 'valencia',
    url: 'https://tmssl.akamaized.net/images/wappen/head/1049.png',
  },
  {
    nombre: 'Celta Vigo',
    nombreNormalizado: 'celta vigo',
    url: 'https://tmssl.akamaized.net/images/wappen/head/940.png',
  },
  {
    nombre: 'Osasuna',
    nombreNormalizado: 'osasuna',
    url: 'https://tmssl.akamaized.net/images/wappen/head/331.png',
  },
  {
    nombre: 'Getafe',
    nombreNormalizado: 'getafe',
    url: 'https://tmssl.akamaized.net/images/wappen/head/3709.png',
  },
  {
    nombre: 'Girona',
    nombreNormalizado: 'girona',
    url: 'https://logodownload.org/wp-content/uploads/2022/10/girona-fc-logo-1-1.png',
  },
  {
    nombre: 'Alaves',
    nombreNormalizado: 'alaves',
    url: 'https://tmssl.akamaized.net/images/wappen/head/1108.png',
  },
  {
    nombre: 'Mallorca',
    nombreNormalizado: 'mallorca',
    url: 'https://tmssl.akamaized.net/images/wappen/head/237.png',
  },
  {
    nombre: 'Espanyol',
    nombreNormalizado: 'espanyol',
    url: 'https://tmssl.akamaized.net/images/wappen/head/714.png',
  },
  {
    nombre: 'Las Palmas',
    nombreNormalizado: 'las palmas',
    url: 'https://tmssl.akamaized.net/images/wappen/head/472.png',
  },
  {
    nombre: 'Rayo Vallecano',
    nombreNormalizado: 'rayo vallecano',
    url: 'https://tmssl.akamaized.net/images/wappen/head/367.png',
  },
  {
    nombre: 'Real Valladolid',
    nombreNormalizado: 'real valladolid',
    url: 'https://media.api-sports.io/football/teams/722.png',
  },
  {
    nombre: 'Leganes',
    nombreNormalizado: 'leganes',
    url: 'https://cpcacereno.com/wp-content/uploads/2021/08/CD-Leganes.png',
  },
  {
    nombre: 'Sporting Gijon',
    nombreNormalizado: 'sporting gijon',
    url: 'https://tmssl.akamaized.net/images/wappen/head/2448.png',
  },
  {
    nombre: 'Real Oviedo',
    nombreNormalizado: 'real oviedo',
    url: 'https://comprarpegatinas.com/images/stories/virtuemart/product/pegatinas/Real_Oviedo_CF.png',
  },
  {
    nombre: 'Racing Santander',
    nombreNormalizado: 'racing santander',
    url: 'https://toppng.com/uploads/preview/real-racing-club-de-santander-vector-logo-11574288407vqufgqbf8f.png',
  },
  {
    nombre: 'Levante',
    nombreNormalizado: 'levante',
    url: 'https://tmssl.akamaized.net/images/wappen/head/3368.png',
  },
  {
    nombre: 'Real Zaragoza',
    nombreNormalizado: 'real zaragoza',
    url: 'https://tmssl.akamaized.net/images/wappen/head/142.png',
  },
  {
    nombre: 'Elche',
    nombreNormalizado: 'elche',
    url: 'https://toppng.com/uploads/preview/elche-cf-vector-logo-11574289614bofpklrxld.png',
  }
];

export function obtenerEscudoPorNombre(nombreEquipo: string): EscudoInfo | undefined {
  if (!nombreEquipo) return undefined;
  const normalizado = nombreEquipo.toLowerCase().trim();
  return (
    ESCUDOS_LIGA.find((e) => e.nombreNormalizado === normalizado) ||
    ESCUDOS_LIGA.find((e) => normalizado.includes(e.nombreNormalizado) || e.nombreNormalizado.includes(normalizado))
  );
}
