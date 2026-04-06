import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { TriggerMutationFunction } from 'bigbluebutton-html-plugin-sdk/dist/cjs/data-creation/types';
import { CommandExecuteParams } from './commands/types';

declare global {
  interface Window {
    meetingClientSettings?: {
      public: {
        app: {
          bbbWebBase: string;
        };
        user?: {
          role_viewer: string;
          role_moderator: string;
        };
      };
    };
  }
}

export interface ChatMentionProps {
  pluginApi: PluginApi;
}

export interface SetRoleMutation {
  userId: string;
  role: string;
}

export type PluginMutationVariables = SetRoleMutation;

export interface MutationMap {
  [key: string]: TriggerMutationFunction<PluginMutationVariables> | null
}

export interface CommandEntry {
  name: string;
  description: string;
  execute: (params: CommandExecuteParams) => void;
}

export type CommandConfig = {
  [command: string]: CommandEntry;
};

export interface ChatCommandPluginProps extends ChatMentionProps {
  commands?: CommandConfig;
}
