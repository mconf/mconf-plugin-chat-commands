export const SET_ROLE = `
  mutation SetRole($userId: String!, $role: String!) {
    userSetRole(
      userId: $userId,
      role: $role,
    )
  }
`;
