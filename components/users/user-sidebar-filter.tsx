"use client"

import React from "react"
import {
  Search,
  Settings,
  Filter,
  X,
  Shield,
  UserCheck,
  Building,
  User,
  Eye,
  BarChart3,
  HashIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { UserRole } from "@prisma/client"
import { UserStatsData } from "@/types/user-types"

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

interface UserSidebarProps {
  isOpen: boolean
  searchQuery: string
  selectedRole: string
  selectedDepartment: string
  showInactive: boolean
  departments: string[]
  stats: UserStatsData
  onToggle: () => void
  onSearchChange: (value: string) => void
  onRoleChange: (value: string) => void
  onDepartmentChange: (value: string) => void
  onStatusChange: (value: boolean) => void
  onClearFilters: () => void
}

export const UserSidebar = ({
  isOpen,
  searchQuery,
  selectedRole,
  selectedDepartment,
  showInactive,
  departments,
  stats,
  onToggle,
  onSearchChange,
  onRoleChange,
  onDepartmentChange,
  onStatusChange,
  onClearFilters,
}: UserSidebarProps) => {
  const hasActiveFilters = searchQuery !== "" || selectedRole !== "all" || selectedDepartment !== "all" || showInactive

  return (
    <div className={`${isOpen ? 'w-80' : 'w-16'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {isOpen && (
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Filters</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-2"
          >
            {isOpen ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Sidebar Content */}
      {isOpen && (
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Search */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Role</Label>
            <Select value={selectedRole} onValueChange={onRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
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

          {/* Department Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Department</Label>
            <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department} value={department}>
                    <div className="flex items-center">
                      <Building className="w-4 h-4 mr-2" />
                      {department}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Toggle */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Status</Label>
            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <Switch id="show-inactive" checked={showInactive} onCheckedChange={onStatusChange} />
              <Label htmlFor="show-inactive" className="text-sm text-gray-600">
                Show inactive users
              </Label>
            </div>
          </div>

          {/* Clear Filters */}
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="w-full"
            disabled={!hasActiveFilters}
          >
            <X className="w-4 h-4 mr-2" />
            Clear All Filters
          </Button>

          <Separator />

          {/* Quick Stats */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Quick Stats
            </Label>
            
            <div className="space-y-3 text-sm">
              {/* Basic counts */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <HashIcon className="w-3 h-3 mr-1 text-blue-500" />
                    <span className="text-gray-600">Total Users:</span>
                  </div>
                  <span className="font-medium">{stats.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                    <span className="text-gray-600">Active:</span>
                  </div>
                  <span className="font-medium text-green-600">{stats.activeUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <XCircle className="w-3 h-3 mr-1 text-red-500" />
                    <span className="text-gray-600">Inactive:</span>
                  </div>
                  <span className="font-medium text-red-600">{stats.inactiveUsers}</span>
                </div>
              </div>

              <Separator />

              {/* Role breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Shield className="w-3 h-3 mr-1 text-purple-500" />
                    <span className="text-gray-600">Admins:</span>
                  </div>
                  <span className="font-medium">{stats.adminUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1 text-gray-500" />
                    <span className="text-gray-600">Regular Users:</span>
                  </div>
                  <span className="font-medium">{stats.regularUsers}</span>
                </div>
              </div>

              <Separator />

              {/* Department info */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Building className="w-3 h-3 mr-1 text-blue-500" />
                    <span className="text-gray-600">Departments:</span>
                  </div>
                  <span className="font-medium">{stats.departments}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}