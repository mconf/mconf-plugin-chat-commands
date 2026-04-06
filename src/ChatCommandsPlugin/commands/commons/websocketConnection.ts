import { ApolloClient, InMemoryCache } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { pluginLogger } from 'bigbluebutton-html-plugin-sdk';
import { CONNECTION_BOUNDARY, MonitoredApolloClient } from './types';

/**
 * Creates a WebSocket connection to the BigBlueButton GraphQL API
 */
export function createWebSocketConnection(
  graphqlWebsocketUrl: string,
  sessionToken: string,
  clientUUID: string,
): MonitoredApolloClient {
  pluginLogger.info('Creating WebSocket connection', {
    graphqlWebsocketUrl,
    sessionToken,
    clientUUID,
  });

  // Initialize user-specific monitoring variables
  let userLastMessageRef = 0;
  let userLastPingMessageRef = 0;

  // Create GraphQL WebSocket client
  const wsClient = createClient({
    url: graphqlWebsocketUrl,
    connectionParams: {
      headers: {
        'X-Session-Token': sessionToken,
        'X-ClientSessionUUID': clientUUID,
        'X-ClientType': 'HTML5',
        'X-ClientIsMobile': 'false',
      },
    },
    lazy: false,
    retryAttempts: 3,
    shouldRetry: () => true,
    keepAlive: 30000,
    on: {
      connected: () => {
        pluginLogger.info('WebSocket connected successfully', {
          clientUUID,
          sessionToken,
        });
      },
      connecting: () => {
        pluginLogger.debug('WebSocket connecting', { clientUUID });
      },
      error: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        pluginLogger.error('WebSocket connection error', {
          error: errorMessage,
          clientUUID,
        });
      },
      closed: () => {
        pluginLogger.info('WebSocket connection closed', {
          clientUUID,
        });
      },
      message: (message: unknown) => {
        if (message && typeof message === 'object' && 'type' in message && message.type === 'ping') {
          userLastPingMessageRef = Date.now();
        }
        userLastMessageRef = Date.now();
      },
    },
  });

  // Create GraphQL WebSocket link
  const graphWsLink = new GraphQLWsLink(wsClient);

  // Create Apollo Client
  const client = new ApolloClient({
    link: graphWsLink,
    cache: new InMemoryCache(),
    connectToDevTools: false,
  }) as MonitoredApolloClient;

  // Store monitoring references
  client.userLastMessageRef = userLastMessageRef;
  client.userLastPingMessageRef = userLastPingMessageRef;
  client.wsClient = wsClient;

  return client;
}

/**
 * Sets up connection monitoring for an Apollo Client
 */
export function setupConnectionMonitoring(
  client: MonitoredApolloClient,
  userIndex: number,
  onStale: (userIndex: number) => void,
): void {
  const monitorInterval = setInterval(() => {
    const tsNow = Date.now();
    const lastMessageRef = client.userLastMessageRef || 0;
    const lastPingMessageRef = client.userLastPingMessageRef || 0;

    if (lastMessageRef !== 0 && lastPingMessageRef !== 0) {
      if (tsNow - lastMessageRef > CONNECTION_BOUNDARY) {
        onStale(userIndex);
      }
    }
  }, 5000);

  // eslint-disable-next-line no-param-reassign
  client.monitorInterval = monitorInterval;
}
