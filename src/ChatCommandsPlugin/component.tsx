import React, { useEffect, useMemo, useRef } from 'react';
import { pluginLogger } from 'bigbluebutton-html-plugin-sdk';
import {
  CommandConfig,
  ChatCommandPluginProps,
  SetRoleMutation,
  MutationMap,
} from './types';
import { SET_ROLE } from './mutations';

const COMMAND_PREFIX = '/';

const VIEWER_ROLE = () => window.meetingClientSettings.public.user.role_viewer;
const MODERATOR_ROLE = () => window.meetingClientSettings.public.user.role_moderator;

const DEFAULT_COMMANDS: CommandConfig = {
  demote: {
    name: 'demote',
    description: 'Demote all users to viewers except the sender',
    execute: ({
      currentUser,
      users,
      senderId,
      mutation,
    }) => {
      if (!currentUser || currentUser.role !== MODERATOR_ROLE()) {
        pluginLogger.warn('Current user is not a moderator. Cannot execute demote command.');
        return;
      }
      users
        .filter((user) => user.userId !== senderId && user.isModerator)
        .map((user) => mutation({
          variables: {
            userId: user.userId,
            role: VIEWER_ROLE(),
          },
        }));
    },
  },
};

export function ChatCommandPlugin({
  pluginApi,
  commands = DEFAULT_COMMANDS,
}: ChatCommandPluginProps): React.ReactElement {
  const loadedChatMessagesResponse = pluginApi.useLoadedChatMessages();
  const usersBasicInfoResponse = pluginApi.useUsersBasicInfo();
  const currentUserResponse = pluginApi.useCurrentUser();
  const [setRole] = pluginApi.useCustomMutation<SetRoleMutation>(SET_ROLE);
  const executedMessageIds = useRef<Set<string>>(new Set());

  const mutationMap: MutationMap = useMemo(() => ({
    [DEFAULT_COMMANDS.demote.name]: setRole,
  }), [setRole]);

  const currentUser = useMemo(() => {
    if (currentUserResponse.loading) return null;
    if (currentUserResponse.error || !currentUserResponse.data) {
      pluginLogger.error('Error loading current user', currentUserResponse.error);
      return null;
    }
    return currentUserResponse.data;
  }, [currentUserResponse]);

  const usersList = useMemo(() => {
    if (usersBasicInfoResponse.loading) return [];
    if (usersBasicInfoResponse.error || !usersBasicInfoResponse.data) {
      pluginLogger.error('Error loading user list', usersBasicInfoResponse.error);
      return [];
    }
    return usersBasicInfoResponse.data.user;
  }, [usersBasicInfoResponse]);

  const messages = useMemo(() => {
    if (loadedChatMessagesResponse.loading) return [];
    if (loadedChatMessagesResponse.error || !loadedChatMessagesResponse.data) {
      pluginLogger.error('Error loading chat messages', loadedChatMessagesResponse.error);
      return [];
    }
    return loadedChatMessagesResponse.data;
  }, [loadedChatMessagesResponse]);

  useEffect(() => {
    if (messages && usersList && currentUser) {
      messages.forEach(async (message) => {
        if (message.message.startsWith(COMMAND_PREFIX)
          && message.senderUserId === currentUser.userId
          && !executedMessageIds.current.has(message.messageId)) {
          const [cmd, ...args] = message.message.slice(1).split(' ');
          if (commands[cmd]) {
            pluginLogger.info(`Executing command: ${cmd} with args: ${args.join(', ')}`);
            commands[cmd].execute({
              mutation: mutationMap[cmd],
              currentUser,
              users: usersList,
              senderId: message.senderUserId,
              args,
            });
            executedMessageIds.current.add(message.messageId);
          }
        }
      });
    }
  }, [messages, usersList, currentUser, commands]);

  return null;
}

export default ChatCommandPlugin;
