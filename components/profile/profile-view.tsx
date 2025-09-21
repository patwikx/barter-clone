"use client"

import React, { useState, useTransition } from "react"
import {
  User,
  Edit,
  Save,
  X,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  Shield,
  Key,
  Settings,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateUser, resetUserPassword, type UserWithPermissions, type UpdateUserInput } from "@/lib/actions/user-actions"
import { UserRole } from "@prisma/client"
import { PasswordResetForm } from "@/components/users/password-reset-form"
import { toast } from "sonner"

interface ProfileViewProps {
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

export function ProfileView({ initialUser }: ProfileViewProps) {
  const [user, setUser] = useState<UserWithPermissions>(initialUser)
  const [isEditing, setIsEditing] = useState(false)
  const [isPasswordResetDialogOpen, setIsPasswordResetDialogOpen] = useState(false)
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
  })

  const handleUpdateProfile = () => {
    startTransition(async () => {
      const updateData: UpdateUserInput = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        employeeId: formData.employeeId || undefined,
        department: formData.department || undefined,
        position: formData.position || undefined,
        phone: formData.phone || undefined,
        role: user.role, // Keep existing role
        isActive: user.isActive, // Keep existing status
      }

      const result = await updateUser(user.id, updateData)

      if (result.success && result.user) {
        setUser(result.user)
        setIsEditing(false)
        toast.success("Profile updated successfully.")
      } else {
        toast.error(result.error || "Failed to update profile.")
      }
    })
  }

  const handlePasswordReset = (password: string) => {
    startTransition(async () => {
      const result = await resetUserPassword(user.id, password)

      if (result.success) {
        setIsPasswordResetDialogOpen(false)
        toast.success("Password updated successfully.")
      } else {
        toast.error(result.error || "Failed to update password.")
      }
    })
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
    })
    setIsEditing(false)
  }

  const RoleIcon = getRoleIcon(user.role)
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsPasswordResetDialogOpen(true)}
            disabled={isPending}
          >
            <Key className="w-4 h-4 mr-2" />
            Change Password
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
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

              {isEditing && (
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={cancelEdit} disabled={isPending}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateProfile} disabled={isPending}>
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
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                My Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.permissions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No permissions assigned</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {user.permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {permission.permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-xs text-gray-500">
                          Granted: {permission.grantedAt.toLocaleDateString()}
                          {permission.expiresAt && (
                            <span> • Expires: {permission.expiresAt.toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900">{fullName}</h3>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Role</span>
                  <Badge className={getRoleColor(user.role)}>
                    <RoleIcon className="w-3 h-3 mr-1" />
                    {user.role.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Permissions</span>
                  <span className="text-sm font-medium">{user.permissions.length}</span>
                </div>
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

          {/* Account Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Member Since</span>
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

          {/* Security Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsPasswordResetDialogOpen(true)}
                disabled={isPending}
              >
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={isPasswordResetDialogOpen} onOpenChange={setIsPasswordResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Update your account password
            </DialogDescription>
          </DialogHeader>
          <PasswordResetForm
            onSubmit={handlePasswordReset}
            onCancel={() => setIsPasswordResetDialogOpen(false)}
            isLoading={isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}