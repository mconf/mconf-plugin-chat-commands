import { CommandExecutor } from './types';

export const fillChatFormCommandExecutor: CommandExecutor = ({ pluginApi, args }) => {
  const text = args?.join(' ') ?? '';
  pluginApi.uiCommands?.chat.form.fill({ text });
};
