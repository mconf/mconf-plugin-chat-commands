import { CommandExecutor } from './types';

export const enableNotificationsCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  pluginApi.uiCommands?.notification.setEnabledDisplayNotifications(true);
};
