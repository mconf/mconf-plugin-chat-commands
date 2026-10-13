export const CAPTURE_STORAGE_KEY = 'chatCommandsPlugin:sessionCapture';
export const CAPTURE_GLOBAL_KEY: unique symbol = Symbol.for('chatCommandsPlugin.sessionCapture');
export const PERSISTED_FORMAT_VERSION = 1;

// Budgets are measured in string length (UTF-16 code units), which is also how
// browsers account for the Web Storage quota.
export const CONSOLE_MEMORY_BUDGET = 20 * 1024 * 1024;
export const TIMELINE_MEMORY_BUDGET = 5 * 1024 * 1024;
// sessionStorage holds ~5M chars per origin and is shared with the BBB client.
export const CONSOLE_PERSIST_BUDGET = 2.5 * 1024 * 1024;
export const TIMELINE_PERSIST_BUDGET = 0.5 * 1024 * 1024;
export const PERSIST_THROTTLE_MS = 5000;

export const MAX_CONSOLE_ENTRY_LENGTH = 4096;
export const MAX_STORAGE_VALUE_LENGTH = 1024;
export const MAX_ELEMENT_TEXT_LENGTH = 50;
export const MAX_SERIALIZE_DEPTH = 5;
export const MAX_SERIALIZE_KEYS = 100;

export const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug', 'trace'] as const;

export const RECORDED_KEYS = ['Enter', 'Escape', 'Tab'];

export const INTERACTIVE_ELEMENT_SELECTOR = 'button, a, input, select, textarea, label, [role], [data-test], [aria-label]';
