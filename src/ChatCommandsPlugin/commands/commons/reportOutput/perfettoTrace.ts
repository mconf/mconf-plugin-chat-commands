import { CaptureSnapshot, TimelineEvent } from '../sessionCapture';
import {
  ERROR_LEVELS,
  MAX_TRACE_ARG_LENGTH,
  MAX_TRACE_NAME_LENGTH,
  TRACE_PROCESS_ID,
  TRACE_TRACKS,
  WARNING_LEVELS,
} from './constants';
import { describeMainArea, pageLoadLabel, toReportSteps } from './steps';
import { TraceEvent } from './types';

type Track = typeof TRACE_TRACKS[keyof typeof TRACE_TRACKS];

const MICROSECONDS_PER_MS = 1000;

const toMicroseconds = (time: number): number => time * MICROSECONDS_PER_MS;

const shorten = (text: string, length: number): string => (
  text.length > length ? `${text.slice(0, length)}…` : text
);

const instant = (
  track: Track,
  time: number,
  name: string,
  args?: Record<string, unknown>,
): TraceEvent => ({
  name: shorten(name, MAX_TRACE_NAME_LENGTH),
  ph: 'i',
  s: 't',
  pid: TRACE_PROCESS_ID,
  tid: track.tid,
  ts: toMicroseconds(time),
  args,
});

const slice = (track: Track, start: number, end: number, name: string): TraceEvent => ({
  name,
  ph: 'X',
  pid: TRACE_PROCESS_ID,
  tid: track.tid,
  ts: toMicroseconds(start),
  dur: toMicroseconds(Math.max(end - start, 1)),
});

// Global instants draw a line across every track in Perfetto.
const marker = (time: number, name: string): TraceEvent => ({
  name,
  ph: 'i',
  s: 'g',
  pid: TRACE_PROCESS_ID,
  ts: toMicroseconds(time),
});

const metadata = (): TraceEvent[] => [
  {
    name: 'process_name', ph: 'M', pid: TRACE_PROCESS_ID, args: { name: 'BigBlueButton client' },
  },
  ...Object.values(TRACE_TRACKS).reduce<TraceEvent[]>((events, track) => events.concat([
    {
      name: 'thread_name', ph: 'M', pid: TRACE_PROCESS_ID, tid: track.tid, args: { name: track.name },
    },
    {
      name: 'thread_sort_index', ph: 'M', pid: TRACE_PROCESS_ID, tid: track.tid, args: { sort_index: track.tid },
    },
  ]), []),
];

const mainAreaSlices = (events: TimelineEvent[], endTime: number): TraceEvent[] => {
  const changes = events.filter((event) => (event.data as { name?: string } | undefined)?.name === 'presentationArea');
  return changes.map((event, index) => {
    const end = changes[index + 1]?.time ?? endTime;
    const content = describeMainArea((event.data as { to?: unknown }).to);
    return slice(TRACE_TRACKS.mainArea, event.time, end, content);
  });
};

// Pairs "start" and "end" summaries into spans, e.g. tab hidden → tab visible.
const periodSlices = (
  events: TimelineEvent[],
  startSummary: string,
  endSummary: string,
  name: string,
  endTime: number,
): TraceEvent[] => {
  const slices: TraceEvent[] = [];
  let openedAt: number | null = null;
  events.forEach((event) => {
    if (event.summary === startSummary && openedAt === null) openedAt = event.time;
    if (event.summary === endSummary && openedAt !== null) {
      slices.push(slice(TRACE_TRACKS.tab, openedAt, event.time, name));
      openedAt = null;
    }
  });
  if (openedAt !== null) slices.push(slice(TRACE_TRACKS.tab, openedAt, endTime, name));
  return slices;
};

/**
 * Chrome Trace Event Format, which ui.perfetto.dev and chrome://tracing open
 * locally: user steps, console output and state on parallel tracks, so what
 * happened right before an error is visible at a glance.
 */
export const buildPerfettoTrace = (capture: CaptureSnapshot, generatedAt: number): string => {
  const timeline = capture.timeline.entries;

  const steps = toReportSteps(timeline).map((step) => instant(
    TRACE_TRACKS.steps,
    step.time,
    step.element ? `${step.action}: ${step.element}` : step.action,
    { element: step.element, dataTest: step.dataTest },
  ));

  const consoleEvents = capture.console.entries.map((entry) => {
    const isProblem = ERROR_LEVELS.includes(entry.level) || WARNING_LEVELS.includes(entry.level);
    return instant(
      isProblem ? TRACE_TRACKS.errors : TRACE_TRACKS.console,
      entry.time,
      `${entry.level}: ${entry.text.split('\n')[0]}`,
      { level: entry.level, text: shorten(entry.text, MAX_TRACE_ARG_LENGTH) },
    );
  });

  const storageWrites = timeline
    .filter((event) => event.kind === 'storage')
    .map((event) => instant(
      TRACE_TRACKS.storage,
      event.time,
      event.summary,
      event.data as Record<string, unknown>,
    ));

  const pageLoads = timeline
    .filter((event) => event.kind === 'page-load')
    .map((event) => marker(event.time, pageLoadLabel(event)));

  const traceEvents = [
    ...metadata(),
    ...steps,
    ...consoleEvents,
    ...storageWrites,
    ...mainAreaSlices(timeline, generatedAt),
    ...periodSlices(timeline, 'tab hidden', 'tab visible', 'Tab hidden', generatedAt),
    ...periodSlices(timeline, 'browser offline', 'browser online', 'Offline', generatedAt),
    ...pageLoads,
    marker(generatedAt, '/report'),
  ];

  return JSON.stringify({ traceEvents, displayTimeUnit: 'ms' });
};
