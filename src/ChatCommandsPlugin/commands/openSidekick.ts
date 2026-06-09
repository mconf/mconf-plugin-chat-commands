import { CommandExecutor } from './types';

export const openSidekickCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  pluginApi.uiCommands?.sidekickArea.options.panel.open();
};
