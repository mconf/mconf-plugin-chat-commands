import { CommandExecutor } from './types';

export const disableNotificationsCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  pluginApi.uiCommands?.notification.setEnabledDisplayNotifications(false);
};
