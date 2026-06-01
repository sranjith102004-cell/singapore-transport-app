import { generatedTrainTimings } from './trainTimings.generated';

export type TrainLine = 'NSL' | 'EWL' | 'NEL' | 'CCL' | 'DTL' | 'TEL' | 'BPLRT' | 'SKLRT' | 'PGLRT';
export type LineFilter = TrainLine | 'ALL';

export type TrainStation = {
  id: string;
  name: string;
  area: string;
  codes: string[];
  lines: TrainLine[];
  latitude: number;
  longitude: number;
  hasAtm?: boolean;
  exits?: string[];
};

export type TrainDirection = {
  line: TrainLine;
  destination: string;
};

export type TrainTiming = {
  weekdayFirst: string;
  weekendFirst: string;
  weekdayLast: string;
  weekendLast: string;
};

const unavailableTrainTiming: TrainTiming = {
  weekdayFirst: '-',
  weekendFirst: '-',
  weekdayLast: '-',
  weekendLast: '-',
};

export const lineColors: Record<TrainLine, string> = {
  NSL: '#d42e12',
  EWL: '#009645',
  NEL: '#9900aa',
  CCL: '#fa9e0d',
  DTL: '#005ec4',
  TEL: '#9d5b25',
  BPLRT: '#748477',
  SKLRT: '#748477',
  PGLRT: '#748477',
};

export const trainLineFilters: LineFilter[] = [
  'ALL',
  'NSL',
  'EWL',
  'NEL',
  'CCL',
  'DTL',
  'TEL',
  'BPLRT',
  'SKLRT',
  'PGLRT',
];

export const formatDistance = (distance: number) => {
  if (distance < 1000) return `${Math.round(distance)}m`;

  return `${(distance / 1000).toFixed(1)}km`;
};

export const getFacilitiesText = (station: TrainStation) =>
  [
    'Lift',
    'escalator',
    'fare gates',
    'bicycle parking',
    station.hasAtm ? 'ATM' : null,
    'nearby bus stops',
  ]
    .filter(Boolean)
    .join(', ');

export const getCodeLine = (code: string): TrainLine => {
  if (code.startsWith('NS')) return 'NSL';
  if (code.startsWith('EW') || code.startsWith('CG')) return 'EWL';
  if (code.startsWith('NE')) return 'NEL';
  if (code.startsWith('CC') || code.startsWith('CE')) return 'CCL';
  if (code.startsWith('DT')) return 'DTL';
  if (code.startsWith('TE')) return 'TEL';
  if (code.startsWith('BP')) return 'BPLRT';
  if (code.startsWith('SE') || code.startsWith('SW') || code.startsWith('ST')) return 'SKLRT';
  if (code.startsWith('PE') || code.startsWith('PW') || code.startsWith('PT')) return 'PGLRT';

  return 'DTL';
};

const trainTimingKey = (stationCode: string, destination: string) =>
  `${stationCode}:${destination}`;

// Official operator timings for stations currently in the local station list.
// Source pages update over time, so keep missing rows as "-" until verified.
export const trainTimings: Record<string, TrainTiming> = {
  ...generatedTrainTimings,
  [trainTimingKey('NS10', 'Jurong East')]: { weekdayFirst: '5.35am', weekendFirst: '5.58am', weekdayLast: '12.37am', weekendLast: '12.37am' },
  [trainTimingKey('NS10', 'Marina South Pier')]: { weekdayFirst: '5.29am', weekendFirst: '5.45am', weekdayLast: '11.11pm', weekendLast: '11.11pm' },
  [trainTimingKey('NS12', 'Jurong East')]: { weekdayFirst: '5.29am', weekendFirst: '5.52am', weekdayLast: '12.31am', weekendLast: '12.31am' },
  [trainTimingKey('NS12', 'Marina South Pier')]: { weekdayFirst: '5.35am', weekendFirst: '5.51am', weekdayLast: '11.17pm', weekendLast: '11.17pm' },
  [trainTimingKey('NS11', 'Jurong East')]: { weekdayFirst: '5.32am', weekendFirst: '5.55am', weekdayLast: '12.34am', weekendLast: '12.34am' },
  [trainTimingKey('NS11', 'Marina South Pier')]: { weekdayFirst: '5.33am', weekendFirst: '5.49am', weekdayLast: '11.14pm', weekendLast: '11.14pm' },
  [trainTimingKey('NS13', 'Jurong East')]: { weekdayFirst: '5.27am', weekendFirst: '5.50am', weekdayLast: '12.28am', weekendLast: '12.28am' },
  [trainTimingKey('NS13', 'Marina South Pier')]: { weekdayFirst: '5.24am', weekendFirst: '5.54am', weekdayLast: '11.20pm', weekendLast: '11.20pm' },
  [trainTimingKey('NS14', 'Jurong East')]: { weekdayFirst: '5.24am', weekendFirst: '5.47am', weekdayLast: '12.26am', weekendLast: '12.26am' },
  [trainTimingKey('NS14', 'Marina South Pier')]: { weekdayFirst: '5.26am', weekendFirst: '5.57am', weekdayLast: '11.22pm', weekendLast: '11.22pm' },
  [trainTimingKey('NS16', 'Jurong East')]: { weekdayFirst: '5.17am', weekendFirst: '5.40am', weekdayLast: '12.18am', weekendLast: '12.18am' },
  [trainTimingKey('NS16', 'Marina South Pier')]: { weekdayFirst: '5.34am', weekendFirst: '6.05am', weekdayLast: '11.31pm', weekendLast: '11.31pm' },
  [trainTimingKey('NS17', 'Jurong East')]: { weekdayFirst: '6.08am', weekendFirst: '6.29am', weekdayLast: '12.14am', weekendLast: '12.14am' },
  [trainTimingKey('NS17', 'Marina South Pier')]: { weekdayFirst: '5.37am', weekendFirst: '6.02am', weekdayLast: '11.34pm', weekendLast: '11.34pm' },
  [trainTimingKey('NS19', 'Jurong East')]: { weekdayFirst: '6.04am', weekendFirst: '6.25am', weekdayLast: '12.09am', weekendLast: '12.09am' },
  [trainTimingKey('NS19', 'Marina South Pier')]: { weekdayFirst: '5.41am', weekendFirst: '6.06am', weekdayLast: '11.39pm', weekendLast: '11.39pm' },
  [trainTimingKey('NS20', 'Jurong East')]: { weekdayFirst: '6.01am', weekendFirst: '6.22am', weekdayLast: '12.07am', weekendLast: '12.07am' },
  [trainTimingKey('NS20', 'Marina South Pier')]: { weekdayFirst: '5.44am', weekendFirst: '6.08am', weekdayLast: '11.41pm', weekendLast: '11.41pm' },
  [trainTimingKey('NS21', 'Jurong East')]: { weekdayFirst: '5.59am', weekendFirst: '6.20am', weekdayLast: '12.04am', weekendLast: '12.04am' },
  [trainTimingKey('NS21', 'Marina South Pier')]: { weekdayFirst: '5.46am', weekendFirst: '6.11am', weekdayLast: '11.44pm', weekendLast: '11.44pm' },
  [trainTimingKey('NS22', 'Jurong East')]: { weekdayFirst: '6.11am', weekendFirst: '6.36am', weekdayLast: '12.02am', weekendLast: '12.02am' },
  [trainTimingKey('NS22', 'Marina South Pier')]: { weekdayFirst: '5.48am', weekendFirst: '6.13am', weekdayLast: '11.46pm', weekendLast: '11.46pm' },
  [trainTimingKey('NS23', 'Jurong East')]: { weekdayFirst: '6.09am', weekendFirst: '6.34am', weekdayLast: '11.59pm', weekendLast: '11.59pm' },
  [trainTimingKey('NS23', 'Marina South Pier')]: { weekdayFirst: '5.50am', weekendFirst: '6.15am', weekdayLast: '11.48pm', weekendLast: '11.48pm' },
  [trainTimingKey('NS24', 'Jurong East')]: { weekdayFirst: '6.07am', weekendFirst: '6.32am', weekdayLast: '11.57pm', weekendLast: '11.57pm' },
  [trainTimingKey('NS24', 'Marina South Pier')]: { weekdayFirst: '5.52am', weekendFirst: '6.17am', weekdayLast: '11.51pm', weekendLast: '11.51pm' },
  [trainTimingKey('NS25', 'Jurong East')]: { weekdayFirst: '6.05am', weekendFirst: '6.30am', weekdayLast: '11.55pm', weekendLast: '11.55pm' },
  [trainTimingKey('NS25', 'Marina South Pier')]: { weekdayFirst: '5.54am', weekendFirst: '6.19am', weekdayLast: '11.53pm', weekendLast: '11.53pm' },
  [trainTimingKey('NS26', 'Jurong East')]: { weekdayFirst: '6.03am', weekendFirst: '6.28am', weekdayLast: '11.53pm', weekendLast: '11.53pm' },
  [trainTimingKey('NS26', 'Marina South Pier')]: { weekdayFirst: '5.56am', weekendFirst: '6.21am', weekdayLast: '11.55pm', weekendLast: '11.55pm' },
  [trainTimingKey('NS27', 'Jurong East')]: { weekdayFirst: '6.01am', weekendFirst: '6.26am', weekdayLast: '11.50pm', weekendLast: '11.50pm' },
  [trainTimingKey('NS27', 'Marina South Pier')]: { weekdayFirst: '6.05am', weekendFirst: '6.32am', weekdayLast: '11.58pm', weekendLast: '11.58pm' },
  [trainTimingKey('NS28', 'Jurong East')]: { weekdayFirst: '6.10am', weekendFirst: '6.38am', weekdayLast: '11.48pm', weekendLast: '11.48pm' },
  [trainTimingKey('NS1', 'Marina South Pier')]: { weekdayFirst: '5.16am', weekendFirst: '5.35am', weekdayLast: '10.46pm', weekendLast: '10.46pm' },
  [trainTimingKey('NS9', 'Jurong East')]: { weekdayFirst: '5.38am', weekendFirst: '6.01am', weekdayLast: '12.40am', weekendLast: '12.40am' },
  [trainTimingKey('NS9', 'Marina South Pier')]: { weekdayFirst: '5.27am', weekendFirst: '5.43am', weekdayLast: '11.08pm', weekendLast: '11.08pm' },
  [trainTimingKey('EW1', 'Tuas Link')]: { weekdayFirst: '5.28am', weekendFirst: '5.54am', weekdayLast: '11.23pm', weekendLast: '11.23pm' },
  [trainTimingKey('EW2', 'Tuas Link')]: { weekdayFirst: '5.31am', weekendFirst: '5.57am', weekdayLast: '11.26pm', weekendLast: '11.26pm' },
  [trainTimingKey('EW2', 'Pasir Ris')]: { weekdayFirst: '5.21am', weekendFirst: '5.47am', weekdayLast: '12.37am', weekendLast: '12.37am' },
  [trainTimingKey('EW3', 'Tuas Link')]: { weekdayFirst: '5.33am', weekendFirst: '5.59am', weekdayLast: '11.28pm', weekendLast: '11.28pm' },
  [trainTimingKey('EW3', 'Pasir Ris')]: { weekdayFirst: '5.19am', weekendFirst: '5.45am', weekdayLast: '12.37am', weekendLast: '12.37am' },
  [trainTimingKey('EW5', 'Tuas Link')]: { weekdayFirst: '5.40am', weekendFirst: '6.06am', weekdayLast: '11.36pm', weekendLast: '11.36pm' },
  [trainTimingKey('EW5', 'Pasir Ris')]: { weekdayFirst: '6.19am', weekendFirst: '6.47am', weekdayLast: '12.30am', weekendLast: '12.30am' },
  [trainTimingKey('EW8', 'Tuas Link')]: { weekdayFirst: '5.47am', weekendFirst: '6.13am', weekdayLast: '11.43pm', weekendLast: '11.43pm' },
  [trainTimingKey('EW8', 'Pasir Ris')]: { weekdayFirst: '6.12am', weekendFirst: '6.39am', weekdayLast: '12.22am', weekendLast: '12.22am' },
  [trainTimingKey('EW12', 'Tuas Link')]: { weekdayFirst: '5.56am', weekendFirst: '6.22am', weekdayLast: '11.53pm', weekendLast: '11.53pm' },
  [trainTimingKey('EW12', 'Pasir Ris')]: { weekdayFirst: '6.03am', weekendFirst: '6.31am', weekdayLast: '12.13am', weekendLast: '12.13am' },
  [trainTimingKey('EW13', 'Tuas Link')]: { weekdayFirst: '5.58am', weekendFirst: '6.24am', weekdayLast: '11.55pm', weekendLast: '11.55pm' },
  [trainTimingKey('EW13', 'Pasir Ris')]: { weekdayFirst: '6.01am', weekendFirst: '6.29am', weekdayLast: '12.10am', weekendLast: '12.10am' },
  [trainTimingKey('EW14', 'Tuas Link')]: { weekdayFirst: '6.00am', weekendFirst: '6.26am', weekdayLast: '11.58pm', weekendLast: '11.58pm' },
  [trainTimingKey('EW14', 'Pasir Ris')]: { weekdayFirst: '5.59am', weekendFirst: '6.27am', weekdayLast: '12.08am', weekendLast: '12.08am' },
  [trainTimingKey('EW16', 'Tuas Link')]: { weekdayFirst: '6.04am', weekendFirst: '6.30am', weekdayLast: '12.02am', weekendLast: '12.02am' },
  [trainTimingKey('EW16', 'Pasir Ris')]: { weekdayFirst: '5.54am', weekendFirst: '6.22am', weekdayLast: '12.03am', weekendLast: '12.03am' },
  [trainTimingKey('EW24', 'Tuas Link')]: { weekdayFirst: '5.14am', weekendFirst: '5.44am', weekdayLast: '12.25am', weekendLast: '12.25am' },
  [trainTimingKey('EW24', 'Pasir Ris')]: { weekdayFirst: '5.42am', weekendFirst: '6.12am', weekdayLast: '11.42pm', weekendLast: '11.42pm' },
  [trainTimingKey('CG1', 'Tuas Link')]: { weekdayFirst: '5.36am', weekendFirst: '6.04am', weekdayLast: '11.23pm', weekendLast: '11.23pm' },
  [trainTimingKey('CG1', 'Pasir Ris')]: { weekdayFirst: '5.36am', weekendFirst: '6.04am', weekdayLast: '12.11am', weekendLast: '12.11am' },
  [trainTimingKey('CG2', 'Tuas Link')]: { weekdayFirst: '5.31am', weekendFirst: '5.59am', weekdayLast: '11.18pm', weekendLast: '11.18pm' },
  [trainTimingKey('CG2', 'Pasir Ris')]: { weekdayFirst: '5.31am', weekendFirst: '5.59am', weekdayLast: '12.06am', weekendLast: '12.06am' },
  [trainTimingKey('CC1', 'HarbourFront')]: { weekdayFirst: '5.37am', weekendFirst: '6.05am', weekdayLast: '10.48pm', weekendLast: '10.48pm' },
  [trainTimingKey('CC9', 'Dhoby Ghaut')]: { weekdayFirst: '5.40am', weekendFirst: '6.07am', weekdayLast: '11.49pm', weekendLast: '11.49pm' },
  [trainTimingKey('CC9', 'HarbourFront')]: { weekdayFirst: '5.40am', weekendFirst: '6.07am', weekdayLast: '11.04pm', weekendLast: '11.04pm' },
  [trainTimingKey('CC10', 'Dhoby Ghaut')]: { weekdayFirst: '5.37am', weekendFirst: '6.04am', weekdayLast: '11.46pm', weekendLast: '11.46pm' },
  [trainTimingKey('CC10', 'HarbourFront')]: { weekdayFirst: '5.42am', weekendFirst: '6.09am', weekdayLast: '11.06pm', weekendLast: '11.06pm' },
  [trainTimingKey('CC13', 'Dhoby Ghaut')]: { weekdayFirst: '5.44am', weekendFirst: '6.11am', weekdayLast: '11.40pm', weekendLast: '11.40pm' },
  [trainTimingKey('CC13', 'HarbourFront')]: { weekdayFirst: '5.18am', weekendFirst: '5.42am', weekdayLast: '11.13pm', weekendLast: '11.13pm' },
  [trainTimingKey('CC15', 'Dhoby Ghaut')]: { weekdayFirst: '5.40am', weekendFirst: '6.07am', weekdayLast: '11.35pm', weekendLast: '11.35pm' },
  [trainTimingKey('CC15', 'HarbourFront')]: { weekdayFirst: '5.23am', weekendFirst: '5.47am', weekdayLast: '11.18pm', weekendLast: '11.18pm' },
  [trainTimingKey('CC17', 'Dhoby Ghaut')]: { weekdayFirst: '5.34am', weekendFirst: '6.02am', weekdayLast: '11.30pm', weekendLast: '11.30pm' },
  [trainTimingKey('CC17', 'HarbourFront')]: { weekdayFirst: '5.28am', weekendFirst: '5.52am', weekdayLast: '11.23pm', weekendLast: '11.23pm' },
  [trainTimingKey('CC19', 'Dhoby Ghaut')]: { weekdayFirst: '5.45am', weekendFirst: '6.06am', weekdayLast: '11.25pm', weekendLast: '11.25pm' },
  [trainTimingKey('CC19', 'HarbourFront')]: { weekdayFirst: '5.32am', weekendFirst: '5.57am', weekdayLast: '11.27pm', weekendLast: '11.27pm' },
  [trainTimingKey('CC29', 'Dhoby Ghaut')]: { weekdayFirst: '5.30am', weekendFirst: '5.51am', weekdayLast: '11.03pm', weekendLast: '11.03pm' },
  [trainTimingKey('CE2', 'Stadium')]: { weekdayFirst: '5.59am', weekendFirst: '6.24am', weekdayLast: '11.55pm', weekendLast: '11.55pm' },
  [trainTimingKey('TE2', 'Woodlands North')]: { weekdayFirst: '5.39am', weekendFirst: '5.59am', weekdayLast: '12.42am', weekendLast: '12.42am' },
  [trainTimingKey('TE2', 'Bayshore')]: { weekdayFirst: '5.38am', weekendFirst: '5.58am', weekdayLast: '11.33pm', weekendLast: '11.33pm' },
  [trainTimingKey('TE9', 'Woodlands North')]: { weekdayFirst: '5.52am', weekendFirst: '6.12am', weekdayLast: '12.23am', weekendLast: '12.23am' },
  [trainTimingKey('TE9', 'Bayshore')]: { weekdayFirst: '5.48am', weekendFirst: '6.08am', weekdayLast: '11.58pm', weekendLast: '11.58pm' },
  [trainTimingKey('TE11', 'Woodlands North')]: { weekdayFirst: '5.59am', weekendFirst: '6.19am', weekdayLast: '12.19am', weekendLast: '12.19am' },
  [trainTimingKey('TE11', 'Bayshore')]: { weekdayFirst: '5.51am', weekendFirst: '6.11am', weekdayLast: '11.56pm', weekendLast: '11.56pm' },
  [trainTimingKey('TE14', 'Woodlands North')]: { weekdayFirst: '5.52am', weekendFirst: '6.12am', weekdayLast: '12.13am', weekendLast: '12.13am' },
  [trainTimingKey('TE14', 'Bayshore')]: { weekdayFirst: '5.55am', weekendFirst: '6.15am', weekdayLast: '12.03am', weekendLast: '12.03am' },
  [trainTimingKey('TE17', 'Woodlands North')]: { weekdayFirst: '6.07am', weekendFirst: '6.27am', weekdayLast: '12.07am', weekendLast: '12.07am' },
  [trainTimingKey('TE17', 'Bayshore')]: { weekdayFirst: '5.56am', weekendFirst: '6.16am', weekdayLast: '12.09am', weekendLast: '12.09am' },
  [trainTimingKey('TE20', 'Woodlands North')]: { weekdayFirst: '6.02am', weekendFirst: '6.22am', weekdayLast: '12.02am', weekendLast: '12.02am' },
  [trainTimingKey('TE20', 'Bayshore')]: { weekdayFirst: '6.01am', weekendFirst: '6.21am', weekdayLast: '12.14am', weekendLast: '12.14am' },
  [trainTimingKey('BP6', 'Platform 1')]: { weekdayFirst: '5.05am', weekendFirst: '5.24am', weekdayLast: '11.30pm', weekendLast: '11.30pm' },
  [trainTimingKey('BP6', 'Platform 2')]: { weekdayFirst: '4.59am', weekendFirst: '5.18am', weekdayLast: '11.37pm', weekendLast: '11.37pm' },
  [trainTimingKey('STC', 'East Loop')]: { weekdayFirst: '5.25am', weekendFirst: '5.45am', weekdayLast: '12.35am', weekendLast: '12.35am' },
  [trainTimingKey('STC', 'West Loop')]: { weekdayFirst: '5.18am', weekendFirst: '5.38am', weekdayLast: '12.37am', weekendLast: '12.37am' },
  [trainTimingKey('PTC', 'East Loop')]: { weekdayFirst: '5.20am', weekendFirst: '5.40am', weekdayLast: '12.38am', weekendLast: '12.38am' },
  [trainTimingKey('PTC', 'West Loop')]: { weekdayFirst: '5.18am', weekendFirst: '5.38am', weekdayLast: '12.40am', weekendLast: '12.40am' },
  [trainTimingKey('DT1', 'Expo')]: {
    weekdayFirst: '5.30am',
    weekendFirst: '5.50am',
    weekdayLast: '11.35pm',
    weekendLast: '11.35pm',
  },
  [trainTimingKey('DT6', 'Expo')]: {
    weekdayFirst: '5.39am',
    weekendFirst: '5.59am',
    weekdayLast: '11.44pm',
    weekendLast: '11.44pm',
  },
  [trainTimingKey('DT7', 'Expo')]: {
    weekdayFirst: '5.42am',
    weekendFirst: '6.02am',
    weekdayLast: '11.46pm',
    weekendLast: '11.46pm',
  },
  [trainTimingKey('DT8', 'Expo')]: {
    weekdayFirst: '5.44am',
    weekendFirst: '6.04am',
    weekdayLast: '11.48pm',
    weekendLast: '11.48pm',
  },
  [trainTimingKey('DT9', 'Expo')]: {
    weekdayFirst: '5.46am',
    weekendFirst: '6.06am',
    weekdayLast: '11.50pm',
    weekendLast: '11.50pm',
  },
  [trainTimingKey('DT10', 'Expo')]: {
    weekdayFirst: '5.48am',
    weekendFirst: '6.08am',
    weekdayLast: '11.53pm',
    weekendLast: '11.53pm',
  },
  [trainTimingKey('DT11', 'Expo')]: {
    weekdayFirst: '5.51am',
    weekendFirst: '6.11am',
    weekdayLast: '11.55pm',
    weekendLast: '11.55pm',
  },
  [trainTimingKey('DT12', 'Expo')]: {
    weekdayFirst: '5.53am',
    weekendFirst: '6.13am',
    weekdayLast: '11.58pm',
    weekendLast: '11.58pm',
  },
  [trainTimingKey('DT14', 'Expo')]: {
    weekdayFirst: '5.57am',
    weekendFirst: '6.17am',
    weekdayLast: '12.01am',
    weekendLast: '12.01am',
  },
  [trainTimingKey('DT19', 'Expo')]: {
    weekdayFirst: '6.08am',
    weekendFirst: '6.28am',
    weekdayLast: '12.10am',
    weekendLast: '12.10am',
  },
  [trainTimingKey('DT20', 'Expo')]: {
    weekdayFirst: '6.10am',
    weekendFirst: '6.30am',
    weekdayLast: '12.12am',
    weekendLast: '12.12am',
  },
  [trainTimingKey('DT21', 'Expo')]: {
    weekdayFirst: '6.12am',
    weekendFirst: '6.31am',
    weekdayLast: '12.13am',
    weekendLast: '12.13am',
  },
  [trainTimingKey('DT24', 'Expo')]: {
    weekdayFirst: '5.59am',
    weekendFirst: '6.19am',
    weekdayLast: '12.19am',
    weekendLast: '12.19am',
  },
  [trainTimingKey('DT26', 'Expo')]: {
    weekdayFirst: '6.03am',
    weekendFirst: '6.23am',
    weekdayLast: '12.24am',
    weekendLast: '12.24am',
  },
  [trainTimingKey('DT27', 'Expo')]: {
    weekdayFirst: '6.05am',
    weekendFirst: '6.25am',
    weekdayLast: '12.25am',
    weekendLast: '12.25am',
  },
  [trainTimingKey('DT28', 'Expo')]: {
    weekdayFirst: '6.07am',
    weekendFirst: '6.27am',
    weekdayLast: '12.27am',
    weekendLast: '12.27am',
  },
  [trainTimingKey('DT29', 'Expo')]: {
    weekdayFirst: '6.09am',
    weekendFirst: '6.29am',
    weekdayLast: '12.29am',
    weekendLast: '12.29am',
  },
  [trainTimingKey('DT30', 'Expo')]: {
    weekdayFirst: '6.11am',
    weekendFirst: '6.31am',
    weekdayLast: '12.31am',
    weekendLast: '12.31am',
  },
  [trainTimingKey('DT31', 'Expo')]: {
    weekdayFirst: '6.13am',
    weekendFirst: '6.33am',
    weekdayLast: '12.34am',
    weekendLast: '12.34am',
  },
  [trainTimingKey('DT32', 'Expo')]: {
    weekdayFirst: '6.16am',
    weekendFirst: '6.36am',
    weekdayLast: '12.36am',
    weekendLast: '12.36am',
  },
  [trainTimingKey('DT33', 'Expo')]: {
    weekdayFirst: '6.18am',
    weekendFirst: '6.38am',
    weekdayLast: '12.38am',
    weekendLast: '12.38am',
  },
  [trainTimingKey('DT35', 'Bukit Panjang')]: {
    weekdayFirst: '5.36am',
    weekendFirst: '5.54am',
    weekdayLast: '11.40pm',
    weekendLast: '11.40pm',
  },
  [trainTimingKey('DT33', 'Bukit Panjang')]: {
    weekdayFirst: '5.41am',
    weekendFirst: '5.59am',
    weekdayLast: '11.45pm',
    weekendLast: '11.45pm',
  },
  [trainTimingKey('DT32', 'Bukit Panjang')]: {
    weekdayFirst: '5.43am',
    weekendFirst: '6.01am',
    weekdayLast: '11.47pm',
    weekendLast: '11.47pm',
  },
  [trainTimingKey('DT31', 'Bukit Panjang')]: {
    weekdayFirst: '5.45am',
    weekendFirst: '6.03am',
    weekdayLast: '11.49pm',
    weekendLast: '11.49pm',
  },
  [trainTimingKey('DT30', 'Bukit Panjang')]: {
    weekdayFirst: '5.48am',
    weekendFirst: '6.06am',
    weekdayLast: '11.51pm',
    weekendLast: '11.51pm',
  },
  [trainTimingKey('DT29', 'Bukit Panjang')]: {
    weekdayFirst: '5.50am',
    weekendFirst: '6.08am',
    weekdayLast: '11.54pm',
    weekendLast: '11.54pm',
  },
  [trainTimingKey('DT28', 'Bukit Panjang')]: {
    weekdayFirst: '5.52am',
    weekendFirst: '6.10am',
    weekdayLast: '11.56pm',
    weekendLast: '11.56pm',
  },
  [trainTimingKey('DT27', 'Bukit Panjang')]: {
    weekdayFirst: '5.54am',
    weekendFirst: '6.12am',
    weekdayLast: '11.58pm',
    weekendLast: '11.58pm',
  },
  [trainTimingKey('DT26', 'Bukit Panjang')]: {
    weekdayFirst: '5.56am',
    weekendFirst: '6.14am',
    weekdayLast: '12.00am',
    weekendLast: '12.00am',
  },
  [trainTimingKey('DT24', 'Bukit Panjang')]: {
    weekdayFirst: '6.00am',
    weekendFirst: '6.18am',
    weekdayLast: '12.04am',
    weekendLast: '12.04am',
  },
  [trainTimingKey('DT21', 'Bukit Panjang')]: {
    weekdayFirst: '6.06am',
    weekendFirst: '6.24am',
    weekdayLast: '12.10am',
    weekendLast: '12.10am',
  },
  [trainTimingKey('DT20', 'Bukit Panjang')]: {
    weekdayFirst: '6.08am',
    weekendFirst: '6.26am',
    weekdayLast: '12.11am',
    weekendLast: '12.11am',
  },
  [trainTimingKey('DT19', 'Bukit Panjang')]: {
    weekdayFirst: '6.10am',
    weekendFirst: '6.28am',
    weekdayLast: '12.14am',
    weekendLast: '12.14am',
  },
  [trainTimingKey('DT14', 'Bukit Panjang')]: {
    weekdayFirst: '6.03am',
    weekendFirst: '6.32am',
    weekdayLast: '12.22am',
    weekendLast: '12.22am',
  },
  [trainTimingKey('DT12', 'Bukit Panjang')]: {
    weekdayFirst: '6.06am',
    weekendFirst: '6.30am',
    weekdayLast: '12.26am',
    weekendLast: '12.26am',
  },
  [trainTimingKey('DT11', 'Bukit Panjang')]: {
    weekdayFirst: '5.56am',
    weekendFirst: '6.16am',
    weekdayLast: '12.28am',
    weekendLast: '12.28am',
  },
  [trainTimingKey('DT10', 'Bukit Panjang')]: {
    weekdayFirst: '5.58am',
    weekendFirst: '6.18am',
    weekdayLast: '12.30am',
    weekendLast: '12.30am',
  },
  [trainTimingKey('DT9', 'Bukit Panjang')]: {
    weekdayFirst: '6.00am',
    weekendFirst: '6.21am',
    weekdayLast: '12.32am',
    weekendLast: '12.32am',
  },
  [trainTimingKey('DT8', 'Bukit Panjang')]: {
    weekdayFirst: '6.02am',
    weekendFirst: '6.23am',
    weekdayLast: '12.34am',
    weekendLast: '12.34am',
  },
  [trainTimingKey('DT7', 'Bukit Panjang')]: {
    weekdayFirst: '6.04am',
    weekendFirst: '6.24am',
    weekdayLast: '12.36am',
    weekendLast: '12.36am',
  },
  [trainTimingKey('DT6', 'Bukit Panjang')]: {
    weekdayFirst: '6.06am',
    weekendFirst: '6.27am',
    weekdayLast: '12.38am',
    weekendLast: '12.38am',
  },
  [trainTimingKey('NE17', 'HarbourFront')]: {
    weekdayFirst: '5.42am',
    weekendFirst: '6.02am',
    weekdayLast: '11.28pm',
    weekendLast: '11.28pm',
  },
  [trainTimingKey('NE16', 'HarbourFront')]: {
    weekdayFirst: '5.44am',
    weekendFirst: '6.04am',
    weekdayLast: '11.30pm',
    weekendLast: '11.30pm',
  },
  [trainTimingKey('NE12', 'HarbourFront')]: {
    weekdayFirst: '5.54am',
    weekendFirst: '6.14am',
    weekdayLast: '11.40pm',
    weekendLast: '11.40pm',
  },
  [trainTimingKey('NE7', 'HarbourFront')]: {
    weekdayFirst: '6.04am',
    weekendFirst: '6.24am',
    weekdayLast: '11.50pm',
    weekendLast: '11.50pm',
  },
  [trainTimingKey('NE6', 'HarbourFront')]: {
    weekdayFirst: '6.06am',
    weekendFirst: '6.26am',
    weekdayLast: '11.52pm',
    weekendLast: '11.52pm',
  },
  [trainTimingKey('NE4', 'HarbourFront')]: {
    weekdayFirst: '6.10am',
    weekendFirst: '6.30am',
    weekdayLast: '11.56pm',
    weekendLast: '11.56pm',
  },
  [trainTimingKey('NE3', 'HarbourFront')]: {
    weekdayFirst: '6.12am',
    weekendFirst: '6.32am',
    weekdayLast: '11.58pm',
    weekendLast: '11.58pm',
  },
  [trainTimingKey('NE1', 'Punggol Coast')]: {
    weekdayFirst: '5.47am',
    weekendFirst: '6.07am',
    weekdayLast: '11.55pm',
    weekendLast: '11.55pm',
  },
  [trainTimingKey('NE3', 'Punggol Coast')]: {
    weekdayFirst: '5.48am',
    weekendFirst: '6.08am',
    weekdayLast: '11.59pm',
    weekendLast: '11.59pm',
  },
  [trainTimingKey('NE4', 'Punggol Coast')]: {
    weekdayFirst: '5.49am',
    weekendFirst: '6.09am',
    weekdayLast: '12.01am',
    weekendLast: '12.01am',
  },
  [trainTimingKey('NE6', 'Punggol Coast')]: {
    weekdayFirst: '5.53am',
    weekendFirst: '6.13am',
    weekdayLast: '12.05am',
    weekendLast: '12.05am',
  },
  [trainTimingKey('NE7', 'Punggol Coast')]: {
    weekdayFirst: '5.56am',
    weekendFirst: '6.16am',
    weekdayLast: '12.07am',
    weekendLast: '12.07am',
  },
  [trainTimingKey('NE12', 'Punggol Coast')]: {
    weekdayFirst: '6.06am',
    weekendFirst: '6.26am',
    weekdayLast: '12.17am',
    weekendLast: '12.17am',
  },
  [trainTimingKey('NE16', 'Punggol Coast')]: {
    weekdayFirst: '5.33am',
    weekendFirst: '5.53am',
    weekdayLast: '12.27am',
    weekendLast: '12.27am',
  },
  [trainTimingKey('NE17', 'Punggol Coast')]: {
    weekdayFirst: '5.36am',
    weekendFirst: '5.56am',
    weekdayLast: '12.30am',
    weekendLast: '12.30am',
  },
  [trainTimingKey('DT15', 'Bukit Panjang')]: {
    weekdayFirst: '6.17am',
    weekendFirst: '6.35am',
    weekdayLast: '12.20am',
    weekendLast: '12.20am',
  },
  [trainTimingKey('DT15', 'Expo')]: {
    weekdayFirst: '6.00am',
    weekendFirst: '6.20am',
    weekdayLast: '12.03am',
    weekendLast: '12.03am',
  },
  [trainTimingKey('DT16', 'Bukit Panjang')]: {
    weekdayFirst: '6.15am',
    weekendFirst: '6.33am',
    weekdayLast: '12.18am',
    weekendLast: '12.18am',
  },
  [trainTimingKey('DT16', 'Expo')]: {
    weekdayFirst: '6.02am',
    weekendFirst: '6.22am',
    weekdayLast: '12.05am',
    weekendLast: '12.05am',
  },
};

export const getTrainTiming = (
  station: TrainStation,
  direction: TrainDirection
): TrainTiming => {
  const stationCode = station.codes.find((code) => getCodeLine(code) === direction.line);
  if (!stationCode) return unavailableTrainTiming;

  return trainTimings[trainTimingKey(stationCode, direction.destination)] || unavailableTrainTiming;
};

export const getStationDirections = (station: TrainStation): TrainDirection[] =>
  station.lines.flatMap((line): TrainDirection[] => {
    if (line === 'DTL') {
      const directions = [
        { line, destination: 'Bukit Panjang' },
        { line, destination: 'Expo' },
      ];

      return directions.filter((direction) => !station.codes.includes(direction.destination === 'Bukit Panjang' ? 'DT1' : 'DT35'));
    }
    if (line === 'NSL') {
      const directions = [
        { line, destination: 'Jurong East' },
        { line, destination: 'Marina South Pier' },
      ];

      return directions.filter((direction) => !station.codes.includes(direction.destination === 'Jurong East' ? 'NS1' : 'NS28'));
    }
    if (line === 'EWL') {
      const directions = [
        { line, destination: 'Tuas Link' },
        { line, destination: 'Pasir Ris' },
      ];

      return directions.filter((direction) => !station.codes.includes(direction.destination === 'Tuas Link' ? 'EW33' : 'EW1'));
    }
    if (line === 'NEL') {
      const directions = [
        { line, destination: 'HarbourFront' },
        { line, destination: 'Punggol Coast' },
      ];

      return directions.filter((direction) => !station.codes.includes(direction.destination === 'HarbourFront' ? 'NE1' : 'NE18'));
    }
    if (line === 'CCL') {
      if (station.codes.some((code) => code.startsWith('CE'))) {
        return [{ line, destination: 'Stadium' }];
      }

      const directions = [
        { line, destination: 'Dhoby Ghaut' },
        { line, destination: 'HarbourFront' },
      ];

      return directions.filter((direction) => !station.codes.includes(direction.destination === 'Dhoby Ghaut' ? 'CC1' : 'CC29'));
    }
    if (line === 'TEL') {
      const directions = [
        { line, destination: 'Woodlands North' },
        { line, destination: 'Bayshore' },
      ];

      return directions.filter((direction) => !station.codes.includes(direction.destination === 'Woodlands North' ? 'TE1' : 'TE29'));
    }
    if (line === 'BPLRT') {
      return [
        { line, destination: 'Platform 1' },
        { line, destination: 'Platform 2' },
      ];
    }
    if (line === 'SKLRT') {
      if (station.codes.some((code) => code.startsWith('SE'))) {
        return [{ line, destination: 'East Loop' }];
      }
      if (station.codes.some((code) => code.startsWith('SW'))) {
        return [{ line, destination: 'West Loop' }];
      }

      return [
        { line, destination: 'East Loop' },
        { line, destination: 'West Loop' },
      ];
    }
    if (line === 'PGLRT') {
      if (station.codes.some((code) => code.startsWith('PE'))) {
        return [{ line, destination: 'East Loop' }];
      }
      if (station.codes.some((code) => code.startsWith('PW'))) {
        return [{ line, destination: 'West Loop' }];
      }

      return [
        { line, destination: 'East Loop' },
        { line, destination: 'West Loop' },
      ];
    }

    return [
      { line, destination: 'Loop A' },
      { line, destination: 'Loop B' },
    ];
  });
