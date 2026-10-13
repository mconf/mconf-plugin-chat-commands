import { MAX_SERIALIZE_DEPTH, MAX_SERIALIZE_KEYS } from './constants';

export const truncate = (text: string, maxLength: number): string => (
  text.length > maxLength
    ? `${text.slice(0, maxLength)}… [truncated ${text.length - maxLength} chars]`
    : text
);

const describeNode = (node: Node): string => {
  if (!(node instanceof Element)) return `[${node.nodeName}]`;
  const id = node.id ? `#${node.id}` : '';
  const dataTest = node.getAttribute('data-test');
  return `<${node.tagName.toLowerCase()}${id}${dataTest ? ` data-test="${dataTest}"` : ''}>`;
};

const errorToText = (error: Error): string => {
  const header = `${error.name}: ${error.message}`;
  if (!error.stack) return header;
  return error.stack.startsWith(header) ? error.stack : `${header}\n${error.stack}`;
};

// Converts arbitrary values into JSON-safe structures, bounding depth and
// width so a logged Apollo cache or React fiber can't stall the page.
const toPlain = (value: unknown, depth: number, seen: WeakSet<object>): unknown => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return `${value.toString()}n`;
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
  if (typeof value !== 'object') return value;
  if (value instanceof Error) return errorToText(value);
  if (typeof Node !== 'undefined' && value instanceof Node) return describeNode(value);
  if (seen.has(value)) return '[Circular]';
  if (depth >= MAX_SERIALIZE_DEPTH) return Array.isArray(value) ? '[Array]' : '[Object]';
  seen.add(value);

  if (value instanceof Map) {
    const entries: Record<string, unknown> = {};
    value.forEach((entry, key) => { entries[String(key)] = entry; });
    return toPlain(entries, depth, seen);
  }
  if (value instanceof Set) {
    return toPlain(Array.from(value), depth, seen);
  }
  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_SERIALIZE_KEYS).map((item) => toPlain(item, depth + 1, seen));
    if (value.length > MAX_SERIALIZE_KEYS) items.push(`… ${value.length - MAX_SERIALIZE_KEYS} more items`);
    return items;
  }

  const result: Record<string, unknown> = {};
  const keys = Object.keys(value);
  keys.slice(0, MAX_SERIALIZE_KEYS).forEach((key) => {
    try {
      result[key] = toPlain((value as Record<string, unknown>)[key], depth + 1, seen);
    } catch (error) {
      result[key] = '[Unreadable]';
    }
  });
  if (keys.length > MAX_SERIALIZE_KEYS) result['…'] = `${keys.length - MAX_SERIALIZE_KEYS} more keys`;
  return result;
};

export const toSerializable = (value: unknown): unknown => toPlain(value, 0, new WeakSet());

const argToText = (arg: unknown): string => {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return errorToText(arg);
  const plain = toSerializable(arg);
  if (typeof plain === 'string') return plain;
  try {
    return JSON.stringify(plain) ?? String(plain);
  } catch (error) {
    return String(plain);
  }
};

/**
 * Renders console arguments the way DevTools would, applying printf-style
 * substitutions. `%c` styles are dropped: BBB's bunyan logger prefixes every
 * line with them.
 */
export const formatConsoleArgs = (args: unknown[]): string => {
  if (args.length === 0) return '';
  const [first, ...rest] = args;
  if (typeof first !== 'string' || !first.includes('%')) {
    return args.map(argToText).join(' ');
  }

  let remaining = rest;
  const formatted = first.replace(/%([sdifoOc%])/g, (match, specifier: string) => {
    if (specifier === '%') return '%';
    if (remaining.length === 0) return match;
    const [arg, ...others] = remaining;
    remaining = others;
    switch (specifier) {
      case 'c':
        return '';
      case 'd':
      case 'i':
        return String(parseInt(String(arg), 10));
      case 'f':
        return String(parseFloat(String(arg)));
      default:
        return argToText(arg);
    }
  });

  return [formatted, ...remaining.map(argToText)].join(' ');
};
