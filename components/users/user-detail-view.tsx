"use client"

import type React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Shield,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  Key,
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  X,
  UserCheck,
  UserX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { UserRole, Permission } from "@prisma/client"
import {
  updateUser,
  updateUserPermissions,
  resetUserPassword,
  deleteUser,
  type UpdateUserInput,
  type UserWithPermissions,
} from "@/lib/actions/user-actions"
import { toast } from "sonner"
import Link from "next/link"

interface UserDetailViewProps {
  initialUser: UserWithPermissions
}

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return Shield
    case UserRole.ADMIN:
      return Shield
    case UserRole.WAREHOUSE_MANAGER:
      return Building
    case UserRole.INVENTORY_CLERK:
      return User
    case UserRole.PURCHASER:
      return User
    case UserRole.APPROVER:
      return Shield
    case UserRole.USER:
      return User
    case UserRole.VIEWER:
      return User
    default:
      return User
  }
}

const getRoleColor = (role: UserRole) => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return "bg-purple-100 text-purple-800"
    case UserRole.ADMIN:
      return "bg-red-100 text-red-800"
    case UserRole.WAREHOUSE_MANAGER:
      return "bg-blue-100 text-blue-800"
    case UserRole.INVENTORY_CLERK:
      return "bg-green-100 text-green-800"
    case UserRole.PURCHASER:
      return "bg-orange-100 text-orange-800"
    case UserRole.APPROVER:
      return "bg-indigo-100 text-indigo-800"
    case UserRole.USER:
      return "bg-gray-100 text-gray-800"
    case UserRole.VIEWER:
      return "bg-cyan-100 text-cyan-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// Permission categories for better organization
const PERMISSION_CATEGORIES = {
  "Item Management": [
    Permission.CREATE_ITEMS,
    Permission.UPDATE_ITEMS,
    Permission.DELETE_ITEMS,
    Permission.VIEW_ITEMS,
  ],
  "Purchase Management": [
    Permission.CREATE_PURCHASES,
    Permission.APPROVE_PURCHASES,
    Permission.VIEW_PURCHASES,
    Permission.CANCEL_PURCHASES,
  ],
  "Transfer Management": [
    Permission.CREATE_TRANSFERS,
    Permission.APPROVE_TRANSFERS,
    Permission.VIEW_TRANSFERS,
    Permission.CANCEL_TRANSFERS,
  ],
  "Withdrawal Management": [
    Permission.REQUEST_WITHDRAWALS,
    Permission.APPROVE_WITHDRAWALS,
    Permission.VIEW_WITHDRAWALS,
    Permission.CANCEL_WITHDRAWALS,
  ],
  "Inventory Management": [
    Permission.ADJUST_INVENTORY,
    Permission.VIEW_INVENTORY,
    Permission.RECOUNT_INVENTORY,
  ],
  "Reporting": [
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_COST_REPORTS,
  ],
  "Administration": [
    Permission.MANAGE_USERS,
    Permission.MANAGE_WAREHOUSES,
    Permission.MANAGE_SUPPLIERS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.SYSTEM_SETTINGS,
  ],
}

const PasswordResetForm = ({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (password: string) => void
  onCancel: () => void
  isLoading: boolean
}) => {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    onSubmit(password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password *</Label>
        <Input
          id="newPassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
          required
          disabled={isLoading}
          minLength={6}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
          disabled={isLoading}
          minLength={6}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || password !== confirmPassword || password.length < 6}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function UserDetailView({ initialUser }: UserDetailViewProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserWithPermissions>(initialUser)
  const [isEditing, setIsEditing] = useState(false)
  const [isPasswordResetDialogOpen, setIsPasswordResetDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Form states
  const [formData, setFormData] = useState({
    email: user.email || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    employeeId: user.employeeId || "",
    department: user.department || "",
    position: user.position || "",
    phone: user.phone || "",
    role: user.role,
    isActive: user.isActive,
  })

  // Permission states
  const [userPermissions, setUserPermissions] = useState<Permission[]>(
    user.permissions.map(p => p.permission)
  )
  const [isPermissionsChanged, setIsPermissionsChanged] = useState(false)

  const handleUpdateUser = () => {
    startTransition(async () => {
      const updateData: UpdateUserInput = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        employeeId: formData.employeeId || undefined,
        department: formData.department || undefined,
        position: formData.position || undefined,
        phone: formData.phone || undefined,
        role: formData.role,
        isActive: formData.isActive,
      }

      const result = await updateUser(user.id, updateData)

      if (result.success && result.user) {
        setUser(result.user)
        setIsEditing(false)
        toast.success("User updated successfully.")
      } else {
        toast.error(result.error || "Failed to update user.")
      }
    })
  }

  const handleUpdatePermissions = () => {
    startTransition(async () => {
      const result = await updateUserPermissions(user.id, {
        permissions: userPermissions
      })

      if (result.success) {
        // Update local state
        setUser(prev => ({
          ...prev,
          permissions: userPermissions.map(permission => ({
            id: `temp-${permission}`,
            permission,
            grantedAt: new Date(),
            expiresAt: null,
          }))
        }))
        setIsPermissionsChanged(false)
        toast.success("Permissions updated successfully.")
      } else {
        toast.error(result.error || "Failed to update permissions.")
      }
    })
  }

  const handlePasswordReset = (password: string) => {
    startTransition(async () => {
      const result = await resetUserPassword(user.id, password)

      if (result.success) {
        setIsPasswordResetDialogOpen(false)
        toast.success("Password reset successfully.")
      } else {
        toast.error(result.error || "Failed to reset password.")
      }
    })
  }

  const handleDeleteUser = () => {
    startTransition(async () => {
      const result = await deleteUser(user.id)

      if (result.success) {
        toast.success("User deleted successfully.")
        router.push("/dashboard/users")
      } else {
        toast.error(result.error || "Failed to delete user.")
      }
    })
  }

  const handlePermissionToggle = (permission: Permission) => {
    const newPermissions = userPermissions.includes(permission)
      ? userPermissions.filter(p => p !== permission)
      : [...userPermissions, permission]
    
    setUserPermissions(newPermissions)
    setIsPermissionsChanged(true)
  }

  const cancelEdit = () => {
    setFormData({
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      employeeId: user.employeeId || "",
      department: user.department || "",
      position: user.position || "",
      phone: user.phone || "",
      role: user.role,
      isActive: user.isActive,
    })
    setIsEditing(false)
  }

  const cancelPermissionChanges = () => {
    setUserPermissions(user.permissions.map(p => p.permission))
    setIsPermissionsChanged(false)
  }

  const RoleIcon = getRoleIcon(user.role)
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/users">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Users
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
              <p className="text-gray-600">@{user.username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsPasswordResetDialogOpen(true)}
              disabled={isPending}
            >
              <Key className="w-4 h-4 mr-2" />
              Reset Password
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete User
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Basic Information
                  </CardTitle>
                  <Button
                    variant={isEditing ? "outline" : "default"}
                    size="sm"
                    onClick={() => isEditing ? cancelEdit() : setIsEditing(true)}
                    disabled={isPending}
                  >
                    {isEditing ? (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      disabled={!isEditing || isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      disabled={!isEditing || isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing || isPending}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      value={formData.employeeId}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                      disabled={!isEditing || isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing || isPending}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      disabled={!isEditing || isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      disabled={!isEditing || isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}
                    disabled={!isEditing || isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UserRole).map((role) => {
                        const RoleIcon = getRoleIcon(role)
                        return (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center">
                              <RoleIcon className="w-4 h-4 mr-2" />
                              {role.replace(/_/g, ' ')}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Account Status</Label>
                  <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <Switch 
                      id="isActive" 
                      checked={formData.isActive} 
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                      disabled={!isEditing || isPending}
                    />
                    <Label htmlFor="isActive" className="text-sm text-gray-600">
                      Account is active
                    </Label>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={cancelEdit} disabled={isPending}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateUser} disabled={isPending}>
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Permissions
                  </CardTitle>
                  {isPermissionsChanged && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelPermissionChanges}
                        disabled={isPending}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleUpdatePermissions}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Permissions
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                  <div key={category} className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permissions.map((permission) => (
                        <div
                          key={permission}
                          className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-gray-50"
                        >
                          <Switch
                            id={permission}
                            checked={userPermissions.includes(permission)}
                            onCheckedChange={() => handlePermissionToggle(permission)}
                            disabled={isPending}
                          />
                          <Label htmlFor={permission} className="text-sm text-gray-700 flex-1">
                            {permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {category !== "Administration" && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Status</span>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Role</span>
                  <Badge className={getRoleColor(user.role)}>
                    <RoleIcon className="w-3 h-3 mr-1" />
                    {user.role.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Permissions</span>
                  <span className="text-sm font-medium">{user.permissions.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{user.phone}</span>
                  </div>
                )}
                {user.department && (
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{user.department}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Information */}
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <div className="flex items-center space-x-1 text-sm text-gray-900">
                    <Calendar className="w-3 h-3" />
                    <span>{user.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Login</span>
                  <div className="flex items-center space-x-1 text-sm text-gray-900">
                    <Clock className="w-3 h-3" />
                    <span>{user.lastLoginAt ? user.lastLoginAt.toLocaleDateString() : "Never"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <div className="flex items-center space-x-1 text-sm text-gray-900">
                    <Calendar className="w-3 h-3" />
                    <span>{user.updatedAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsPasswordResetDialogOpen(true)}
                  disabled={isPending}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Reset Password
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const newStatus = !user.isActive
                    setFormData(prev => ({ ...prev, isActive: newStatus }))
                    setUser(prev => ({ ...prev, isActive: newStatus }))
                    
                    startTransition(async () => {
                      const result = await updateUser(user.id, { isActive: newStatus })
                      if (result.success) {
                        toast.success(`User ${newStatus ? "activated" : "deactivated"} successfully.`)
                      } else {
                        // Revert on error
                        setUser(prev => ({ ...prev, isActive: !newStatus }))
                        setFormData(prev => ({ ...prev, isActive: !newStatus }))
                        toast.error(result.error || "Failed to update user status.")
                      }
                    })
                  }}
                  disabled={isPending}
                >
                  {user.isActive ? (
                    <>
                      <UserX className="w-4 h-4 mr-2" />
                      Deactivate User
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Activate User
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={isPasswordResetDialogOpen} onOpenChange={setIsPasswordResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {user.firstName} {user.lastName} (@{user.username})
            </DialogDescription>
          </DialogHeader>
          <PasswordResetForm
            onSubmit={handlePasswordReset}
            onCancel={() => setIsPasswordResetDialogOpen(false)}
            isLoading={isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {user.firstName} {user.lastName} (@{user.username})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}