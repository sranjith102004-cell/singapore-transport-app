export type BusStop = {
  busStopCode: string;
  roadName: string;
  description: string;
  latitude: number;
  longitude: number;
  distance: number;
};

export type TrainColors = {
  bg: string;
  card: string;
  input: string;
  border: string;
  text: string;
  subText: string;
  muted: string;
};

export type RecentTrainTrip = {
  fromId: string;
  toId: string;
};
