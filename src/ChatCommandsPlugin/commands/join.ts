import { PluginApi, pluginLogger } from 'bigbluebutton-html-plugin-sdk';
import { v4 as uuid } from 'uuid';
import { CommandExecutor } from './types';
import {
  userJoinMutation,
  CURRENT_USER_SUBSCRIPTION,
  extractGraphQLWebSocketUrl,
  createWebSocketConnection,
  setupConnectionMonitoring,
  MonitoredApolloClient,
} from './commons';

// Store active connections to manage them
const activeConnections: MonitoredApolloClient[] = [];

export const joinCommandExecutor: CommandExecutor = async ({ pluginApi, args }) => {
  // Parse verbose flag
  const verbose = args.includes('-v');
  const filteredArgs = args.filter((arg) => arg !== '-v');

  pluginLogger.info('Join command executed', { args: filteredArgs, verbose });

  // Helper function to send public messages only in verbose mode
  const sendPublicMessage = (message: string) => {
    if (verbose) {
      pluginApi.serverCommands?.chat.sendPublicChatMessage({
        textMessageInMarkdownFormat: message,
      });
    }
    pluginLogger.info('Join progress', { message, verbose });
  };

  if (!filteredArgs || filteredArgs.length < 2) {
    const usageMessage = 'Usage: `/join <join-url> <number_of_users> [-v]`\nExample: `/join "https://bbb.example.com/bigbluebutton/api/join?..." 10 -v`\n\n⚠️ **Note:** Use quotes around URLs with special characters.\n**-v**: Verbose mode (shows progress messages)';
    sendPublicMessage(usageMessage);
    pluginLogger.warn('Invalid arguments for join command', { filteredArgs });
    return;
  }

  // Parse URL and number of users, handling URLs with special characters
  let joinUrl: string;
  let numberOfUsers: number;

  const fullArgsString = filteredArgs.join(' ');

  // Check if URL is quoted
  const quotedMatch = fullArgsString.match(/^"([^"]*)"(.*)$/);
  if (quotedMatch) {
    // URL is quoted: /join "https://example.com/join?..." 10
    const [, quotedUrl] = quotedMatch;
    joinUrl = quotedUrl;
    const remainingArgs = quotedMatch[2].trim().split(' ').filter((arg) => arg.length > 0);
    if (remainingArgs.length === 0) {
      sendPublicMessage('Missing number of users after quoted URL.');
      return;
    }
    numberOfUsers = parseInt(remainingArgs[0], 10);
  } else {
    // URL is not quoted - find the last number as user count
    const lastArg = filteredArgs[filteredArgs.length - 1];
    const parsedNumber = parseInt(lastArg, 10);

    if (Number.isNaN(parsedNumber)) {
      sendPublicMessage('Invalid format. Use: `/join <join-url> <number_of_users> [-v]` or `/join "<join-url>" <number_of_users> [-v]`');
      return;
    }

    numberOfUsers = parsedNumber;
    // Everything except the last argument is the URL
    joinUrl = filteredArgs.slice(0, -1).join(' ');
  }

  if (Number.isNaN(numberOfUsers) || numberOfUsers < 1) {
    pluginApi.serverCommands.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: 'Invalid number of users. It must be a positive integer.',
    });
    return;
  }

  // Validate BigBlueButton join URL format
  const graphqlWebsocketUrl = extractGraphQLWebSocketUrl(joinUrl);
  if (!graphqlWebsocketUrl) {
    sendPublicMessage('Invalid BigBlueButton join URL format. Must be a valid HTTP/HTTPS URL.');
    return;
  }

  sendPublicMessage(`✅ Starting GraphQL WebSocket connections for ${numberOfUsers} users...\nWebSocket URL: ${graphqlWebsocketUrl}`);

  try {
    // Function to create a single WebSocket connection
    const createUserConnection = async (userIndex: number): Promise<MonitoredApolloClient> => {
      // Fetch session token for this specific user
      sendPublicMessage(`🔄 User ${userIndex + 1}: Fetching session token...`);

      let sessionToken: string;
      try {
        const response = await fetch(joinUrl, {
          method: 'GET',
          redirect: 'follow',
          mode: 'cors',
        });

        if (response.ok) {
          const finalUrl = response.url;
          const finalUrlObj = new URL(finalUrl);
          const urlSessionToken = finalUrlObj.searchParams.get('sessionToken');

          if (urlSessionToken) {
            sessionToken = urlSessionToken;
            sendPublicMessage(`✅ User ${userIndex + 1}: Session token obtained\n🔑 Session Token: ${sessionToken}`);
            pluginLogger.info('Session token obtained', {
              userIndex: userIndex + 1,
              sessionToken,
              joinUrl: `${joinUrl.substring(0, 50)}...`,
            });
          } else {
            throw new Error('No session token found in final URL after redirect');
          }
        } else {
          throw new Error(`Join request failed with status ${response.status}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        sendPublicMessage(`❌ User ${userIndex + 1}: Failed to fetch session token: ${errorMessage}`);
        throw error; // Re-throw to stop this user's connection
      }

      // Create unique client session UUID for each simulated user
      const userClientUUID = uuid();

      // Create WebSocket connection using common module
      const client = createWebSocketConnection(graphqlWebsocketUrl, sessionToken, userClientUUID);

      // Set up connection monitoring using common module
      setupConnectionMonitoring(client, userIndex, (idx) => {
        sendPublicMessage(`⚠️ User ${idx + 1} connection may be stale (no messages received)`);
      });

      // Wait for authToken from user_current subscription and execute mutation when received
      let authTokenProcessed = false;

      client.subscribe({
        query: CURRENT_USER_SUBSCRIPTION,
      }).subscribe({
        next: async (result: {
          data?: {
            user_current?: {
              authToken?: string;
              userId?: string;
              name?: string;
              role?: string;
              joined?: boolean;
            }[]
          }
        }) => {
          if (result.data?.user_current[0]?.authToken && !authTokenProcessed) {
            authTokenProcessed = true;

            const userAuthToken = result.data.user_current[0].authToken;
            sendPublicMessage(`✅ User ${userIndex + 1} authToken received\n🔐 Auth Token: ${userAuthToken}`);
            pluginLogger.info('AuthToken received for user', {
              userIndex: userIndex + 1,
              authToken: userAuthToken,
              userId: result.data.user_current[0].userId,
              name: result.data.user_current[0].name,
              role: result.data.user_current[0].role,
              joined: result.data.user_current[0].joined,
            });

            try {
              await client.mutate({
                mutation: userJoinMutation,
                variables: {
                  authToken: userAuthToken,
                  clientType: 'HTML5',
                  clientIsMobile: false,
                },
              });

              sendPublicMessage(`✅ User ${userIndex + 1} joined meeting via mutation\n🔐 Auth Token: ${userAuthToken}\n👤 User ID: ${result.data.user_current[0].userId}\n📛 Name: ${result.data.user_current[0].name}\n👑 Role: ${result.data.user_current[0].role}`);
              pluginLogger.info('User join mutation successful', {
                userIndex: userIndex + 1,
                authToken: userAuthToken,
                clientType: 'HTML5',
                clientIsMobile: false,
              });
            } catch (joinError) {
              const errorMsg = joinError instanceof Error
                ? joinError.message
                : JSON.stringify(joinError);
              sendPublicMessage(`⚠️ User ${userIndex + 1} join mutation failed, but continuing`);
              pluginLogger.warn('User join mutation failed', {
                userIndex: userIndex + 1,
                error: errorMsg,
                authToken: userAuthToken,
              });
            }
          }
        },
        error: () => {
          sendPublicMessage(`⚠️ User ${userIndex + 1} authToken subscription error`);
        },
      });

      activeConnections.push(client);

      return client;
    };

    // Create connections in batches to avoid overwhelming the server
    const processBatch = async (startIndex: number, batchSize: number) => {
      const promises = [];
      const endIndex = Math.min(startIndex + batchSize, numberOfUsers);

      for (let i = startIndex; i < endIndex; i += 1) {
        promises.push(createUserConnection(i));
      }

      try {
        await Promise.all(promises);

        // Process next batch if there are more users
        if (endIndex < numberOfUsers) {
          setTimeout(
            () => processBatch(endIndex, batchSize),
            1000,
          ); // 1 second delay between batches
        } else {
          // All connections established
          const activeCount = activeConnections.length;
          pluginApi.serverCommands?.chat.sendPublicChatMessage({
            textMessageInMarkdownFormat: `📊 GraphQL WebSocket connections completed:\n✅ Active connections: ${activeCount}\n🔗 All connections established and maintained.\n\n💡 Use \`/stopJoin\` to terminate all connections.`,
          });
        }
      } catch (error) {
        pluginApi.serverCommands?.chat.sendPublicChatMessage({
          textMessageInMarkdownFormat: '❌ Failed to establish some connections.',
        });
      }
    };

    // Start processing with batches of 3 users
    processBatch(0, 3);
  } catch (importError) {
    sendPublicMessage('❌ Failed to load Apollo Client libraries. Make sure dependencies are properly installed.');
  }
};

// Function to stop all active connections
export const stopJoinConnections = (pluginApi: PluginApi): number => {
  const connectionCount = activeConnections.length;
  pluginLogger.info('Stopping join connections', { connectionCount });

  activeConnections.forEach((client) => {
    try {
      // Clear the monitoring interval
      if (client.monitorInterval) {
        clearInterval(client.monitorInterval);
      }

      // Terminate the WebSocket connection
      if (client.wsClient) {
        setTimeout(() => {
          client.wsClient?.terminate();
          client.wsClient?.dispose();
          pluginLogger.info('WebSocket connection terminated successfully');
        }, 1000);
      }
    } catch (error) {
      pluginApi?.serverCommands?.chat.sendPublicChatMessage({
        textMessageInMarkdownFormat: `❌ Error terminating WebSocket connection: ${error}`,
      });
      pluginLogger.error('Error terminating WebSocket connection', {
        error: error instanceof Error ? error.message : JSON.stringify(error),
      });
    }
  });

  activeConnections.length = 0; // Clear the array

  pluginLogger.info('All join connections stopped', { connectionsTerminated: connectionCount });
  return connectionCount;
};
