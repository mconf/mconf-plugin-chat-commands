import { CommandExecutor } from './types';

export const showNavBarCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  pluginApi.uiCommands?.navBar.setDisplayNavBar({ displayNavBar: true });
};
