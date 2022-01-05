import { Temporal } from '@js-temporal/polyfill';

export interface Task {
  id: number | string
  name: string
  owner: string
  start: string
  stop: string,
  duration?: number
  dependency?: number | string
  isOngoing: boolean
}

export interface Owner {
  avatar: string | null
  name: string
}

export type Team = Record<string, Owner>

export interface Data {
  tasks: Task[]
  team: Team
}

export type Metadata = {
  dependenciesMap: Map<any, any>;
  intervalRange: Temporal.Instant[];
  maxRowIndex: number;
  ownerToImageMap: Map<any, any>;
  startDate: Temporal.Instant;
  stopDate: Temporal.Instant;
  taskToRowIndexMap: Map<any, any>;
  taskToTemporalMap: Map<any, any>;
  tasks: Task[];
  team: Team;
  textDOMRects: Map<any, any>;
  unit: string;
};

export interface CodeData<T> {
  value: T,
  string: string,
  update: (val: string) => void
}