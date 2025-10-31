import { pluginLogger } from 'bigbluebutton-html-plugin-sdk';
import { CommandExecutor } from './types';
import { checkModeratorPermission, MODERATOR_ROLE } from '../service';

export const promoteAllCommandExecutor: CommandExecutor = ({
  mutation,
  currentUser,
  users,
  pluginApi,
}) => {
  if (!checkModeratorPermission('promoteAll', currentUser, pluginApi)) {
    return;
  }

  if (!mutation) {
    return;
  }

  const viewers = users.filter((user) => !user.isModerator);

  let promotedCount = 0;
  viewers.forEach((user) => {
    mutation({
      variables: {
        userId: user.userId,
        role: MODERATOR_ROLE(),
      },
    });
    promotedCount += 1;
  });

  pluginLogger.info(`Promoted ${promotedCount} viewers to moderators.`);
};
