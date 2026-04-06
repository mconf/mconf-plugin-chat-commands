import React, { useEffect, useMemo, useRef } from 'react';
import { pluginLogger } from 'bigbluebutton-html-plugin-sdk';
import {
  ChatCommandPluginProps,
  SetRoleMutation,
  MutationMap,
} from './types';
import {
  DEFAULT_COMMANDS,
  COMMAND_PREFIX,
} from './service';
import { SET_ROLE } from './mutations';

export function ChatCommandPlugin({
  pluginApi,
  commands = DEFAULT_COMMANDS,
}: ChatCommandPluginProps): React.ReactElement | null {
  const loadedChatMessagesResponse = pluginApi.useLoadedChatMessages!();
  const usersBasicInfoResponse = pluginApi.useUsersBasicInfo!();
  const currentUserResponse = pluginApi.useCurrentUser!();
  const meetingInfoResponse = pluginApi.useMeeting!();
  const [setRole] = pluginApi.useCustomMutation!<SetRoleMutation>(SET_ROLE);
  const executedMessageIds = useRef<Set<string>>(new Set());

  const mutationMap: MutationMap = useMemo(() => ({
    [DEFAULT_COMMANDS.demote.name]: setRole,
    [DEFAULT_COMMANDS.demoteAll.name]: setRole,
    [DEFAULT_COMMANDS.promoteAll.name]: setRole,
  }), [setRole]);

  const currentUser = useMemo(() => {
    if (!currentUserResponse) return null;
    if (currentUserResponse.loading) return null;
    if (currentUserResponse.error || !currentUserResponse.data) {
      pluginLogger.error('Error loading current user', currentUserResponse.error);
      return null;
    }
    return currentUserResponse.data;
  }, [currentUserResponse]);

  const usersList = useMemo(() => {
    if (!usersBasicInfoResponse) return [];
    if (usersBasicInfoResponse.loading) return [];
    if (usersBasicInfoResponse.error || !usersBasicInfoResponse.data) {
      pluginLogger.error('Error loading user list', usersBasicInfoResponse.error);
      return [];
    }
    return usersBasicInfoResponse.data.user;
  }, [usersBasicInfoResponse]);

  const meeting = useMemo(() => {
    if (!meetingInfoResponse) return null;
    if (meetingInfoResponse.loading) return null;
    if (meetingInfoResponse.error || !meetingInfoResponse.data) {
      pluginLogger.error('Error loading meeting info', meetingInfoResponse.error);
      return null;
    }
    return meetingInfoResponse.data;
  }, [meetingInfoResponse]);

  const messages = useMemo(() => {
    if (!loadedChatMessagesResponse) return [];
    if (loadedChatMessagesResponse.loading) return [];
    if (loadedChatMessagesResponse.error || !loadedChatMessagesResponse.data) {
      pluginLogger.error('Error loading chat messages', loadedChatMessagesResponse.error);
      return [];
    }
    return loadedChatMessagesResponse.data;
  }, [loadedChatMessagesResponse]);

  useEffect(() => {
    if (!meeting) {
      pluginLogger.error('Meeting info is not available. Chat commands will not work.');
      return;
    }
    if (!usersList) {
      pluginLogger.error('User list is not available. Chat commands will not work.');
      return;
    }
    if (!currentUser) {
      pluginLogger.error('Current user info is not available. Chat commands will not work.');
      return;
    }

    if (messages) {
      messages.forEach(async (message) => {
        if (!message.message) return;
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
              meeting,
              senderId: message.senderUserId,
              pluginApi,
              args,
            });
            executedMessageIds.current.add(message.messageId);
          }
        }
      });
    }
  }, [messages, usersList, currentUser, commands, meeting]);

  return null;
}

export default ChatCommandPlugin;
