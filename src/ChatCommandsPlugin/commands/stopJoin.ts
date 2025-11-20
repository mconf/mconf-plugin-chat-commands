import { CommandExecutor } from './types';
import { stopJoinConnections } from './join';

export const stopJoinCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  const terminatedCount = stopJoinConnections(pluginApi);

  pluginApi.serverCommands?.chat.sendPublicChatMessage({
    textMessageInMarkdownFormat: `🛑 Terminated ${terminatedCount} active WebSocket connections.`,
  });
};
