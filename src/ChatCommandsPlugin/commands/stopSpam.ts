import { CommandExecutor } from './types';
import { clearAllSpamIntervals } from '../spamController';

export const stopSpamCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  const clearedCount = clearAllSpamIntervals();

  pluginApi.serverCommands?.chat.sendPublicChatMessage({
    textMessageInMarkdownFormat: `🛑 Spam parado. ${clearedCount} intervalos ativos foram limpos.`,
  });
};
