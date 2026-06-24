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
import { showActionsBarCommandExecutor } from './commands/showActionsBar';
import { hideActionsBarCommandExecutor } from './commands/hideActionsBar';
import { showNavBarCommandExecutor } from './commands/showNavBar';
import { hideNavBarCommandExecutor } from './commands/hideNavBar';
import { openPresentationCommandExecutor } from './commands/openPresentation';
import { closePresentationCommandExecutor } from './commands/closePresentation';
import { openSidekickCommandExecutor } from './commands/openSidekick';
import { closeSidekickCommandExecutor } from './commands/closeSidekick';
import { disableSelfViewCommandExecutor } from './commands/disableSelfView';
import { enableSelfViewCommandExecutor } from './commands/enableSelfView';
import { setCaptionsCommandExecutor } from './commands/setCaptions';
import { setSpeakerLevelCommandExecutor } from './commands/setSpeakerLevel';
import { setVideoVolumeCommandExecutor } from './commands/setVideoVolume';
import { notifyCommandExecutor } from './commands/notify';
import { enableNotificationsCommandExecutor } from './commands/enableNotifications';
import { disableNotificationsCommandExecutor } from './commands/disableNotifications';
import { setAwayCommandExecutor } from './commands/setAway';
import { setPresentCommandExecutor } from './commands/setPresent';
import { setLayoutCommandExecutor } from './commands/setLayout';
import { openChatFormCommandExecutor } from './commands/openChatForm';
import { fillChatFormCommandExecutor } from './commands/fillChatForm';
import { injectSidekickCommandExecutor } from './commands/injectSidekick';
import { injectMainCommandExecutor } from './commands/injectMain';
import { listGenericContentCommandExecutor } from './commands/listGenericContent';
import { removeGenericContentCommandExecutor } from './commands/removeGenericContent';
import { CommandConfig, CommandEntry } from './types';

export const COMMAND_PREFIX = '/';

export const VIEWER_ROLE = () => window?.meetingClientSettings?.public?.user?.role_viewer;
export const MODERATOR_ROLE = () => window?.meetingClientSettings?.public?.user?.role_moderator;

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
        .map((cmd: CommandEntry) => `- \`/${cmd.name}\` - ${cmd.description}`)
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
  showActionsBar: {
    name: 'showActionsBar',
    description: 'Show the actions bar',
    execute: (params) => (showActionsBarCommandExecutor(params)),
  },
  hideActionsBar: {
    name: 'hideActionsBar',
    description: 'Hide the actions bar',
    execute: (params) => (hideActionsBarCommandExecutor(params)),
  },
  showNavBar: {
    name: 'showNavBar',
    description: 'Show the navigation bar',
    execute: (params) => (showNavBarCommandExecutor(params)),
  },
  hideNavBar: {
    name: 'hideNavBar',
    description: 'Hide the navigation bar',
    execute: (params) => (hideNavBarCommandExecutor(params)),
  },
  openPresentation: {
    name: 'openPresentation',
    description: 'Open the presentation area',
    execute: (params) => (openPresentationCommandExecutor(params)),
  },
  closePresentation: {
    name: 'closePresentation',
    description: 'Close the presentation area',
    execute: (params) => (closePresentationCommandExecutor(params)),
  },
  openSidekick: {
    name: 'openSidekick',
    description: 'Open the sidekick panel',
    execute: (params) => (openSidekickCommandExecutor(params)),
  },
  closeSidekick: {
    name: 'closeSidekick',
    description: 'Close the sidekick panel',
    execute: (params) => (closeSidekickCommandExecutor(params)),
  },
  disableSelfView: {
    name: 'disableSelfView',
    description: 'Disable self-view for all cameras',
    execute: (params) => (disableSelfViewCommandExecutor(params)),
  },
  enableSelfView: {
    name: 'enableSelfView',
    description: 'Enable self-view for all cameras',
    execute: (params) => (enableSelfViewCommandExecutor(params)),
  },
  setCaptions: {
    name: 'setCaptions',
    description: 'Set audio captions language (Usage: /setCaptions <none|en|en-US|es|pt|pt-BR|fr|de>)',
    execute: (params) => (setCaptionsCommandExecutor(params)),
  },
  setSpeakerLevel: {
    name: 'setSpeakerLevel',
    description: 'Set conference speaker volume level (Usage: /setSpeakerLevel <0-1>)',
    execute: (params) => (setSpeakerLevelCommandExecutor(params)),
  },
  setVideoVolume: {
    name: 'setVideoVolume',
    description: 'Set external video volume (Usage: /setVideoVolume <0-1>)',
    execute: (params) => (setVideoVolumeCommandExecutor(params)),
  },
  notify: {
    name: 'notify',
    description: 'Send a UI notification (Usage: /notify <info|default|warning|success|error> <icon> <message>)',
    execute: (params) => (notifyCommandExecutor(params)),
  },
  enableNotifications: {
    name: 'enableNotifications',
    description: 'Enable UI notifications display',
    execute: (params) => (enableNotificationsCommandExecutor(params)),
  },
  disableNotifications: {
    name: 'disableNotifications',
    description: 'Disable UI notifications display',
    execute: (params) => (disableNotificationsCommandExecutor(params)),
  },
  setAway: {
    name: 'setAway',
    description: 'Set your status to away',
    execute: (params) => (setAwayCommandExecutor(params)),
  },
  setPresent: {
    name: 'setPresent',
    description: 'Set your status to present (not away)',
    execute: (params) => (setPresentCommandExecutor(params)),
  },
  setLayout: {
    name: 'setLayout',
    description: 'Set the enforced layout (Usage: /setLayout <SMART_LAYOUT|PRESENTATION_FOCUS|VIDEO_FOCUS|CAMERAS_ONLY|PRESENTATION_ONLY|PARTICIPANTS_AND_CHAT_ONLY|MEDIA_ONLY|CUSTOM_LAYOUT|PLUGINS_ONLY>)',
    execute: (params) => (setLayoutCommandExecutor(params)),
  },
  openChatForm: {
    name: 'openChatForm',
    description: 'Open the chat input form',
    execute: (params) => (openChatFormCommandExecutor(params)),
  },
  fillChatForm: {
    name: 'fillChatForm',
    description: 'Fill the chat input form with text (Usage: /fillChatForm <text>)',
    execute: (params) => (fillChatFormCommandExecutor(params)),
  },
  injectSidekick: {
    name: 'injectSidekick',
    description: 'Inject generic content (URL or HTML) to the sidekick area (Usage: /injectSidekick <url or html-content>)',
    execute: (params) => (injectSidekickCommandExecutor(params)),
  },
  injectMain: {
    name: 'injectMain',
    description: 'Inject generic content (URL or HTML) to the main presentation area (Usage: /injectMain <url or html-content>)',
    execute: (params) => (injectMainCommandExecutor(params)),
  },
  listGenericContent: {
    name: 'listGenericContent',
    description: 'List all currently injected generic contents (sidekick or main) with their IDs (Usage: /listGenericContent or /listGenericContent <sidekick|main>)',
    execute: (params) => (listGenericContentCommandExecutor(params)),
  },
  removeGenericContent: {
    name: 'removeGenericContent',
    description: 'Remove generic content by ID (Usage: /removeGenericContent <ID>) or by type (Usage: /removeGenericContent <sidekick|main> [ID]). Omit type to search in all areas.',
    execute: (params) => (removeGenericContentCommandExecutor(params)),
  },
};
