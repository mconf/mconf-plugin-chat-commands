import {
  CAPTURE_GLOBAL_KEY,
  CAPTURE_STORAGE_KEY,
  CONSOLE_MEMORY_BUDGET,
  CONSOLE_PERSIST_BUDGET,
  PERSIST_THROTTLE_MS,
  PERSISTED_FORMAT_VERSION,
  TIMELINE_MEMORY_BUDGET,
  TIMELINE_PERSIST_BUDGET,
} from './constants';
import { installConsoleCapture } from './consoleCapture';
import { RingBuffer } from './ringBuffer';
import { installStepCapture } from './stepCapture';
import { installStorageCapture } from './storageCapture';
import {
  ConsoleEntry,
  PersistedCapture,
  SessionCapture,
  TimelineEvent,
} from './types';

type GlobalWithCapture = typeof globalThis & { [CAPTURE_GLOBAL_KEY]?: SessionCapture };

const ENTRY_OVERHEAD = 32;

const readPersisted = (): PersistedCapture | null => {
  try {
    const raw = window.sessionStorage.getItem(CAPTURE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedCapture;
    return parsed.version === PERSISTED_FORMAT_VERSION ? parsed : null;
  } catch (error) {
    return null;
  }
};

const writePersisted = (capture: PersistedCapture): void => {
  try {
    window.sessionStorage.setItem(CAPTURE_STORAGE_KEY, JSON.stringify(capture));
  } catch (error) {
    // Quota exceeded or storage blocked: the in-memory buffers still work,
    // only surviving a reload is lost.
    try {
      window.sessionStorage.removeItem(CAPTURE_STORAGE_KEY);
    } catch (removeError) {
      // Storage is unavailable altogether.
    }
  }
};

const createSessionCapture = (): SessionCapture => {
  const persisted = readPersisted();
  const captureStartedAt = persisted?.captureStartedAt ?? Date.now();
  const pageLoads = (persisted?.pageLoads ?? 0) + 1;

  const consoleBuffer = new RingBuffer<ConsoleEntry>(
    CONSOLE_MEMORY_BUDGET,
    (entry) => entry.text.length + ENTRY_OVERHEAD,
  );
  const timelineBuffer = new RingBuffer<TimelineEvent>(
    TIMELINE_MEMORY_BUDGET,
    (event) => JSON.stringify(event).length,
  );

  if (persisted) {
    consoleBuffer.restore(persisted.console);
    timelineBuffer.restore(persisted.timeline);
  }

  const persist = () => writePersisted({
    version: PERSISTED_FORMAT_VERSION,
    captureStartedAt,
    pageLoads,
    console: consoleBuffer.newestWithin(CONSOLE_PERSIST_BUDGET),
    timeline: timelineBuffer.newestWithin(TIMELINE_PERSIST_BUDGET),
  });

  let persistTimer: ReturnType<typeof setTimeout> | null = null;
  const schedulePersist = () => {
    if (persistTimer) return;
    persistTimer = setTimeout(() => {
      persistTimer = null;
      persist();
    }, PERSIST_THROTTLE_MS);
  };

  window.addEventListener('pagehide', persist);

  const capture: SessionCapture = {
    recordConsole: (entry) => {
      consoleBuffer.push(entry);
      schedulePersist();
    },
    recordEvent: (event) => {
      timelineBuffer.push({ time: Date.now(), ...event });
      schedulePersist();
    },
    snapshot: () => ({
      captureStartedAt,
      pageLoads,
      console: consoleBuffer.contents(),
      timeline: timelineBuffer.contents(),
    }),
  };

  capture.recordEvent({
    kind: 'page-load',
    summary: `── page load #${pageLoads} ──`,
    data: { url: window.location.href },
  });

  return capture;
};

/**
 * Starts recording console output, user steps and storage writes. Must run as
 * early as possible: nothing that happened before this call can be recovered.
 * Safe to call more than once.
 */
export const installSessionCapture = (): SessionCapture => {
  const globalScope = globalThis as GlobalWithCapture;
  const existing = globalScope[CAPTURE_GLOBAL_KEY];
  if (existing) return existing;

  const capture = createSessionCapture();
  globalScope[CAPTURE_GLOBAL_KEY] = capture;
  installConsoleCapture(capture.recordConsole);
  installStepCapture(capture.recordEvent);
  installStorageCapture(capture.recordEvent);
  return capture;
};

export const getSessionCapture = (): SessionCapture => installSessionCapture();

export * from './types';
export { describeElement, elementLabel, humanLabel } from './describeElement';
export { toSerializable } from './serialize';
