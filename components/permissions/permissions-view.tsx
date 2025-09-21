"use client"

import React from "react"
import {
  Shield,
  Settings,
  Package,
  ShoppingCart,
  ArrowRightLeft,
  Truck,
  BarChart3,
  Users,
  Building,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { type UserWithPermissions } from "@/lib/actions/user-actions"
import { Permission, UserRole } from "@prisma/client"

interface PermissionsViewProps {
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
      return Package
    case UserRole.PURCHASER:
      return ShoppingCart
    case UserRole.APPROVER:
      return CheckCircle2
    case UserRole.USER:
      return Settings
    case UserRole.VIEWER:
      return Settings
    default:
      return Settings
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

const getPermissionIcon = (permission: Permission) => {
  if (permission.includes('ITEMS')) return Package
  if (permission.includes('PURCHASES')) return ShoppingCart
  if (permission.includes('TRANSFERS')) return ArrowRightLeft
  if (permission.includes('WITHDRAWALS')) return Truck
  if (permission.includes('INVENTORY')) return Package
  if (permission.includes('REPORTS')) return BarChart3
  if (permission.includes('USERS')) return Users
  if (permission.includes('WAREHOUSES')) return Building
  if (permission.includes('SUPPLIERS')) return Building
  return Settings
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

export function PermissionsView({ initialUser }: PermissionsViewProps) {
  const user = initialUser
  const userPermissions = user.permissions.map(p => p.permission)
  
  const RoleIcon = getRoleIcon(user.role)
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Permissions</h1>
          <p className="text-gray-600 mt-1">View your current system permissions and access levels</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Permissions Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Role Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Role & Access Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <RoleIcon className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{fullName}</h3>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                  <Badge className={getRoleColor(user.role)}>
                    <RoleIcon className="w-3 h-3 mr-1" />
                    {user.role.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions by Category */}
          {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => {
            const userCategoryPermissions = permissions.filter(p => userPermissions.includes(p))
            
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      {category}
                    </span>
                    <Badge variant="outline">
                      {userCategoryPermissions.length} / {permissions.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissions.map((permission) => {
                      const hasPermission = userPermissions.includes(permission)
                      const PermissionIcon = getPermissionIcon(permission)
                      
                      return (
                        <div
                          key={permission}
                          className={`flex items-center space-x-3 p-3 border rounded-lg ${
                            hasPermission 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            hasPermission 
                              ? 'bg-green-100' 
                              : 'bg-gray-100'
                          }`}>
                            {hasPermission ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${
                              hasPermission ? 'text-green-900' : 'text-gray-500'
                            }`}>
                              {permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="text-xs text-gray-500">
                              {hasPermission ? 'Granted' : 'Not granted'}
                            </div>
                          </div>
                          <PermissionIcon className={`w-4 h-4 ${
                            hasPermission ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Permission Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Permission Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{user.permissions.length}</div>
                <p className="text-sm text-gray-500">Total Permissions</p>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => {
                  const userCategoryPermissions = permissions.filter(p => userPermissions.includes(p))
                  const percentage = Math.round((userCategoryPermissions.length / permissions.length) * 100)
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{category}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{userCategoryPermissions.length}/{permissions.length}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          percentage === 100 ? 'bg-green-500' :
                          percentage > 50 ? 'bg-yellow-500' :
                          percentage > 0 ? 'bg-orange-500' :
                          'bg-gray-300'
                        }`} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Permission Changes */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Changes</CardTitle>
            </CardHeader>
            <CardContent>
              {user.permissions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No permissions granted</p>
              ) : (
                <div className="space-y-3">
                  {user.permissions.slice(0, 5).map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {permission.permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-xs text-gray-500">
                          Granted {permission.grantedAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}