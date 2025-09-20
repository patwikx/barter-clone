// In "@/lib/auth-actions/auth-users.ts"

import { prisma } from "../prisma";
import { UserRole, Permission } from "@prisma/client";

/**
 * Fetches a user by their unique username.
 */
export const getUserByUsername = async (username: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    return user;
  } catch {
    return null;
  }
};

/**
 * Fetches a user by their unique email.
 */
export const getUserByEmail = async (email: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    return user;
  } catch {
    return null;
  }
};

/**
 * Fetches a user by their ID and includes their permissions.
 * Updated to use the actual relations from your schema.
 */
export const getUserById = async (id: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        permissions: true,
        accounts: true,
        sessions: true,
      },
    });
    return user;
  } catch {
    return null;
  }
};

/**
 * Fetches a user with full details including all relationships.
 * Useful for comprehensive user data retrieval.
 */
export const getUserWithFullDetails = async (id: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        permissions: {
          where: {
            OR: [
              { expiresAt: null }, // Never expires
              { expiresAt: { gt: new Date() } } // Not yet expired
            ]
          }
        },
        accounts: true,
        sessions: true,
        purchasesCreated: {
          select: { id: true, purchaseOrder: true, createdAt: true }
        },
        purchasesApproved: {
          select: { id: true, purchaseOrder: true, approvedAt: true }
        },
      },
    });
    return user;
  } catch {
    return null;
  }
};

/**
 * Fetches a user's email by their ID.
 */
export const getUserEmailById = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email ?? null;
  } catch {
    return null;
  }
};

/**
 * Fetches a user's first and last name by their ID.
 */
export const getUserNameById = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    if (!user) return null;
    
    // Return full name or fallback to available parts
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.firstName || user.lastName || null;
  } catch {
    return null;
  }
};

/**
 * Fetches a user's username by their ID.
 */
export const getUsernameById = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });
    return user?.username ?? null;
  } catch {
    return null;
  }
};

/**
 * Fetches a user's employee ID by their ID.
 */
export const getUserEmployeeId = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true },
    });
    return user?.employeeId ?? null;
  } catch {
    return null;
  }
};

/**
 * Fetches a user's active permissions.
 * Returns only non-expired permissions.
 */
export const getUserActivePermissions = async (userId: string) => {
  try {
    const permissions = await prisma.userPermission.findMany({
      where: { 
        userId,
        OR: [
          { expiresAt: null }, // Never expires
          { expiresAt: { gt: new Date() } } // Not yet expired
        ]
      },
    });
    return permissions;
  } catch {
    return [];
  }
};

/**
 * Checks if a user has a specific permission.
 * Useful for authorization checks.
 */
export const userHasPermission = async (
  userId: string, 
  permission: Permission
): Promise<boolean> => {
  try {
    const userPermission = await prisma.userPermission.findUnique({
      where: {
        userId_permission: {
          userId,
          permission,
        },
      },
    });
    
    // Check if permission exists and is not expired
    if (!userPermission) return false;
    if (userPermission.expiresAt && userPermission.expiresAt <= new Date()) return false;
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Gets all users with a specific role.
 * Useful for finding admins, managers, etc.
 */
export const getUsersByRole = async (role: UserRole) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeId: true,
        department: true,
        position: true,
        role: true,
      },
    });
    return users;
  } catch {
    return [];
  }
};

/**
 * Gets users by department.
 * Useful for department-specific operations.
 */
export const getUsersByDepartment = async (department: string) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        department,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeId: true,
        position: true,
        role: true,
      },
    });
    return users;
  } catch {
    return [];
  }
};

/**
 * Updates a user's last login timestamp.
 * Called during authentication process.
 */
export const updateUserLastLogin = async (userId: string) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * Checks if a user is active.
 */
export const isUserActive = async (userId: string): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });
    return user?.isActive ?? false;
  } catch {
    return false;
  }
};

/**
 * Gets user's audit trail summary.
 * Returns recent activities by the user.
 */
export const getUserAuditSummary = async (userId: string, limit = 10) => {
  try {
    const auditLogs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        tableName: true,
        transactionType: true,
        referenceNumber: true,
        timestamp: true,
      },
    });
    return auditLogs;
  } catch {
    return [];
  }
};