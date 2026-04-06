import { ApolloClient } from '@apollo/client';
import { createClient } from 'graphql-ws';

// Connection monitoring boundary in milliseconds
// If no messages received for this duration, connection is considered stale
export const CONNECTION_BOUNDARY = 15000;

// Extended Apollo Client type with monitoring capabilities
export type MonitoredApolloClient = ApolloClient<unknown> & {
  monitorInterval?: NodeJS.Timeout;
  userLastMessageRef?: number;
  userLastPingMessageRef?: number;
  wsClient?: ReturnType<typeof createClient>;
};
