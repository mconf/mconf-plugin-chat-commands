import { pluginLogger } from 'bigbluebutton-html-plugin-sdk';
import { v4 as uuid } from 'uuid';
import { faker } from '@faker-js/faker';
import { CommandExecutor } from './types';
import {
  userJoinMutation,
  CURRENT_USER_SUBSCRIPTION,
  extractGraphQLWebSocketUrl,
  createWebSocketConnection,
  setupConnectionMonitoring,
  MonitoredApolloClient,
} from './commons';

// Store active connections for this command
const activeCustomJoinConnections: MonitoredApolloClient[] = [];

/**
 * Builds query string from parameters (sorted alphabetically)
 * Encodes values properly for BBB API (spaces as +, keep other special chars encoded)
 */
function buildQuery(params: Record<string, string>): string {
  const keys = Object.keys(params).sort();
  return keys.map((key) => {
    // Encode the value and replace spaces with +
    const encodedValue = encodeURIComponent(params[key]).replace(/%20/g, '+');
    return `${key}=${encodedValue}`;
  }).join('&');
}

/**
 * Calculates SHA-1 checksum for BigBlueButton API call
 */
async function calculateChecksum(
  callName: string,
  queryString: string,
  secret: string,
): Promise<string> {
  const data = callName + queryString + secret;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-1', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a random full name using faker library
 */
function generateRandomName(): string {
  return faker.person.fullName();
}

/**
 * Generates a BigBlueButton join URL with checksum
 */
async function generateJoinURL(
  host: string,
  meetingID: string,
  fullName: string,
  password: string,
  secret: string,
  userdata?: string,
): Promise<string> {
  const params: Record<string, string> = {
    fullName,
    meetingID,
    password,
    redirect: 'true',
  };

  // Parse userdata as key=value pairs and add them as individual parameters
  if (userdata) {
    const pairs = userdata.split(',');
    pairs.forEach((pair) => {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[key.trim()] = value.trim();
      }
    });
  }

  const queryString = buildQuery(params);
  const checksum = await calculateChecksum('join', queryString, secret);

  return `${host}/bigbluebutton/api/join?${queryString}&checksum=${checksum}`;
}

export const customJoinCommandExecutor: CommandExecutor = async ({
  pluginApi,
  args,
  meeting,
}) => {
  const verbose = args.includes('-v');
  const filteredArgs = args.filter((arg) => arg !== '-v');

  pluginLogger.info('CustomJoin command executed', { args: filteredArgs, verbose });

  const sendPublicMessage = (message: string) => {
    if (verbose) {
      pluginApi.serverCommands?.chat.sendPublicChatMessage({
        textMessageInMarkdownFormat: message,
      });
    }
    pluginLogger.info('CustomJoin progress', { message, verbose });
  };

  // Parse command arguments
  const parsedArgs: Record<string, string> = {};
  let count: number | undefined;
  let i = 0;
  while (i < filteredArgs.length) {
    const arg = filteredArgs[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      i += 1;
      if (i < filteredArgs.length && !filteredArgs[i].startsWith('--')) {
        // Remove surrounding quotes if present
        let value = filteredArgs[i];
        if ((value.startsWith('"') && value.endsWith('"'))
            || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        parsedArgs[key] = value;
        i += 1;
      } else {
        parsedArgs[key] = 'true';
      }
    } else {
      // Positional argument - treat as count
      const parsedCount = parseInt(arg, 10);
      if (!Number.isNaN(parsedCount)) {
        count = parsedCount;
      }
      i += 1;
    }
  }

  // Validate required parameters
  if (!parsedArgs.secret || !parsedArgs.pw || !count) {
    const usageMessage = `⚠️ **SECURITY WARNING**: This command exposes your BBB server secret. Use only in secure environments!

**Usage:** \`/customJoin --secret "SECRET" --pw "PASSWORD" <count> [options]\`

**Required:**
- \`--secret\`: BigBlueButton server shared secret (⚠️ SENSITIVE!)
- \`--pw\`: Meeting password (use attendee password for viewers, moderator password for moderators)
- \`<count>\`: Number of users to join (positive integer)

**Optional:**
- \`--host\`: BBB server URL (default: current window origin)
- \`--meetingID\`: Meeting ID (default: current meeting ID)
- \`--userdata "key1=value1,key2=value2"\`: Custom userdata
- \`-v\`: Verbose mode (shows progress)

**Examples:**
\`\`\`
# Join 3 viewers with current host/meetingID
/customJoin --secret "SECRET" --pw "attendeePass" 3 -v

# Join 5 users to different meeting
/customJoin --secret "SECRET" --host "https://bbb.example.com" --meetingID "room123" --pw "attendeePass" 5

# Join 2 moderators with custom userdata
/customJoin --secret "SECRET" --pw "moderatorPass" 2 --userdata "role=tester,group=qa"
\`\`\``;

    sendPublicMessage(usageMessage);
    return;
  }

  // Get host from arguments or current window
  const { host: hostArg, meetingID: meetingIDArg } = parsedArgs;
  let host = hostArg;
  if (!host) {
    host = window.location.origin;
    sendPublicMessage(`🌐 Auto-detected host: ${host}`);
  }

  // Get meetingID from arguments or current meeting
  let meetingID = meetingIDArg;
  if (!meetingID) {
    // Try to get meetingID from DOM element with data-test="presentation-title"
    const presentationTitleElement = document.querySelector('[data-test="presentationTitle"]');
    const spanContent = presentationTitleElement?.querySelector('span')?.textContent;

    if (spanContent) {
      meetingID = spanContent.trim();
      sendPublicMessage(`🎯 Auto-detected meetingID from DOM: ${meetingID}`);
    } else if (meeting?.meetingId) {
      // Fallback to meeting prop if DOM element not found
      meetingID = meeting.meetingId;
      sendPublicMessage(`🎯 Auto-detected meetingID from prop: ${meetingID}`);
    } else {
      sendPublicMessage('❌ Could not auto-detect meetingID. Please provide --meetingID parameter.');
      return;
    }
  }

  const {
    secret,
    pw,
    userdata,
  } = parsedArgs;

  if (count < 1) {
    sendPublicMessage('❌ Count must be a positive integer.');
    return;
  }

  sendPublicMessage(`✅ Starting CustomJoin with ${count} user(s)...`);

  // Function to create a single user connection
  const createUserConnection = async (userIndex: number): Promise<void> => {
    try {
      // Generate random name
      const fullName = generateRandomName();

      // Generate join URL
      const joinUrl = await generateJoinURL(
        host,
        meetingID,
        fullName,
        pw,
        secret,
        userdata,
      );

      sendPublicMessage(`🔄 User ${userIndex + 1}: Fetching session token for ${fullName}...\n📋 Join URL: ${joinUrl}`);

      // Fetch session token
      const response = await fetch(joinUrl, {
        method: 'GET',
        redirect: 'follow',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Join request failed with status ${response.status}`);
      }

      const finalUrl = response.url;
      const finalUrlObj = new URL(finalUrl);
      const sessionToken = finalUrlObj.searchParams.get('sessionToken');

      if (!sessionToken) {
        throw new Error('No session token found in final URL after redirect');
      }

      sendPublicMessage(`✅ User ${userIndex + 1} (${fullName}): Session token obtained`);

      // Extract GraphQL WebSocket URL
      const graphqlWebsocketUrl = extractGraphQLWebSocketUrl(joinUrl);
      if (!graphqlWebsocketUrl) {
        throw new Error('Failed to extract GraphQL WebSocket URL');
      }

      // Create WebSocket connection
      const clientUUID = uuid();
      const client = createWebSocketConnection(graphqlWebsocketUrl, sessionToken, clientUUID);

      // Set up connection monitoring
      setupConnectionMonitoring(client, userIndex, (idx) => {
        sendPublicMessage(`⚠️ User ${idx + 1} connection may be stale`);
      });

      // Subscribe to current user and execute join mutation
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
            sendPublicMessage(`✅ User ${userIndex + 1} (${fullName}): authToken received`);

            try {
              await client.mutate({
                mutation: userJoinMutation,
                variables: {
                  authToken: userAuthToken,
                  clientType: 'HTML5',
                  clientIsMobile: false,
                },
              });

              const roleLabel = result.data.user_current[0].role;
              sendPublicMessage(
                `✅ User ${userIndex + 1} (${fullName}) joined meeting\n`
                + `👤 User ID: ${result.data.user_current[0].userId}\n`
                + `👑 Role: ${roleLabel}`,
              );
            } catch (joinError) {
              const errorMsg = joinError instanceof Error
                ? joinError.message
                : JSON.stringify(joinError);
              sendPublicMessage(
                `⚠️ User ${userIndex + 1} (${fullName}) join mutation failed: ${errorMsg}`,
              );
            }
          }
        },
        error: (error) => {
          sendPublicMessage(`⚠️ User ${userIndex + 1} (${fullName}) subscription error: ${error}`);
        },
      });

      activeCustomJoinConnections.push(client);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sendPublicMessage(`❌ User ${userIndex + 1}: Failed - ${errorMessage}`);
      pluginLogger.error('CustomJoin user connection failed', { userIndex, error: errorMessage });
    }
  };

  // Create connections sequentially with small delay
  for (let idx = 0; idx < count; idx += 1) {
    // eslint-disable-next-line no-await-in-loop
    await createUserConnection(idx);
    if (idx < count - 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => { setTimeout(resolve, 1000); });
    }
  }

  const successCount = activeCustomJoinConnections.length;
  pluginApi.serverCommands?.chat.sendPublicChatMessage({
    textMessageInMarkdownFormat: `📊 CustomJoin completed:\n✅ Active connections: ${successCount}/${count}\n\n💡 Use \`/stopCustomJoin\` to terminate all connections.`,
  });
};

// Function to stop all active custom join connections
export const stopCustomJoinConnections = (): number => {
  const connectionCount = activeCustomJoinConnections.length;
  pluginLogger.info('Stopping custom join connections', { connectionCount });

  activeCustomJoinConnections.forEach((client) => {
    try {
      if (client.monitorInterval) {
        clearInterval(client.monitorInterval);
      }

      if (client.wsClient) {
        setTimeout(() => {
          client.wsClient?.terminate();
          client.wsClient?.dispose();
        }, 1000);
      }
    } catch (error) {
      pluginLogger.error('Error terminating custom join connection', {
        error: error instanceof Error ? error.message : JSON.stringify(error),
      });
    }
  });

  activeCustomJoinConnections.length = 0;

  pluginLogger.info('All custom join connections stopped', { connectionsTerminated: connectionCount });
  return connectionCount;
};
