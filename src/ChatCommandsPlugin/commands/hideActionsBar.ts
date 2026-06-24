import { CommandExecutor } from './types';

export const hideActionsBarCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  pluginApi.uiCommands?.actionsBar.setDisplayActionBar({ displayActionBar: false });
};
