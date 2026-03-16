export const normalizeRoleList = (role) =>
  Array.isArray(role) ? role : role ? [role] : [];
