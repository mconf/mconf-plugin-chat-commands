import { pluginLogger } from 'bigbluebutton-html-plugin-sdk';
import { CommandExecutor } from './types';
import { stopCustomJoinConnections } from './customJoin';

export const stopCustomJoinCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  pluginLogger.info('StopCustomJoin command executed');

  const connectionCount = stopCustomJoinConnections();

  if (connectionCount === 0) {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: '⚠️ No active custom join connections to stop.',
    });
  } else {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: `✅ Stopped ${connectionCount} custom join connection(s).`,
    });
  }
};
