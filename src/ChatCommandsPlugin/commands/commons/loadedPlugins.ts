const SEMVER_PATTERN = /^v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/;

export interface LoadedPlugin {
  uuid: string;
  name: string;
  entrypointUrl: string | null;
  version: string | null;
}

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

// The SDK exposes no plugin version, so the only hint is a semver-looking
// directory or query value in the bundle URL (e.g. /plugins/foo/1.2.0/Foo.js).
const extractVersionFromUrl = (src: string): string | null => {
  try {
    const url = new URL(src, window.location.href);
    const directories = url.pathname.split('/').slice(0, -1);
    const candidates = [...directories, ...url.searchParams.values()].map(safeDecode);
    const match = candidates
      .map((candidate) => SEMVER_PATTERN.exec(candidate))
      .find((result) => result !== null);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

// The client injects one <script uuid="..." pluginName="..."> per plugin.
const findEntrypointUrl = (uuid: string): string | null => {
  const script = document.querySelector<HTMLScriptElement>(`script[uuid="${CSS.escape(uuid)}"]`);
  return script?.src || null;
};

export const getLoadedPlugins = (): LoadedPlugin[] => Object
  .entries(window.bbb_plugins ?? {})
  .map(([uuid, pluginApi]) => {
    const entrypointUrl = findEntrypointUrl(uuid);
    return {
      uuid,
      name: pluginApi?.pluginName || uuid,
      entrypointUrl,
      version: entrypointUrl ? extractVersionFromUrl(entrypointUrl) : null,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));
