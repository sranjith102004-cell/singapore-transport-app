import { getCodeLine, type TrainLine, type TrainStation } from './train';
import { stations } from './trainStations';

type GraphEdge = {
  to: string;
  line: TrainLine;
  minutes: number;
};

type SearchState = {
  stationId: string;
  line: TrainLine | null;
};

export type TrainRouteSegment = {
  line: TrainLine;
  from: TrainStation;
  to: TrainStation;
  stops: number;
};

export type TrainTripPlan = {
  from: TrainStation;
  to: TrainStation;
  minutes: number;
  stops: number;
  transfers: number;
  distanceKm: number;
  adultFareCents: number;
  fares: {
    adult: number;
    seniorPwd: number;
    student: number;
    wtcs: number;
  };
  path: TrainStation[];
  segments: TrainRouteSegment[];
};

const TRANSFER_MINUTES = 5;
const MRT_STOP_MINUTES = 2;
const LRT_STOP_MINUTES = 2;

const fareBands = [
  { maxKm: 3.2, adult: 128, seniorPwd: 69, student: 52, wtcs: 78 },
  { maxKm: 4.2, adult: 138, seniorPwd: 79, student: 60, wtcs: 89 },
  { maxKm: 5.2, adult: 149, seniorPwd: 87, student: 66, wtcs: 98 },
  { maxKm: 6.2, adult: 159, seniorPwd: 94, student: 71, wtcs: 106 },
  { maxKm: 7.2, adult: 168, seniorPwd: 100, student: 74, wtcs: 113 },
  { maxKm: 8.2, adult: 175, seniorPwd: 107, student: 78, wtcs: 120 },
  { maxKm: 9.2, adult: 182, seniorPwd: 107, student: 78, wtcs: 126 },
  { maxKm: 10.2, adult: 186, seniorPwd: 107, student: 78, wtcs: 129 },
  { maxKm: 11.2, adult: 190, seniorPwd: 107, student: 78, wtcs: 132 },
  { maxKm: 12.2, adult: 194, seniorPwd: 107, student: 78, wtcs: 135 },
  { maxKm: 13.2, adult: 198, seniorPwd: 107, student: 78, wtcs: 138 },
  { maxKm: 14.2, adult: 202, seniorPwd: 107, student: 78, wtcs: 141 },
  { maxKm: 15.2, adult: 207, seniorPwd: 107, student: 78, wtcs: 144 },
  { maxKm: 16.2, adult: 211, seniorPwd: 107, student: 78, wtcs: 147 },
  { maxKm: 17.2, adult: 215, seniorPwd: 107, student: 78, wtcs: 150 },
  { maxKm: 18.2, adult: 220, seniorPwd: 107, student: 78, wtcs: 153 },
  { maxKm: 19.2, adult: 224, seniorPwd: 107, student: 78, wtcs: 156 },
  { maxKm: 20.2, adult: 227, seniorPwd: 107, student: 78, wtcs: 159 },
  { maxKm: 21.2, adult: 230, seniorPwd: 107, student: 78, wtcs: 162 },
  { maxKm: 22.2, adult: 233, seniorPwd: 107, student: 78, wtcs: 165 },
  { maxKm: 23.2, adult: 236, seniorPwd: 107, student: 78, wtcs: 168 },
  { maxKm: 24.2, adult: 238, seniorPwd: 107, student: 78, wtcs: 170 },
  { maxKm: 25.2, adult: 240, seniorPwd: 107, student: 78, wtcs: 171 },
  { maxKm: 26.2, adult: 242, seniorPwd: 107, student: 78, wtcs: 172 },
  { maxKm: 27.2, adult: 243, seniorPwd: 107, student: 78, wtcs: 173 },
  { maxKm: 28.2, adult: 244, seniorPwd: 107, student: 78, wtcs: 174 },
  { maxKm: 29.2, adult: 245, seniorPwd: 107, student: 78, wtcs: 175 },
  { maxKm: 30.2, adult: 246, seniorPwd: 107, student: 78, wtcs: 176 },
  { maxKm: 31.2, adult: 247, seniorPwd: 107, student: 78, wtcs: 177 },
  { maxKm: 32.2, adult: 248, seniorPwd: 107, student: 78, wtcs: 178 },
  { maxKm: 33.2, adult: 249, seniorPwd: 107, student: 78, wtcs: 179 },
  { maxKm: 34.2, adult: 250, seniorPwd: 107, student: 78, wtcs: 180 },
  { maxKm: 35.2, adult: 251, seniorPwd: 107, student: 78, wtcs: 181 },
  { maxKm: 36.2, adult: 252, seniorPwd: 107, student: 78, wtcs: 182 },
  { maxKm: 37.2, adult: 253, seniorPwd: 107, student: 78, wtcs: 183 },
  { maxKm: 38.2, adult: 254, seniorPwd: 107, student: 78, wtcs: 184 },
  { maxKm: 39.2, adult: 255, seniorPwd: 107, student: 78, wtcs: 185 },
  { maxKm: 40.2, adult: 256, seniorPwd: 107, student: 78, wtcs: 186 },
  { maxKm: Infinity, adult: 257, seniorPwd: 107, student: 78, wtcs: 187 },
];

const getStationById = (stationId: string) =>
  stations.find((station) => station.id === stationId);

const getDistanceKm = (from: TrainStation, to: TrainStation) => {
  const earthRadius = 6371;
  const p1 = (from.latitude * Math.PI) / 180;
  const p2 = (to.latitude * Math.PI) / 180;
  const dp = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dl = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getPathDistanceKm = (path: TrainStation[]) =>
  path.reduce((totalDistance, station, index) => {
    const nextStation = path[index + 1];
    if (!nextStation) return totalDistance;

    return totalDistance + getDistanceKm(station, nextStation);
  }, 0);

const getFareBand = (distanceKm: number) =>
  fareBands.find((band) => distanceKm <= band.maxKm) || fareBands[fareBands.length - 1];

const getFareEstimates = (distanceKm: number) => {
  const fareBand = getFareBand(distanceKm);

  return {
    adult: fareBand.adult,
    seniorPwd: fareBand.seniorPwd,
    student: fareBand.student,
    wtcs: fareBand.wtcs,
  };
};

export const formatFare = (fareCents: number) => `$${(fareCents / 100).toFixed(2)}`;

const getCodePrefix = (code: string) => code.match(/^[A-Z]+/)?.[0] || code;

const getCodeNumber = (code: string) => Number(code.match(/\d+/)?.[0] || 0);

const addGraphEdge = (
  graph: Map<string, GraphEdge[]>,
  from: string,
  to: string,
  line: TrainLine,
  minutes: number
) => {
  graph.set(from, [...(graph.get(from) || []), { to, line, minutes }]);
  graph.set(to, [...(graph.get(to) || []), { to: from, line, minutes }]);
};

const buildTrainGraph = () => {
  const graph = new Map<string, GraphEdge[]>();
  const codeToStation = new Map<string, TrainStation>();

  stations.forEach((station) => {
    graph.set(station.id, []);
    station.codes.forEach((code) => {
      codeToStation.set(code, station);
    });
  });

  const codesByPrefix = Array.from(codeToStation.keys()).reduce<Record<string, string[]>>(
    (result, code) => {
      const prefix = getCodePrefix(code);
      result[prefix] = [...(result[prefix] || []), code];
      return result;
    },
    {}
  );

  Object.values(codesByPrefix).forEach((codes) => {
    const sortedCodes = [...codes].sort((a, b) => getCodeNumber(a) - getCodeNumber(b));

    sortedCodes.forEach((code, index) => {
      const nextCode = sortedCodes[index + 1];
      if (!nextCode) return;

      const station = codeToStation.get(code);
      const nextStation = codeToStation.get(nextCode);
      if (!station || !nextStation || station.id === nextStation.id) return;

      const line = getCodeLine(code);
      const minutes = line.includes('LRT') ? LRT_STOP_MINUTES : MRT_STOP_MINUTES;
      addGraphEdge(graph, station.id, nextStation.id, line, minutes);
    });
  });

  [
    ['EW4', 'CG1'],
    ['CC4', 'CE1'],
    ['STC', 'SE1'],
    ['STC', 'SE5'],
    ['STC', 'SW1'],
    ['STC', 'SW8'],
    ['PTC', 'PE1'],
    ['PTC', 'PE7'],
    ['PTC', 'PW1'],
    ['BP6', 'BP13'],
  ].forEach(([fromCode, toCode]) => {
    const from = codeToStation.get(fromCode);
    const to = codeToStation.get(toCode);
    if (!from || !to) return;

    addGraphEdge(graph, from.id, to.id, getCodeLine(toCode), LRT_STOP_MINUTES);
  });

  return graph;
};

const trainGraph = buildTrainGraph();

const getStateKey = (state: SearchState) => `${state.stationId}:${state.line || 'START'}`;

const parseStateKey = (key: string): SearchState => {
  const [stationId, line] = key.split(':');
  return {
    stationId,
    line: line === 'START' ? null : (line as TrainLine),
  };
};

export const planTrainTrip = (fromId: string, toId: string): TrainTripPlan | null => {
  const from = getStationById(fromId);
  const to = getStationById(toId);
  if (!from || !to) return null;

  if (from.id === to.id) {
    return {
      from,
      to,
      minutes: 0,
      stops: 0,
      transfers: 0,
      distanceKm: 0,
      adultFareCents: getFareEstimates(0).adult,
      fares: getFareEstimates(0),
      path: [from],
      segments: [],
    };
  }

  const startKey = getStateKey({ stationId: from.id, line: null });
  const distances = new Map<string, number>([[startKey, 0]]);
  const previous = new Map<string, { key: string; edge: GraphEdge }>();
  const queue = [startKey];
  const visited = new Set<string>();

  while (queue.length > 0) {
    queue.sort((a, b) => (distances.get(a) || Infinity) - (distances.get(b) || Infinity));
    const currentKey = queue.shift();
    if (!currentKey || visited.has(currentKey)) continue;

    visited.add(currentKey);
    const current = parseStateKey(currentKey);
    const currentDistance = distances.get(currentKey) || 0;

    (trainGraph.get(current.stationId) || []).forEach((edge) => {
      const transferMinutes =
        current.line && current.line !== edge.line ? TRANSFER_MINUTES : 0;
      const nextState = { stationId: edge.to, line: edge.line };
      const nextKey = getStateKey(nextState);
      const nextDistance = currentDistance + edge.minutes + transferMinutes;

      if (nextDistance >= (distances.get(nextKey) || Infinity)) return;

      distances.set(nextKey, nextDistance);
      previous.set(nextKey, { key: currentKey, edge });
      queue.push(nextKey);
    });
  }

  const endKey = Array.from(distances.keys())
    .filter((key) => parseStateKey(key).stationId === to.id)
    .sort((a, b) => (distances.get(a) || Infinity) - (distances.get(b) || Infinity))[0];

  if (!endKey) return null;

  const pathIds: string[] = [to.id];
  const edgeLines: TrainLine[] = [];
  let cursor = endKey;

  while (cursor !== startKey) {
    const step = previous.get(cursor);
    if (!step) return null;

    pathIds.unshift(parseStateKey(step.key).stationId);
    edgeLines.unshift(step.edge.line);
    cursor = step.key;
  }

  const path = pathIds
    .map((stationId) => getStationById(stationId))
    .filter((station): station is TrainStation => station !== undefined);

  const segments = edgeLines.reduce<TrainRouteSegment[]>((result, line, index) => {
    const currentStation = path[index];
    const nextStation = path[index + 1];
    const lastSegment = result[result.length - 1];

    if (lastSegment && lastSegment.line === line) {
      lastSegment.to = nextStation;
      lastSegment.stops += 1;
      return result;
    }

    return [
      ...result,
      {
        line,
        from: currentStation,
        to: nextStation,
        stops: 1,
      },
    ];
  }, []);

  const distanceKm = getPathDistanceKm(path);
  const fares = getFareEstimates(distanceKm);

  return {
    from,
    to,
    minutes: distances.get(endKey) || 0,
    stops: Math.max(0, path.length - 1),
    transfers: Math.max(0, segments.length - 1),
    distanceKm,
    adultFareCents: fares.adult,
    fares,
    path,
    segments,
  };
};
