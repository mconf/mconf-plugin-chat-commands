import { CurrentUserData, PluginApi } from 'bigbluebutton-html-plugin-sdk';
import pluginLogger from 'bigbluebutton-html-plugin-sdk/dist/cjs/utils/logger/logger';
import { demoteCommandExecutor } from './commands/demote';
import { demoteAllCommandExecutor } from './commands/demoteAll';
import { promoteAllCommandExecutor } from './commands/promoteAll';
import { spamCommandExecutor } from './commands/spam';
import { stopSpamCommandExecutor } from './commands/stopSpam';
import { debugCommandExecutor } from './commands/debug';
import { joinCommandExecutor } from './commands/join';
import { stopJoinCommandExecutor } from './commands/stopJoin';
import { customJoinCommandExecutor } from './commands/customJoin';
import { stopCustomJoinCommandExecutor } from './commands/stopCustomJoin';
import { CommandConfig } from './types';

export const COMMAND_PREFIX = '/';

export const VIEWER_ROLE = () => window.meetingClientSettings.public.user.role_viewer;
export const MODERATOR_ROLE = () => window.meetingClientSettings.public.user.role_moderator;

export const checkModeratorPermission = (
  commandName: string,
  currentUser: CurrentUserData | null,
  pluginApi: PluginApi,
): boolean => {
  if (!currentUser || currentUser.role !== MODERATOR_ROLE()) {
    pluginLogger.warn(`Current user is not a moderator. Cannot execute ${commandName} command.`);
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: `❌ **Permission denied**: You need moderator privileges to use \`/${commandName}\` command.`,
    });
    return false;
  }
  return true;
};

export const DEFAULT_COMMANDS: CommandConfig = {
  list: {
    name: 'list',
    description: 'List all available commands',
    execute: ({ pluginApi }) => {
      const commandList = Object.values(DEFAULT_COMMANDS)
        .map((cmd) => `- \`/${cmd.name}\` - ${cmd.description}`)
        .join('\n');
      pluginApi.serverCommands?.chat.sendPublicChatMessage({
        textMessageInMarkdownFormat: `**Available Commands:**\n${commandList}`,
      });
    },
  },
  demote: {
    name: 'demote',
    description: 'Demote yourself to viewer (Requires moderator privileges)',
    execute: (params) => (demoteCommandExecutor(params)),
  },
  demoteAll: {
    name: 'demoteAll',
    description: 'Demote all users to viewers except the sender (Requires moderator privileges)',
    execute: (params) => (demoteAllCommandExecutor(params)),
  },
  promoteAll: {
    name: 'promoteAll',
    description: 'Promote all users to moderators except the sender (Requires moderator privileges)',
    execute: (params) => (promoteAllCommandExecutor(params)),
  },
  spam: {
    name: 'spam',
    description: 'Spam a message X times or with interval Y (Usage: /spam "message with spaces" [times] or /spam "message" interval <ms>)',
    execute: (params) => (spamCommandExecutor(params)),
  },
  stopSpam: {
    name: 'stopSpam',
    description: 'Stop all active spam intervals',
    execute: (params) => (stopSpamCommandExecutor(params)),
  },
  debug: {
    name: 'debug',
    description: 'Show detailed debug information about the session and environment',
    execute: (params) => (debugCommandExecutor(params)),
  },
  join: {
    name: 'join',
    description: 'Simulate multiple users joining by making join requests and establishing WebSocket connections (Usage: /join <join-url> <number_of_users>)',
    execute: (params) => (joinCommandExecutor(params)),
  },
  stopJoin: {
    name: 'stopJoin',
    description: 'Stop all active WebSocket connections created by the /join command',
    execute: (params) => (stopJoinCommandExecutor(params)),
  },
  customJoin: {
    name: 'customJoin',
    description: '⚠️ Generate custom join URLs with server secret (SECURITY WARNING: Exposes secret!) - Usage: /customJoin --secret "SECRET" --pw "PASSWORD" <count>',
    execute: (params) => (customJoinCommandExecutor(params)),
  },
  stopCustomJoin: {
    name: 'stopCustomJoin',
    description: 'Stop all active WebSocket connections created by the /customJoin command',
    execute: (params) => (stopCustomJoinCommandExecutor(params)),
  },
};
