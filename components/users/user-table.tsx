"use client"

import React from "react"
import {
  MoreHorizontal,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  Shield,
  Eye,
  Edit,
  Key,
  UserCheck,
  UserX,
  Trash2,
  Mail,
  Phone,
  Building,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserRole } from "@prisma/client"
import { UserWithPermissions } from "@/types/user-types"
import Link from "next/link"

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

interface UserTableProps {
  users: UserWithPermissions[]
  onEdit: (user: UserWithPermissions) => void
  onPasswordReset: (user: UserWithPermissions) => void
  onToggleStatus: (user: UserWithPermissions) => void
  onDelete: (user: UserWithPermissions) => void
}

export const UserTable = ({
  users,
  onEdit,
  onPasswordReset,
  onToggleStatus,
  onDelete,
}: UserTableProps) => {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">User</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
              <TableHead className="font-semibold">Department</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Last Login</TableHead>
              <TableHead className="font-semibold w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const RoleIcon = getRoleIcon(user.role)
              const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username
              return (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">{fullName}</div>
                        <div className="text-sm text-gray-500 truncate">@{user.username}</div>
                        {user.employeeId && (
                          <div className="text-xs text-gray-400">ID: {user.employeeId}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {user.role.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.department ? (
                      <div>
                        <div className="font-medium text-gray-900">{user.department}</div>
                        {user.position && (
                          <div className="text-sm text-gray-500">{user.position}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {user.email && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{user.email}</span>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"} className="font-normal">
                      {user.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {user.lastLoginAt ? (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{user.lastLoginAt.toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/users/${user.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onPasswordReset(user)}>
                          <Key className="w-4 h-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                          {user.isActive ? (
                            <>
                              <UserX className="w-4 h-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(user)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}