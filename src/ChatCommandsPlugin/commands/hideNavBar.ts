import { CommandExecutor } from './types';

export const hideNavBarCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  pluginApi.uiCommands?.navBar.setDisplayNavBar({ displayNavBar: false });
};
