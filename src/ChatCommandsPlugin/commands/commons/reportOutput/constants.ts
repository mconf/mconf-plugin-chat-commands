export const MAX_STEPS_IN_REPORT = 100;
export const MAX_ERRORS_IN_REPORT = 10;
export const MAX_ERROR_MESSAGE_LENGTH = 200;
export const MAX_CELL_VALUE_LENGTH = 120;
export const MAX_TRACE_ARG_LENGTH = 1000;
export const MAX_TRACE_NAME_LENGTH = 80;

export const CHANGED_MARK = '★';

export const ERROR_LEVELS = ['error', 'uncaught', 'unhandledrejection', 'resource', 'csp'];
export const WARNING_LEVELS = ['warn'];

export const TRACE_PROCESS_ID = 1;

// One Perfetto track per tid, listed in this order.
export const TRACE_TRACKS = {
  steps: { tid: 1, name: 'User steps' },
  errors: { tid: 2, name: 'Console errors & warnings' },
  console: { tid: 3, name: 'Console (other)' },
  mainArea: { tid: 4, name: 'Main area content' },
  tab: { tid: 5, name: 'Tab visibility & network' },
  storage: { tid: 6, name: 'Storage writes' },
};
