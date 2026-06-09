import { CommandExecutor } from './types';

export const disableSelfViewCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  pluginApi.uiCommands?.camera.setSelfViewDisableAllDevices({ isSelfViewDisabledAllDevices: true });
};
