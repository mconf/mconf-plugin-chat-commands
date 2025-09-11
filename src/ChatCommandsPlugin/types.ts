import { CurrentUserData, PluginApi, UsersBasicInfoData } from 'bigbluebutton-html-plugin-sdk';
import { TriggerMutationFunction } from 'bigbluebutton-html-plugin-sdk/dist/cjs/data-creation/types';

declare global {
  interface Window {
    meetingClientSettings: {
      public: {
        user: {
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

export interface MutationMap {
  [key: string]: TriggerMutationFunction<unknown>;
}

export type CommandConfig = {
  [command: string]: {
    name: string;
    description: string;
    execute: (params: {
      mutation: TriggerMutationFunction<unknown>;
      currentUser: CurrentUserData;
      users: UsersBasicInfoData[];
      senderId: string;
      args?: string[];
    }) => void;
  };
};

export interface ChatCommandPluginProps extends ChatMentionProps {
  commands?: CommandConfig;
}
