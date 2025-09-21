import { UserRole } from "@prisma/client"

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
  role: UserRole
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface UserFormData {
  email: string
  username: string
  firstName: string
  lastName: string
  employeeId: string
  department: string
  position: string
  phone: string
  role: UserRole
  isActive: boolean
  password: string
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
  email: string
  firstName: string
  lastName: string
  employeeId?: string
  department?: string
  position?: string
  phone?: string
  role: UserRole
  isActive: boolean
}

export interface UserManagementProps {
  initialUsers: UserWithPermissions[]
}

export interface UserFormProps {
  user?: UserWithPermissions
  onSubmit: (data: UserFormData) => void
  onCancel: () => void
  isLoading: boolean
}

export interface PasswordResetFormProps {
  onSubmit: (password: string) => void
  onCancel: () => void
  isLoading: boolean
}

export interface UserStatsData {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  adminUsers: number
  regularUsers: number
  departments: number
}