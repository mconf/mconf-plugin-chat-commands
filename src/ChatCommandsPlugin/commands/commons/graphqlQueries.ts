import { gql } from '@apollo/client';

// GraphQL mutation for user join
export const userJoinMutation = gql`
  mutation UserJoin($authToken: String!, $clientType: String!, $clientIsMobile: Boolean!) {
    userJoinMeeting(
      authToken: $authToken,
      clientType: $clientType,
      clientIsMobile: $clientIsMobile,
    )
  }
`;

// GraphQL mutation for setting user role
export const SET_ROLE = gql`
  mutation SetRole($userId: String!, $role: String!) {
    userSetRole(
      userId: $userId,
      role: $role,
    )
  }
`;

// GraphQL subscription for current user data
export const CURRENT_USER_SUBSCRIPTION = gql`
  subscription userCurrentSubscription {
    user_current {
      authToken
      userId
      name
      role
      joined
    }
  }
`;
