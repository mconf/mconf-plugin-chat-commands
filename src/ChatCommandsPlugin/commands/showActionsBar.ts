import { CommandExecutor } from './types';

export const showActionsBarCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  pluginApi.uiCommands?.actionsBar.setDisplayActionBar({ displayActionBar: true });
};
