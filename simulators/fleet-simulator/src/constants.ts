// Dati porti reali internazionali
export const PORTS = {
  ROTTERDAM: { name: 'Rotterdam', country: 'NL', lat: 51.9225, lng: 4.2797 },
  SINGAPORE: { name: 'Singapore', country: 'SG', lat: 1.3521, lng: 103.8198 },
  SHANGHAI: { name: 'Shanghai', country: 'CN', lat: 31.2304, lng: 121.4737 },
  DUBAI: { name: 'Dubai', country: 'AE', lat: 25.276987, lng: 55.296249 },
  HAMBURG: { name: 'Hamburg', country: 'DE', lat: 53.5511, lng: 9.9937 },
  HONG_KONG: { name: 'Hong Kong', country: 'HK', lat: 22.2793, lng: 114.1633 },
  LOS_ANGELES: { name: 'Los Angeles', country: 'US', lat: 34.0522, lng: -118.2437 },
  ANTWERP: { name: 'Antwerp', country: 'BE', lat: 51.2194, lng: 4.4025 },
  KAOHSIUNG: { name: 'Kaohsiung', country: 'TW', lat: 22.5917, lng: 120.2722 },
  GENOA: { name: 'Genoa', country: 'IT', lat: 44.4096, lng: 8.9454 },
};

export const VESSEL_TYPES = ['Container Ship', 'Bulk Carrier', 'Tanker', 'RoRo Ship', 'General Cargo'];

export const SHIPPING_ROUTES = [
  { from: 'ROTTERDAM', to: 'SHANGHAI', distance: 11000, duration: 33 }, // hours
  { from: 'ROTTERDAM', to: 'DUBAI', distance: 6700, duration: 20 },
  { from: 'SINGAPORE', to: 'ROTTERDAM', distance: 11500, duration: 34 },
  { from: 'SHANGHAI', to: 'LOS_ANGELES', distance: 6300, duration: 19 },
  { from: 'DUBAI', to: 'ROTTERDAM', distance: 6700, duration: 20 },
  { from: 'HONG_KONG', to: 'ROTTERDAM', distance: 11800, duration: 35 },
  { from: 'HAMBURG', to: 'SINGAPORE', distance: 11200, duration: 34 },
  { from: 'ANTWERP', to: 'SHANGHAI', distance: 11100, duration: 33 },
];

// 1 ora reale = 1 secondo simulato
export const TIME_SCALE = 3600; // 1 ora = 3600 secondi

// Velocità media navi (nodi) = miglie nautiche all'ora
export const AVERAGE_SHIP_SPEED = 20; // nodi

export const DISASTER_TYPES = [
  'hurricane',
  'typhoon',
  'extreme_waves',
  'fog_bank',
  'engine_failure',
  'mechanical_issue',
  'route_closure', // es. stretto impraticabile
  'extreme_cold',
  'extreme_heat',
];
