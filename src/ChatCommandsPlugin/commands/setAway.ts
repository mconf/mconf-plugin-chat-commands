import { CommandExecutor } from './types';

export const setAwayCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  pluginApi.uiCommands?.userStatus.setAwayStatus({ away: true });
};
