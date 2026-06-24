import { pluginLogger, EnforcedLayoutTypeEnum } from 'bigbluebutton-html-plugin-sdk';
import { CommandExecutor } from './types';

const VALID_LAYOUTS = Object.values(EnforcedLayoutTypeEnum) as string[];

export const setLayoutCommandExecutor: CommandExecutor = ({ pluginApi, args }) => {
  const layoutArg = args?.[0];

  if (!layoutArg) {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: `❌ **Usage**: \`/setLayout <type>\`\nOptions: ${VALID_LAYOUTS.join(', ')}`,
    });
    return;
  }

  const layoutType = VALID_LAYOUTS.find(
    (l) => l.toLowerCase() === layoutArg.toLowerCase(),
  ) as EnforcedLayoutTypeEnum | undefined;

  if (!layoutType) {
    pluginLogger.warn(`Unknown layout type: ${layoutArg}`);
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: `❌ **Unknown layout**: \`${layoutArg}\`. Options: ${VALID_LAYOUTS.join(', ')}`,
    });
    return;
  }

  pluginApi.uiCommands?.layout.setEnforcedLayout(layoutType);
};
