import { CurrentUserData, Meeting, UsersBasicInfoData } from 'bigbluebutton-html-plugin-sdk';
import { CAPTURE_STORAGE_KEY } from './sessionCapture/constants';
import { describeElement } from './sessionCapture';
import { getSdkState } from './sdkStateStore';

type JsonObject = Record<string, unknown>;

interface ApolloClientLike {
  cache: { extract: () => unknown };
}

type WindowWithApollo = Window & { __APOLLO_CLIENT__?: ApolloClientLike };

const LAYOUT_ROOT_ID = 'layout';
const MAX_LAYOUT_DEPTH = 3;
const LANDMARK_ROLES = ['region', 'complementary', 'navigation', 'main', 'dialog', 'toolbar'];
// The BBB client stores user settings under these keys, holding only the
// values that differ from the defaults in meetingClientSettings.
const CHANGED_SETTINGS_KEY_PATTERN = /changed_settings_([A-Za-z]+)/;

const safely = (collect: () => unknown): unknown => {
  try {
    return collect();
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
};

const parseStoredValue = (raw: string | null): unknown => {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return raw;
  }
};

const dumpStorage = (storage: Storage): JsonObject => {
  const result: JsonObject = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key !== null && key !== CAPTURE_STORAGE_KEY) {
      result[key] = parseStoredValue(storage.getItem(key));
    }
  }
  return result;
};

const readPath = (source: unknown, path: string[]): unknown => path.reduce<unknown>(
  (current, key) => (current && typeof current === 'object' ? (current as JsonObject)[key] : undefined),
  source,
);

const collectEffectiveSettings = (): JsonObject => {
  const clientSettings = window.meetingClientSettings;
  const defaults = (readPath(clientSettings, ['public', 'app', 'defaultSettings']) ?? {}) as JsonObject;
  const storageMode = readPath(clientSettings, ['public', 'app', 'userSettingsStorage']);
  const storage = storageMode === 'local' ? window.localStorage : window.sessionStorage;

  const changed: JsonObject = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    const category = key?.match(CHANGED_SETTINGS_KEY_PATTERN)?.[1];
    if (key && category) {
      changed[category] = parseStoredValue(storage.getItem(key));
    }
  }

  const categories = new Set([...Object.keys(defaults), ...Object.keys(changed)]);
  const effective: JsonObject = {};
  categories.forEach((category) => {
    effective[category] = {
      ...(defaults[category] as JsonObject),
      ...(changed[category] as JsonObject),
    };
  });

  return { storage: storageMode ?? 'session', changed, effective };
};

export interface SettingsSnapshot {
  source: string;
  current: JsonObject;
  // Per category, only what the user changed in the Settings modal: the client
  // persists just the values that differ from its own defaults.
  changedByUser: JsonObject;
  storageMode: unknown;
}

export const collectSettingsSnapshot = (clientSettings: unknown): SettingsSnapshot => {
  const fromStorage = collectEffectiveSettings();
  const fromServer = Boolean(clientSettings && typeof clientSettings === 'object');

  return {
    source: fromServer
      ? 'user_clientSettings subscription (what the Settings modal shows)'
      : 'storage fallback: defaults + saved changes, missing bbb_* userdata overrides and browser locale',
    current: (fromServer ? clientSettings : fromStorage.effective) as JsonObject,
    changedByUser: fromStorage.changed as JsonObject,
    storageMode: fromStorage.storage,
  };
};

const rectOf = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
};

const isIdentifiable = (element: Element): boolean => Boolean(
  element.id
  || element.getAttribute('data-test')
  || element.getAttribute('aria-label')
  || LANDMARK_ROLES.includes(element.getAttribute('role') ?? ''),
);

const collectRegions = (element: Element, depth: number, regions: unknown[]): void => {
  Array.from(element.children).forEach((child) => {
    const rect = rectOf(child);
    const visible = rect.width > 0 && rect.height > 0;
    if (visible && isIdentifiable(child)) {
      regions.push({ depth, ...describeElement(child), rect });
    }
    if (depth < MAX_LAYOUT_DEPTH) collectRegions(child, depth + 1, regions);
  });
};

const collectLayout = (): JsonObject => {
  const root = document.getElementById(LAYOUT_ROOT_ID);
  const regions: unknown[] = [];
  if (root) collectRegions(root, 1, regions);

  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    devicePixelRatio: window.devicePixelRatio,
    visibilityState: document.visibilityState,
    fullscreenElement: describeElement(document.fullscreenElement) ?? null,
    activeElement: describeElement(document.activeElement),
    openDialogs: Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"]'))
      .map((dialog) => ({ ...describeElement(dialog), rect: rectOf(dialog) })),
    regions,
  };
};

const collectApolloCache = (): unknown => {
  const client = (window as WindowWithApollo).__APOLLO_CLIENT__;
  if (!client) {
    return {
      available: false,
      reason: 'window.__APOLLO_CLIENT__ is not set; enable public.app.enableApolloDevTools to expose it',
    };
  }
  return { available: true, cache: client.cache.extract() };
};

export interface StateSnapshotParams {
  currentUser: CurrentUserData;
  meeting: Meeting;
  users: UsersBasicInfoData[];
  settings: SettingsSnapshot;
  includeApolloCache: boolean;
}

export const collectStateSnapshot = ({
  currentUser,
  meeting,
  users,
  settings,
  includeApolloCache,
}: StateSnapshotParams): JsonObject => {
  const tracked = getSdkState();
  // Already reported, in full, under `settings`.
  delete tracked.clientSettings;

  return {
    sdk: {
      currentUser,
      meeting,
      users,
      tracked,
    },
    settings,
    storage: {
      local: safely(() => dumpStorage(window.localStorage)),
      session: safely(() => dumpStorage(window.sessionStorage)),
    },
    meetingClientSettings: safely(() => window.meetingClientSettings ?? null),
    layout: safely(collectLayout),
    apollo: includeApolloCache
      ? safely(collectApolloCache)
      : { available: false, reason: 'omitted by --mask' },
  };
};
