import { CommandExecutor } from './types';

export const enableSelfViewCommandExecutor: CommandExecutor = ({ pluginApi }) => {
  pluginApi.uiCommands?.camera.setSelfViewDisableAllDevices({
    isSelfViewDisabledAllDevices: false,
  });
};
