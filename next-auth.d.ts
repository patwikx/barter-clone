// next-auth.d.ts
import NextAuth, { type DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

// Define the structure for a user's role
export interface UserRole {
  id: string;
  name: string;
}

// Define the structure for a user's permission
export interface UserPermissionData {
  id: string;
  permission: string;
  grantedAt: Date;
  expiresAt?: Date | null;
}

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      name: string;
      email?: string | null;
      image?: string | null;
      username: string;
      firstName?: string | null;
      lastName?: string | null;
      employeeId?: string | null;
      department?: string | null;
      position?: string | null;
      phone?: string | null;
      isActive: boolean;
      role: string;
      permissions: UserPermissionData[];
      lastLoginAt?: Date | null;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    employeeId?: string | null;
    department?: string | null;
    position?: string | null;
    phone?: string | null;
    isActive?: boolean | null;
    role?: string | null;
    permissions?: UserPermissionData[] | null;
    lastLoginAt?: Date | null;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and sent to the `Session` callback */
  interface JWT {
    id: string;
    email?: string | null;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    employeeId?: string | null;
    department?: string | null;
    position?: string | null;
    phone?: string | null;
    isActive?: boolean | null;
    role?: string | null;
    permissions?: UserPermissionData[] | null;
    lastLoginAt?: Date | null;
    lastActivity?: number; // Unix timestamp for activity tracking
  }
}