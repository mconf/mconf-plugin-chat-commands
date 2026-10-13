import { humanLabel, TimelineEvent } from '../sessionCapture';
import { LAYOUT_LABELS, MAIN_AREA_LABELS, settingLabel } from '../settingsTabs';
import { formatValue } from './format';
import { ReportStep } from './types';

type JsonObject = Record<string, unknown>;

interface StateChange {
  name?: string;
  from?: unknown;
  to?: unknown;
}

interface MainAreaElement {
  currentElement?: string;
  isOpen?: boolean;
}

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

export const pageLoadLabel = (event: TimelineEvent): string => (
  capitalize(event.summary.replace(/[─\s]+/g, ' ').trim())
);

export const describeMainArea = (value: unknown): string => {
  if (!Array.isArray(value)) return 'nothing';
  const open = (value as MainAreaElement[])
    .filter((element) => element.isOpen && element.currentElement)
    .map((element) => MAIN_AREA_LABELS[element.currentElement as string] ?? element.currentElement);
  return open.length > 0 ? open.join(' + ') : 'nothing';
};

const formatSettingValue = (key: string, value: unknown): string => (
  key === 'selectedLayout' && typeof value === 'string'
    ? LAYOUT_LABELS[value] ?? value
    : formatValue(value)
);

const changeText = (key: string, previous: unknown, next: unknown): string => (
  `${formatSettingValue(key, previous)} → ${formatSettingValue(key, next)}`
);

const settingsChanges = (time: number, from: unknown, to: unknown): ReportStep[] => {
  const before = (from ?? {}) as Record<string, JsonObject>;
  const after = (to ?? {}) as Record<string, JsonObject>;
  const steps: ReportStep[] = [];
  Object.keys(after).forEach((category) => {
    const keys = new Set([
      ...Object.keys(before[category] ?? {}),
      ...Object.keys(after[category] ?? {}),
    ]);
    keys.forEach((key) => {
      const previous = before[category]?.[key];
      const next = after[category]?.[key];
      if (JSON.stringify(previous) === JSON.stringify(next)) return;
      steps.push({
        time,
        action: 'Setting changed',
        element: `${settingLabel(category, key)}: ${changeText(key, previous, next)}`,
      });
    });
  });
  return steps;
};

const currentUserChanges = (time: number, from: JsonObject, to: JsonObject): ReportStep[] => {
  const steps: ReportStep[] = [];
  if (from.role !== to.role) {
    steps.push({ time, action: 'Role changed', element: `${from.role} → ${to.role}` });
  }
  if (from.presenter !== to.presenter) {
    steps.push({ time, action: to.presenter ? 'Became presenter' : 'Stopped being presenter', element: '' });
  }
  if (from.cameras !== to.cameras) {
    const started = Number(to.cameras) > Number(from.cameras);
    steps.push({ time, action: started ? 'Camera started' : 'Camera stopped', element: `${to.cameras} active` });
  }
  return steps;
};

const stateSteps = (event: TimelineEvent): ReportStep[] => {
  const { name, from, to } = (event.data ?? {}) as StateChange;
  // The first value of each state is recorded when the plugin loads; it is not
  // something that happened, so it doesn't count as a step.
  if (from === undefined) return [];
  const { time } = event;
  const step = (action: string, element = ''): ReportStep[] => [{ time, action, element }];

  switch (name) {
    case 'clientSettings':
      return settingsChanges(time, from, to);
    case 'presentationArea':
      return step('Main area changed', `${describeMainArea(from)} → ${describeMainArea(to)}`);
    case 'userListOpen':
      return step(to ? 'User list opened' : 'User list closed');
    case 'locale':
      return step('Language changed', `${from} → ${to}`);
    case 'currentPresentation': {
      const before = from as JsonObject;
      const after = (to ?? {}) as JsonObject;
      return before.presentationId === after.presentationId
        ? step('Slide changed', `page ${before.page} → ${after.page}`)
        : step('Presentation changed', `page ${after.page ?? '—'}`);
    }
    case 'currentUser':
      return currentUserChanges(time, from as JsonObject, (to ?? {}) as JsonObject);
    default:
      return step(`${name ?? 'State'} changed`);
  }
};

const eventSteps = (event: TimelineEvent): ReportStep[] => {
  const { time, target } = event;
  const element = humanLabel(target);
  const dataTest = target?.dataTest;
  const data = (event.data ?? {}) as JsonObject;
  const onTarget = (action: string): ReportStep[] => [{
    time,
    action,
    element,
    dataTest,
  }];
  const withoutTarget = (action: string): ReportStep[] => [{ time, action, element: '' }];

  switch (event.kind) {
    case 'click':
      return onTarget('Click');
    case 'change': {
      if (data.checked === undefined) return onTarget('Edit field');
      return onTarget(data.checked ? 'Check' : 'Uncheck');
    }
    case 'key': {
      const combination = (data.combination as string) ?? event.summary.replace(/^key (\S+).*/, '$1');
      return onTarget(`Press ${combination}`);
    }
    case 'page-load':
      return withoutTarget(pageLoadLabel(event));
    case 'navigation':
    case 'visibility':
    case 'network':
      return withoutTarget(capitalize(event.summary));
    case 'state':
      return stateSteps(event);
    default:
      return [];
  }
};

/**
 * Turns the raw timeline into what a person reading a bug report wants: what
 * the user did and what visibly changed. Storage writes stay out — they are
 * implementation detail, kept in details.json.
 */
export const toReportSteps = (events: TimelineEvent[]): ReportStep[] => events
  .reduce<ReportStep[]>((steps, event) => steps.concat(eventSteps(event)), []);
