import { pluginLogger } from 'bigbluebutton-html-plugin-sdk';
import { CommandExecutor } from './types';
import { checkModeratorPermission, VIEWER_ROLE } from '../service';

export const demoteAllCommandExecutor: CommandExecutor = ({
  mutation,
  currentUser,
  users,
  senderId,
  pluginApi,
}) => {
  if (!checkModeratorPermission('demoteAll', currentUser, pluginApi)) {
    return;
  }

  if (!mutation) {
    return;
  }

  const otherModerators = users.filter(
    (user) => user.isModerator && user.userId !== senderId,
  );

  let demotedCount = 0;
  otherModerators.forEach((user) => {
    mutation({
      variables: {
        userId: user.userId,
        role: VIEWER_ROLE(),
      },
    });
    demotedCount += 1;
  });

  pluginLogger.info(`${demotedCount} moderadores foram demovidos a viewers.`);
};
