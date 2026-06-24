import { CommandExecutor } from './types';

export const openChatFormCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  pluginApi.uiCommands?.chat.form.open();
};
