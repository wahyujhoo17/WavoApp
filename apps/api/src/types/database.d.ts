// Ambient declarations for the local `database` package used by the API.
// Provide common named exports as `any` so TypeScript builds succeed when
// the package does not include its own type definitions.
declare module "database" {
  // Prisma client instance (approximate)
  export const prisma: any;

  // Common enums/types used in the codebase — declared as `any` to avoid
  // blocking the build. Replace with real type definitions if available.
  export type UserRole = any;
  export type UserPlan = any;
  export type ServiceStatus = any;
  export type DeliveryStatus = any;

  const _default: any;
  export default _default;
}
