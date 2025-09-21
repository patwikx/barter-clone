"use client"

import type React from "react"
import { useState } from "react"
import { Loader2, Shield, UserCheck, Building, User, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { UserRole } from "@prisma/client"
import { UserFormProps, UserFormData } from "@/types/user-types"

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return Shield
    case UserRole.ADMIN:
      return UserCheck
    case UserRole.WAREHOUSE_MANAGER:
      return Building
    case UserRole.INVENTORY_CLERK:
      return User
    case UserRole.PURCHASER:
      return User
    case UserRole.APPROVER:
      return UserCheck
    case UserRole.USER:
      return User
    case UserRole.VIEWER:
      return Eye
    default:
      return User
  }
}

export const UserForm = ({
  user,
  onSubmit,
  onCancel,
  isLoading,
}: UserFormProps) => {
  const [formData, setFormData] = useState<UserFormData>({
    email: user?.email || "",
    username: user?.username || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    employeeId: user?.employeeId || "",
    department: user?.department || "",
    position: user?.position || "",
    phone: user?.phone || "",
    role: user?.role || UserRole.USER,
    isActive: user?.isActive ?? true,
    password: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
            placeholder="Enter first name"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
            placeholder="Enter last name"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username *</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
            placeholder="Enter username"
            required
            disabled={isLoading || !!user}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Enter email address"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      {!user && (
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Enter password"
            required
            disabled={isLoading}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employeeId">Employee ID</Label>
          <Input
            id="employeeId"
            value={formData.employeeId}
            onChange={(e) => setFormData((prev) => ({ ...prev, employeeId: e.target.value }))}
            placeholder="Enter employee ID"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="Enter phone number"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
            placeholder="Enter department"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
            placeholder="Enter position"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value as UserRole }))}
          disabled={isLoading}
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
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
            disabled={isLoading}
          />
          <Label htmlFor="isActive" className="text-sm text-gray-600">
            Account is active
          </Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {user ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{user ? "Update User" : "Create User"}</>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}