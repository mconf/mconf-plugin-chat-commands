import { getLoadedPlugins, LoadedPlugin } from './commons/loadedPlugins';
import { CommandExecutor } from './types';

const formatPlugin = (plugin: LoadedPlugin, index: number): string => {
  const version = plugin.version ? `\`${plugin.version}\`` : 'unknown version';
  const entrypoint = plugin.entrypointUrl ? `\`${plugin.entrypointUrl}\`` : 'entrypoint not found';
  return `${index + 1}. **${plugin.name}** - ${version}\n   ${entrypoint}`;
};

export const listPluginsCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  const plugins = getLoadedPlugins();

  const message = plugins.length === 0
    ? 'ℹ️ No plugins found in `window.bbb_plugins`.'
    : `**Loaded Plugins (${plugins.length}):**\n${plugins.map(formatPlugin).join('\n')}`;

  pluginApi.serverCommands?.chat.sendPublicChatMessage({
    textMessageInMarkdownFormat: message,
  });
};
