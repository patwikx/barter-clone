"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { UserRole, Permission } from "@prisma/client"

export interface UserWithPermissions {
  id: string
  email: string | null
  username: string
  firstName: string | null
  lastName: string | null
  employeeId: string | null
  department: string | null
  position: string | null
  phone: string | null
  isActive: boolean
  role: UserRole
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  permissions: Array<{
    id: string
    permission: Permission
    grantedAt: Date
    expiresAt: Date | null
  }>
}

export interface CreateUserInput {
  email: string
  username: string
  firstName: string
  lastName: string
  employeeId?: string
  department?: string
  position?: string
  phone?: string
  role: UserRole
  isActive: boolean
  password: string
}

export interface UpdateUserInput {
  email?: string
  username?: string
  firstName?: string
  lastName?: string
  employeeId?: string
  department?: string
  position?: string
  phone?: string
  role?: UserRole
  isActive?: boolean
}

export interface UpdateUserPermissionsInput {
  permissions: Permission[]
}

// Get all users with their permissions
export async function getUsers(): Promise<{
  success: boolean
  users?: UserWithPermissions[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const users = await prisma.user.findMany({
      include: {
        permissions: {
          select: {
            id: true,
            permission: true,
            grantedAt: true,
            expiresAt: true,
          },
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    })

    return {
      success: true,
      users: users as UserWithPermissions[]
    }

  } catch (error) {
    console.error('Error fetching users:', error)
    return {
      success: false,
      error: 'Failed to fetch users'
    }
  }
}

// Get single user by ID
export async function getUserById(userId: string): Promise<{
  success: boolean
  user?: UserWithPermissions
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: {
          select: {
            id: true,
            permission: true,
            grantedAt: true,
            expiresAt: true,
          },
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        }
      }
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    return {
      success: true,
      user: user as UserWithPermissions
    }

  } catch (error) {
    console.error('Error fetching user:', error)
    return {
      success: false,
      error: 'Failed to fetch user'
    }
  }
}

// Create new user
export async function createUser(data: CreateUserInput): Promise<{
  success: boolean
  user?: UserWithPermissions
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email }
        ]
      }
    })

    if (existingUser) {
      return { 
        success: false, 
        error: existingUser.username === data.username 
          ? "Username already exists" 
          : "Email already exists" 
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        employeeId: data.employeeId,
        department: data.department,
        position: data.position,
        phone: data.phone,
        role: data.role,
        isActive: data.isActive,
      },
      include: {
        permissions: {
          select: {
            id: true,
            permission: true,
            grantedAt: true,
            expiresAt: true,
          }
        }
      }
    })

    revalidatePath('/dashboard/users')
    
    return {
      success: true,
      user: user as UserWithPermissions
    }

  } catch (error) {
    console.error('Error creating user:', error)
    return {
      success: false,
      error: 'Failed to create user'
    }
  }
}

// Update user
export async function updateUser(userId: string, data: UpdateUserInput): Promise<{
  success: boolean
  user?: UserWithPermissions
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if email already exists (if updating email)
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id: userId }
        }
      })

      if (existingUser) {
        return { success: false, error: "Email already exists" }
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        permissions: {
          select: {
            id: true,
            permission: true,
            grantedAt: true,
            expiresAt: true,
          },
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        }
      }
    })

    revalidatePath('/dashboard/users')
    revalidatePath(`/dashboard/users/${userId}`)
    
    return {
      success: true,
      user: user as UserWithPermissions
    }

  } catch (error) {
    console.error('Error updating user:', error)
    return {
      success: false,
      error: 'Failed to update user'
    }
  }
}

// Delete user
export async function deleteUser(userId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Don't allow deleting yourself
    if (session.user.id === userId) {
      return { success: false, error: "Cannot delete your own account" }
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    revalidatePath('/dashboard/users')
    
    return { success: true }

  } catch (error) {
    console.error('Error deleting user:', error)
    return {
      success: false,
      error: 'Failed to delete user'
    }
  }
}

// Update user permissions
export async function updateUserPermissions(userId: string, data: UpdateUserPermissionsInput): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Remove all existing permissions for this user
    await prisma.userPermission.deleteMany({
      where: { userId }
    })

    // Add new permissions
    if (data.permissions.length > 0) {
      await prisma.userPermission.createMany({
        data: data.permissions.map(permission => ({
          userId,
          permission,
          grantedBy: session.user.id,
          grantedAt: new Date()
        }))
      })
    }

    revalidatePath('/dashboard/users')
    revalidatePath(`/dashboard/users/${userId}`)
    
    return { success: true }

  } catch (error) {
    console.error('Error updating user permissions:', error)
    return {
      success: false,
      error: 'Failed to update user permissions'
    }
  }
}

// Reset user password
export async function resetUserPassword(userId: string, newPassword: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        updatedAt: new Date()
      }
    })

    revalidatePath('/dashboard/users')
    revalidatePath(`/dashboard/users/${userId}`)
    
    return { success: true }

  } catch (error) {
    console.error('Error resetting password:', error)
    return {
      success: false,
      error: 'Failed to reset password'
    }
  }
}