import { MAX_CELL_VALUE_LENGTH } from './constants';

const pad = (value: number, size = 2) => String(value).padStart(size, '0');

export const formatClock = (time: number): string => {
  const date = new Date(time);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const formatDateTime = (time: number): string => {
  const date = new Date(time);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${formatClock(time)}`;
};

export const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${pad(minutes)}m`;
  if (minutes > 0) return `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
};

export const formatBeforeReport = (time: number, reportTime: number): string => (
  `-${formatDuration(reportTime - time)}`
);

export const formatValue = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return '—';
  if (value === true) return 'On';
  if (value === false) return 'Off';
  if (typeof value === 'object') {
    const json = JSON.stringify(value);
    return json.length > MAX_CELL_VALUE_LENGTH ? `${json.slice(0, MAX_CELL_VALUE_LENGTH)}…` : json;
  }
  return String(value);
};

const escapeCell = (value: string): string => value
  .replace(/\\/g, '\\\\')
  .replace(/\|/g, '\\|')
  .replace(/\s*\n\s*/g, ' ');

export const markdownTable = (headers: string[], rows: string[][]): string => [
  `| ${headers.map(escapeCell).join(' | ')} |`,
  `| ${headers.map(() => '---').join(' | ')} |`,
  ...rows.map((cells) => `| ${cells.map(escapeCell).join(' | ')} |`),
].join('\n');

export const inlineCode = (value?: string): string => (value ? `\`${value.replace(/`/g, "'")}\`` : '');
