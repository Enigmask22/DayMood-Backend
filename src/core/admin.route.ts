/**
 * List of routes that require ADMIN role privileges
 * Used by JwtAuthGuard to protect admin-only resources
 */
export const adminV1Route = [
  // User management routes - only ADMIN can access these
  { method: 'get', url: '/api/v1/users' },
  { method: 'post', url: '/api/v1/users' },
  { method: 'get', url: '/api/v1/users/:id' },
  { method: 'delete', url: '/api/v1/users/:id' },
];