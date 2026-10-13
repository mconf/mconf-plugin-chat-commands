import { ConsoleEntry } from '../sessionCapture';
import {
  LAYOUT_LABELS,
  NOTIFICATION_CATEGORY,
  NOTIFICATION_ROWS,
  SETTINGS_TABS,
} from '../settingsTabs';
import {
  CHANGED_MARK,
  ERROR_LEVELS,
  MAX_ERROR_MESSAGE_LENGTH,
  MAX_ERRORS_IN_REPORT,
  MAX_STEPS_IN_REPORT,
} from './constants';
import {
  formatBeforeReport,
  formatClock,
  formatDateTime,
  formatDuration,
  formatValue,
  inlineCode,
  markdownTable,
} from './format';
import { describeMainArea, toReportSteps } from './steps';
import { DeviceLabels, MarkdownReportInput } from './types';

type JsonObject = Record<string, unknown>;

const DEVICE_SETTING_KEYS = ['inputDeviceId', 'outputDeviceId'];

const valueAt = (source: JsonObject, category: string, key: string): unknown => (
  (source[category] as JsonObject | undefined)?.[key]
);

const changedMark = (changedByUser: JsonObject, category: string, key: string): string => (
  valueAt(changedByUser, category, key) !== undefined ? CHANGED_MARK : ''
);

const formatSetting = (key: string, value: unknown, deviceLabels: DeviceLabels): string => {
  if (DEVICE_SETTING_KEYS.includes(key)) {
    const label = deviceLabels[key as keyof DeviceLabels];
    if (label) return label;
    return value ? formatValue(value) : 'Browser default';
  }
  if (key === 'selectedLayout' && typeof value === 'string') return LAYOUT_LABELS[value] ?? value;
  return formatValue(value);
};

const contextSection = (input: MarkdownReportInput): string => {
  const {
    generatedAt, capture, currentUser, meeting, tracked, settings, screenshotNote,
  } = input;
  const trackedUser = (tracked.currentUser ?? {}) as JsonObject;
  const history = `since ${formatDateTime(capture.captureStartedAt)} `
    + `(${formatDuration(generatedAt - capture.captureStartedAt)}), ${capture.pageLoads} page load(s)`;
  const dropped = capture.console.droppedCount + capture.timeline.droppedCount;

  const rows: string[][] = [
    ['Generated at', `${formatDateTime(generatedAt)} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`],
    ['User', `${currentUser.name} — ${currentUser.role}${currentUser.presenter ? ', presenter' : ''}`],
    ['Meeting', meeting.name],
    ['Browser', inlineCode(navigator.userAgent)],
    ['Window', `${window.innerWidth}×${window.innerHeight}, pixel ratio ${window.devicePixelRatio}${document.fullscreenElement ? ', fullscreen' : ''}`],
    ['Main area', describeMainArea(tracked.presentationArea)],
    ['User list', tracked.userListOpen ? 'Open' : 'Closed'],
    ['Own cameras', String(trackedUser.cameras ?? currentUser.cameras?.length ?? 0)],
    ['Connection', navigator.onLine ? 'Online' : 'Offline'],
    ['Captured history', dropped > 0 ? `${history}, ${dropped} oldest entries dropped` : history],
    ['Screenshot', screenshotNote],
    ['Settings source', settings.source],
  ];
  return `## Context\n\n${markdownTable(['Item', 'Value'], rows)}`;
};

const settingsSection = ({ settings, deviceLabels }: MarkdownReportInput): string => {
  const { current, changedByUser } = settings;

  const tabTables = SETTINGS_TABS.map((tab) => {
    const rows = tab.rows.map(({ category, key, label }) => [
      label,
      formatSetting(key, valueAt(current, category, key), deviceLabels),
      changedMark(changedByUser, category, key),
    ]);
    return `### ${tab.title}\n\n${markdownTable(['Setting', 'Value', 'Changed'], rows)}`;
  });

  const notificationRows = NOTIFICATION_ROWS.map(({ label, audioKey, pushKey }) => {
    const cell = (key?: string) => (key
      ? `${formatValue(valueAt(current, NOTIFICATION_CATEGORY, key))} ${changedMark(changedByUser, NOTIFICATION_CATEGORY, key)}`.trim()
      : '—');
    return [label, cell(audioKey), cell(pushKey)];
  });
  const notifications = `### Notifications\n\n${markdownTable(['Event', 'Sound', 'Popup'], notificationRows)}`;

  return [
    '## Settings',
    `${CHANGED_MARK} = changed by the user in the Settings modal.`,
    ...tabTables.slice(0, 3),
    notifications,
    ...tabTables.slice(3),
  ].join('\n\n');
};

const stepsSection = ({ capture, generatedAt }: MarkdownReportInput): string => {
  const steps = toReportSteps(capture.timeline.entries);
  if (steps.length === 0) return '## Steps before the report\n\nNo interactions were captured.';

  const shown = steps.slice(-MAX_STEPS_IN_REPORT);
  const firstNumber = steps.length - shown.length + 1;
  const rows = shown.map((step, index) => [
    String(firstNumber + index),
    formatClock(step.time),
    formatBeforeReport(step.time, generatedAt),
    step.action,
    step.element,
    inlineCode(step.dataTest),
  ]);
  const note = steps.length > shown.length
    ? `\n\nShowing the last ${shown.length} of ${steps.length} steps. All of them are in \`trace.json\`.`
    : '';
  return `## Steps before the report\n\nOldest first — the last row is what happened right before \`/report\`.${note}\n\n${
    markdownTable(['#', 'Time', 'Before report', 'Action', 'Element', 'data-test'], rows)}`;
};

const firstLine = (entry: ConsoleEntry): string => {
  const line = entry.text.split('\n')[0];
  return line.length > MAX_ERROR_MESSAGE_LENGTH ? `${line.slice(0, MAX_ERROR_MESSAGE_LENGTH)}…` : line;
};

const errorsSection = ({ capture, generatedAt }: MarkdownReportInput): string => {
  const errors = capture.console.entries.filter((entry) => ERROR_LEVELS.includes(entry.level));
  if (errors.length === 0) return '## Recent errors\n\nNo errors were logged.';

  const rows = errors.slice(-MAX_ERRORS_IN_REPORT).map((entry) => [
    formatClock(entry.time),
    formatBeforeReport(entry.time, generatedAt),
    entry.level,
    firstLine(entry),
  ]);
  return `## Recent errors\n\nLast ${rows.length} of ${errors.length}. Full output in \`console.log\`.\n\n${
    markdownTable(['Time', 'Before report', 'Type', 'Message'], rows)}`;
};

export const buildMarkdownReport = (input: MarkdownReportInput): string => [
  `# Bug report — ${formatDateTime(input.generatedAt)}`,
  'Files: `screenshot.png` · `console.log` (full console) · `trace.json` (timeline — open it at https://ui.perfetto.dev) · `details.json` (raw data)',
  contextSection(input),
  stepsSection(input),
  errorsSection(input),
  settingsSection(input),
].join('\n\n');
