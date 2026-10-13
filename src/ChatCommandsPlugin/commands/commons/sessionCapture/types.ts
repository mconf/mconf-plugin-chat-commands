import { CONSOLE_METHODS } from './constants';

export type ConsoleMethod = typeof CONSOLE_METHODS[number];

export type ConsoleLevel = ConsoleMethod | 'uncaught' | 'unhandledrejection' | 'resource' | 'csp';

export interface ConsoleEntry {
  time: number;
  level: ConsoleLevel;
  text: string;
}

export type TimelineEventKind =
  | 'page-load'
  | 'click'
  | 'change'
  | 'key'
  | 'navigation'
  | 'visibility'
  | 'network'
  | 'storage'
  | 'state';

export interface ElementDescriptor {
  tag: string;
  id?: string;
  dataTest?: string;
  ariaLabel?: string;
  role?: string;
  title?: string;
  text?: string;
  within?: string;
}

export interface TimelineEvent {
  time: number;
  kind: TimelineEventKind;
  summary: string;
  target?: ElementDescriptor;
  data?: unknown;
}

export interface BufferContents<T> {
  entries: T[];
  droppedCount: number;
}

export interface PersistedCapture {
  version: number;
  captureStartedAt: number;
  pageLoads: number;
  console: BufferContents<ConsoleEntry>;
  timeline: BufferContents<TimelineEvent>;
}

export interface CaptureSnapshot {
  captureStartedAt: number;
  pageLoads: number;
  console: BufferContents<ConsoleEntry>;
  timeline: BufferContents<TimelineEvent>;
}

export interface SessionCapture {
  recordConsole: (entry: ConsoleEntry) => void;
  recordEvent: (event: Omit<TimelineEvent, 'time'>) => void;
  snapshot: () => CaptureSnapshot;
}
