import { CommandExecutor } from './types';

export const closePresentationCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  pluginApi.uiCommands?.presentationArea.close();
};
