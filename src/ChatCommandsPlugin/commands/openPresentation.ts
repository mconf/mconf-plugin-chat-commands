import { CommandExecutor } from './types';

export const openPresentationCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  pluginApi.uiCommands?.presentationArea.open();
};
