import { RECORDED_KEYS } from './constants';
import { describeElement, elementLabel } from './describeElement';
import { SessionCapture } from './types';

type RecordEvent = SessionCapture['recordEvent'];

const keyCombination = (event: KeyboardEvent): string => [
  event.ctrlKey && 'Ctrl',
  event.altKey && 'Alt',
  event.shiftKey && 'Shift',
  event.metaKey && 'Meta',
  event.key,
].filter(Boolean).join('+');

const isRecordedKey = (event: KeyboardEvent): boolean => RECORDED_KEYS.includes(event.key)
  || event.ctrlKey || event.altKey || event.metaKey;

export const installStepCapture = (recordEvent: RecordEvent): void => {
  document.addEventListener('click', (event) => {
    const target = describeElement(event.target);
    recordEvent({ kind: 'click', summary: `click ${elementLabel(target)}`, target });
  }, true);

  // Only which field changed is recorded, never its value: the chat input
  // would otherwise turn this into a keylogger.
  document.addEventListener('change', (event) => {
    const target = describeElement(event.target);
    const field = event.target as HTMLInputElement;
    const isToggle = field.type === 'checkbox' || field.type === 'radio';
    recordEvent({
      kind: 'change',
      summary: `change ${elementLabel(target)}`,
      target,
      data: isToggle ? { checked: field.checked } : undefined,
    });
  }, true);

  document.addEventListener('keydown', (event) => {
    if (!isRecordedKey(event)) return;
    const target = describeElement(event.target);
    const combination = keyCombination(event);
    recordEvent({
      kind: 'key',
      summary: `key ${combination} on ${elementLabel(target)}`,
      target,
      data: { combination },
    });
  }, true);

  const recordNavigation = () => {
    recordEvent({ kind: 'navigation', summary: `navigate ${window.location.pathname}${window.location.hash}` });
  };
  window.addEventListener('popstate', recordNavigation);
  window.addEventListener('hashchange', recordNavigation);

  document.addEventListener('visibilitychange', () => {
    recordEvent({ kind: 'visibility', summary: `tab ${document.visibilityState}` });
  });
  document.addEventListener('fullscreenchange', () => {
    recordEvent({ kind: 'visibility', summary: document.fullscreenElement ? 'fullscreen entered' : 'fullscreen exited' });
  });

  window.addEventListener('online', () => recordEvent({ kind: 'network', summary: 'browser online' }));
  window.addEventListener('offline', () => recordEvent({ kind: 'network', summary: 'browser offline' }));
};
