import { CONSOLE_METHODS, MAX_CONSOLE_ENTRY_LENGTH } from './constants';
import { formatConsoleArgs, truncate } from './serialize';
import { ConsoleEntry, ConsoleLevel } from './types';

type RecordConsole = (entry: ConsoleEntry) => void;

const describeResource = (element: Element): string => {
  const source = element.getAttribute('src') ?? element.getAttribute('href') ?? '';
  return `Failed to load <${element.tagName.toLowerCase()}> ${source}`;
};

export const installConsoleCapture = (recordConsole: RecordConsole): void => {
  // Serializing an argument can hit a getter that logs, which would recurse
  // back into the wrapper.
  let recording = false;

  const record = (level: ConsoleLevel, renderText: () => string) => {
    if (recording) return;
    recording = true;
    try {
      const text = truncate(renderText(), MAX_CONSOLE_ENTRY_LENGTH);
      recordConsole({ time: Date.now(), level, text });
    } catch (error) {
      // Capture must never break the page's own logging.
    } finally {
      recording = false;
    }
  };

  CONSOLE_METHODS.forEach((method) => {
    // eslint-disable-next-line no-console
    const original = console[method];
    // eslint-disable-next-line no-console
    console[method] = function captured(this: Console, ...args: unknown[]) {
      record(method, () => formatConsoleArgs(args));
      return original.apply(this, args);
    };
  });

  // Capture phase is required: resource load errors don't bubble to window.
  window.addEventListener('error', (event: Event) => {
    if (event instanceof ErrorEvent) {
      const location = event.filename ? ` (${event.filename}:${event.lineno}:${event.colno})` : '';
      const detail = event.error instanceof Error && event.error.stack ? `\n${event.error.stack}` : '';
      record('uncaught', () => `${event.message}${location}${detail}`);
      return;
    }
    if (event.target instanceof Element) {
      record('resource', () => describeResource(event.target as Element));
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    record('unhandledrejection', () => formatConsoleArgs([event.reason]));
  });

  document.addEventListener('securitypolicyviolation', (event) => {
    record('csp', () => `Blocked ${event.blockedURI || 'inline content'} by "${event.violatedDirective}"`);
  });
};
