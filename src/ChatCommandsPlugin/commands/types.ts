import { PluginApi, CurrentUserData, UsersBasicInfoData } from 'bigbluebutton-html-plugin-sdk';
import { TriggerMutationFunction } from 'bigbluebutton-html-plugin-sdk/dist/cjs/data-creation/types';

export interface CommandExecuteParams {
  mutation?: TriggerMutationFunction<unknown>;
  currentUser: CurrentUserData;
  users: UsersBasicInfoData[];
  senderId: string;
  pluginApi: PluginApi;
  args?: string[];
}

export type CommandExecutor = (params: CommandExecuteParams) => void;
