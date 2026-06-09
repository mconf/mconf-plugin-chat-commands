import { pluginLogger, NotificationTypeUiCommand } from 'bigbluebutton-html-plugin-sdk';
import { CommandExecutor } from './types';

const VALID_TYPES = Object.values(NotificationTypeUiCommand) as string[];

export const notifyCommandExecutor: CommandExecutor = ({ pluginApi, args }) => {
  if (!args || args.length < 3) {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: `❌ **Usage**: \`/notify <type> <icon> <message>\`\nTypes: ${VALID_TYPES.join(', ')}`,
    });
    return;
  }

  const [typeArg, icon, ...messageParts] = args;
  const message = messageParts.join(' ');

  if (!VALID_TYPES.includes(typeArg)) {
    pluginLogger.warn(`Unknown notification type: ${typeArg}`);
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: `❌ **Unknown type**: \`${typeArg}\`. Valid types: ${VALID_TYPES.join(', ')}`,
    });
    return;
  }

  pluginApi.uiCommands?.notification.send({
    message,
    icon,
    type: typeArg as NotificationTypeUiCommand,
  });
};
