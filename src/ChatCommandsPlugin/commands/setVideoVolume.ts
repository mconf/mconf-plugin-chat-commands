import { pluginLogger } from 'bigbluebutton-html-plugin-sdk';
import { CommandExecutor } from './types';

export const setVideoVolumeCommandExecutor: CommandExecutor = ({ pluginApi, args }) => {
  const volumeStr = args?.[0];
  const volume = volumeStr !== undefined ? parseFloat(volumeStr) : NaN;

  if (Number.isNaN(volume) || volume < 0 || volume > 1) {
    pluginLogger.warn(`Invalid video volume: ${volumeStr}. Must be a number between 0 and 1.`);
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: `❌ **Invalid volume**: \`${volumeStr}\`. Usage: \`/setVideoVolume <0-1>\``,
    });
    return;
  }

  pluginApi.uiCommands?.externalVideo.volume.set({ volume });
};
