import { CAPTURE_STORAGE_KEY, MAX_STORAGE_VALUE_LENGTH } from './constants';
import { truncate } from './serialize';
import { SessionCapture } from './types';

type RecordEvent = SessionCapture['recordEvent'];

const areaOf = (storage: Storage): string => {
  try {
    if (storage === window.localStorage) return 'localStorage';
    if (storage === window.sessionStorage) return 'sessionStorage';
  } catch (error) {
    // Accessing storage throws when site data is blocked.
  }
  return 'storage';
};

const preview = (value: string | null): string | null => (
  value === null ? null : truncate(value, MAX_STORAGE_VALUE_LENGTH)
);

/**
 * Patches the Storage prototype so every write the BBB client makes (settings,
 * mute state, webcam dock size...) shows up in the timeline, without reaching
 * into the client's own storage wrappers.
 */
export const installStorageCapture = (recordEvent: RecordEvent): void => {
  const {
    setItem,
    removeItem,
    clear,
    getItem,
  } = Storage.prototype;

  Storage.prototype.setItem = function capturedSetItem(this: Storage, key: string, value: string) {
    const previous = key === CAPTURE_STORAGE_KEY ? null : getItem.call(this, key);
    setItem.call(this, key, value);
    if (key === CAPTURE_STORAGE_KEY || previous === String(value)) return;
    recordEvent({
      kind: 'storage',
      summary: `${areaOf(this)} set ${key}`,
      data: { key, from: preview(previous), to: preview(String(value)) },
    });
  };

  Storage.prototype.removeItem = function capturedRemoveItem(this: Storage, key: string) {
    const previous = key === CAPTURE_STORAGE_KEY ? null : getItem.call(this, key);
    removeItem.call(this, key);
    if (key === CAPTURE_STORAGE_KEY || previous === null) return;
    recordEvent({
      kind: 'storage',
      summary: `${areaOf(this)} remove ${key}`,
      data: { key, from: preview(previous) },
    });
  };

  Storage.prototype.clear = function capturedClear(this: Storage) {
    clear.call(this);
    recordEvent({ kind: 'storage', summary: `${areaOf(this)} cleared` });
  };
};
