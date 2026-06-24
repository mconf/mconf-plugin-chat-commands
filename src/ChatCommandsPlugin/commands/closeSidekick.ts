import { CommandExecutor } from './types';

export const closeSidekickCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  pluginApi.uiCommands?.sidekickArea.options.panel.close();
};
