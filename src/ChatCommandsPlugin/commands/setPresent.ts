import { CommandExecutor } from './types';

export const setPresentCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  pluginApi.uiCommands?.userStatus.setAwayStatus({ away: false });
};
