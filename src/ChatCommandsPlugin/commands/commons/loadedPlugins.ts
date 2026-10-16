const SEMVER_PATTERN = /^v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/;
// <Name>-<version>[-<commit>].js, e.g. GenericComponentPlugin-0.2.2-7fcc1a.js.
// The optional pre-release is lazy so a trailing hex chunk is taken as the commit.
const BUNDLE_FILENAME_PATTERN = /-v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)??)(?:-([0-9a-f]{6,40}))?\.js$/;

export interface PluginVersion {
  version: string | null;
  commit: string | null;
}

export interface LoadedPlugin extends PluginVersion {
  uuid: string;
  name: string;
  entrypointUrl: string | null;
}

const UNKNOWN_VERSION: PluginVersion = { version: null, commit: null };

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const extractVersionFromFilename = (filename: string): PluginVersion | null => {
  const match = BUNDLE_FILENAME_PATTERN.exec(filename);
  return match ? { version: match[1], commit: match[2] ?? null } : null;
};

// The SDK exposes no plugin version, so the only hint is the bundle URL: its
// filename, a directory or a query value (e.g. /plugins/foo/1.2.0/Foo.js).
const extractVersionFromUrl = (src: string): PluginVersion => {
  try {
    const url = new URL(src, window.location.href);
    const segments = url.pathname.split('/').map(safeDecode);
    const filename = segments.pop() ?? '';
    const fromFilename = extractVersionFromFilename(filename);
    if (fromFilename) return fromFilename;

    const candidates = [...segments, ...Array.from(url.searchParams.values()).map(safeDecode)];
    const match = candidates
      .map((candidate) => SEMVER_PATTERN.exec(candidate))
      .find((result) => result !== null);
    return match ? { version: match[1], commit: null } : UNKNOWN_VERSION;
  } catch {
    return UNKNOWN_VERSION;
  }
};

// The client injects one <script uuid="..." pluginName="..."> per plugin.
const findEntrypointUrl = (uuid: string): string | null => {
  const script = document.querySelector<HTMLScriptElement>(`script[uuid="${CSS.escape(uuid)}"]`);
  return script?.src || null;
};

export const formatPluginVersion = ({ version, commit }: PluginVersion): string | null => {
  if (!version) return null;
  return commit ? `${version} (build ${commit})` : version;
};

export const getLoadedPlugins = (): LoadedPlugin[] => Object
  .entries(window.bbb_plugins ?? {})
  .map(([uuid, pluginApi]) => {
    const entrypointUrl = findEntrypointUrl(uuid);
    return {
      uuid,
      name: pluginApi?.pluginName || uuid,
      entrypointUrl,
      ...(entrypointUrl ? extractVersionFromUrl(entrypointUrl) : UNKNOWN_VERSION),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));
