import { pluginLogger } from 'bigbluebutton-html-plugin-sdk';
import { CommandExecutor } from './types';
import { checkModeratorPermission, VIEWER_ROLE } from '../service';

export const demoteCommandExecutor: CommandExecutor = ({
  mutation,
  currentUser,
  senderId,
  pluginApi,
}) => {
  if (!checkModeratorPermission('demote', currentUser, pluginApi)) {
    return;
  }

  if (mutation) {
    mutation({
      variables: {
        userId: senderId,
        role: VIEWER_ROLE(),
      },
    });
  }

  pluginLogger.info('Você foi removido da posição de moderador.');
};
