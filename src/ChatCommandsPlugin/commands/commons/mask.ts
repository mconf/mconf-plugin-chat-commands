import { CurrentUserData, Meeting, UsersBasicInfoData } from 'bigbluebutton-html-plugin-sdk';
import { TimelineEvent } from './sessionCapture';

type SensitiveKind = 'token' | 'name' | 'extId';

// Shorter values ("a", "Jo") would mask unrelated text all over the logs.
const MIN_MASKED_LENGTH = 3;

const STORAGE_KEY_KINDS: [RegExp, SensitiveKind][] = [
  [/(sessionToken|authToken)$/i, 'token'],
  [/(fullname|userName|confname|meetingName)$/i, 'name'],
  [/(externUserID|extId)$/i, 'extId'],
];

const UNSENT_MESSAGES_KEY = /unsentMessages$/;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface Masker {
  maskText: (text: string) => string;
  maskStorageDump: (dump: Record<string, unknown>) => Record<string, unknown>;
  maskTimeline: (events: TimelineEvent[]) => TimelineEvent[];
}

const draftLength = (draft: unknown): string => `<${String(draft ?? '').length} chars>`;

const maskDrafts = (drafts: unknown): unknown => {
  if (!drafts || typeof drafts !== 'object') return drafts;
  const masked: Record<string, string> = {};
  Object.keys(drafts).forEach((chatId) => {
    masked[chatId] = draftLength((drafts as Record<string, unknown>)[chatId]);
  });
  return masked;
};

const storedString = (raw: string | null): string | null => {
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'string' ? parsed : raw;
  } catch (error) {
    return raw;
  }
};

type AddSensitive = (value: unknown, kind: SensitiveKind) => void;

const collectStorageValues = (storage: Storage, add: AddSensitive) => {
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    const match = key ? STORAGE_KEY_KINDS.find(([pattern]) => pattern.test(key)) : undefined;
    if (key && match) add(storedString(storage.getItem(key)), match[1]);
  }
};

/**
 * Masks by value rather than by field: the same token or name also shows up
 * inside log lines, URLs and the timeline, where no field name marks it.
 */
export const createMasker = (
  currentUser: CurrentUserData,
  meeting: Meeting,
  users: UsersBasicInfoData[],
): Masker => {
  const sensitive = new Map<string, SensitiveKind>();
  const add = (value: unknown, kind: SensitiveKind) => {
    if (typeof value === 'string' && value.length >= MIN_MASKED_LENGTH) sensitive.set(value, kind);
  };

  add(currentUser.name, 'name');
  add(currentUser.extId, 'extId');
  add(meeting.name, 'name');
  users.forEach((user) => {
    add(user.name, 'name');
    add(user.extId, 'extId');
  });
  [window.localStorage, window.sessionStorage].forEach((storage) => {
    try {
      collectStorageValues(storage, add);
    } catch (error) {
      // Storage blocked: nothing to collect from it.
    }
  });

  const placeholders = new Map<string, string>();
  sensitive.forEach((kind, value) => {
    placeholders.set(value, `<masked:${kind}>`);
    placeholders.set(JSON.stringify(value).slice(1, -1), `<masked:${kind}>`);
  });
  const { search } = window.location;
  if (search) placeholders.set(search, '');

  // One alternation pass instead of one pass per value: the console log can be
  // tens of MB. Longest first, so a value containing another one is replaced whole.
  const alternatives = Array.from(placeholders.keys())
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  const pattern = alternatives.length > 0 ? new RegExp(alternatives.join('|'), 'g') : null;

  const maskText = (text: string): string => (
    pattern ? text.replace(pattern, (match) => placeholders.get(match) ?? match) : text
  );

  const maskStorageDump = (dump: Record<string, unknown>): Record<string, unknown> => {
    const result = { ...dump };
    Object.keys(result).forEach((key) => {
      if (UNSENT_MESSAGES_KEY.test(key)) result[key] = maskDrafts(result[key]);
    });
    return result;
  };

  // Storage events carry the raw stored string, so drafts are reduced to their
  // total length instead of per chat.
  const maskTimeline = (events: TimelineEvent[]): TimelineEvent[] => events.map((event) => {
    const data = event.data as { key?: string; from?: unknown; to?: unknown } | undefined;
    if (event.kind !== 'storage' || !data?.key || !UNSENT_MESSAGES_KEY.test(data.key)) return event;
    return {
      ...event,
      data: {
        ...data,
        from: data.from === undefined ? undefined : draftLength(data.from),
        to: data.to === undefined ? undefined : draftLength(data.to),
      },
    };
  });

  return { maskText, maskStorageDump, maskTimeline };
};
