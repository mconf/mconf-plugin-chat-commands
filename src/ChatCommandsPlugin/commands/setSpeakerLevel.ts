import { pluginLogger } from 'bigbluebutton-html-plugin-sdk';
import { CommandExecutor } from './types';

export const setSpeakerLevelCommandExecutor: CommandExecutor = ({ pluginApi, args }) => {
  const levelStr = args?.[0];
  const level = levelStr !== undefined ? parseFloat(levelStr) : NaN;

  if (Number.isNaN(level) || level < 0 || level > 1) {
    pluginLogger.warn(`Invalid speaker level: ${levelStr}. Must be a number between 0 and 1.`);
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: `❌ **Invalid level**: \`${levelStr}\`. Usage: \`/setSpeakerLevel <0-1>\``,
    });
    return;
  }

  pluginApi.uiCommands?.conference.setSpeakerLevel({ level });
};
