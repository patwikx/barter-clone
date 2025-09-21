"use client"

import React, { useState, useTransition } from "react"
import {
  Plus,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { UserRole } from "@prisma/client"
import {
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/actions/user-actions"
import { toast } from "sonner"
import {
  UserManagementProps,
  UserWithPermissions,
  UserFormData,
  UserStatsData,
} from "@/types/user-types"
import { UserForm } from "./user-form"
import { PasswordResetForm } from "./password-reset-form"
import { UserTable } from "./user-table"
import { UserSidebar } from "./user-sidebar-filter"

export function UserManagement({ initialUsers }: UserManagementProps) {
  const [users, setUsers] = useState<UserWithPermissions[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [showInactive, setShowInactive] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPasswordResetDialogOpen, setIsPasswordResetDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  const itemsPerPage = 10

  // Get unique departments for filter
  const departments = Array.from(new Set(users.map(user => user.department).filter((dept): dept is string => dept !== null)))

  // Filter users based on search, role, department, and status
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.position?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    const matchesDepartment = selectedDepartment === "all" || user.department === selectedDepartment
    const matchesStatus = showInactive || user.isActive
    return matchesSearch && matchesRole && matchesDepartment && matchesStatus
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const resetToFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }

  // Calculate stats
  const adminRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN]
  const regularUserRoles: UserRole[] = [UserRole.USER, UserRole.VIEWER]
  
  const statsData: UserStatsData = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    inactiveUsers: users.filter((u) => !u.isActive).length,
    adminUsers: users.filter((u) => adminRoles.includes(u.role) && u.isActive).length,
    regularUsers: users.filter((u) => regularUserRoles.includes(u.role) && u.isActive).length,
    departments: departments.length,
  }

  const handleCreateUser = (formData: UserFormData) => {
    startTransition(async () => {
      const userData: CreateUserInput = {
        email: formData.email,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        employeeId: formData.employeeId || undefined,
        department: formData.department || undefined,
        position: formData.position || undefined,
        phone: formData.phone || undefined,
        role: formData.role,
        isActive: formData.isActive,
        password: formData.password,
      }

      const result = await createUser(userData)

      if (result.success && result.user) {
        setUsers((prev) => [...prev, result.user!])
        setIsCreateDialogOpen(false)
        toast.success("User created successfully.")
      } else {
        toast.error(result.error || "Failed to create user.")
      }
    })
  }

  const handleUpdateUser = (formData: UserFormData) => {
    if (!selectedUser) return

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

      const result = await updateUser(selectedUser.id, updateData)

      if (result.success && result.user) {
        setUsers((prev) => prev.map((user) => (user.id === selectedUser.id ? result.user! : user)))
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        toast.success("User updated successfully.")
      } else {
        toast.error(result.error || "Failed to update user.")
      }
    })
  }

  const handleDeleteUser = () => {
    if (!selectedUser) return

    startTransition(async () => {
      const result = await deleteUser(selectedUser.id)

      if (result.success) {
        setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id))
        setIsDeleteDialogOpen(false)
        setSelectedUser(null)
        toast.success("User deleted successfully.")
      } else {
        toast.error(result.error || "Failed to delete user.")
      }
    })
  }

  const handlePasswordReset = (password: string) => {
    if (!selectedUser) return

    startTransition(async () => {
      const result = await resetUserPassword(selectedUser.id, password)

      if (result.success) {
        setIsPasswordResetDialogOpen(false)
        setSelectedUser(null)
        toast.success("Password reset successfully.")
      } else {
        toast.error(result.error || "Failed to reset password.")
      }
    })
  }

  const handleToggleStatus = (user: UserWithPermissions) => {
    startTransition(async () => {
      const result = await updateUser(user.id, {
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        employeeId: user.employeeId || undefined,
        department: user.department || undefined,
        position: user.position || undefined,
        phone: user.phone || undefined,
        role: user.role,
        isActive: !user.isActive,
      })

      if (result.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, isActive: !u.isActive, updatedAt: new Date() } : u,
          ),
        )
        toast.success(`User ${!user.isActive ? "activated" : "deactivated"} successfully.`)
      } else {
        toast.error(result.error || "Failed to update user status.")
      }
    })
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedRole("all")
    setSelectedDepartment("all")
    setShowInactive(false)
    setCurrentPage(1)
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden order-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage users and their access permissions</p>
            </div>
            <div className="flex items-center space-x-3">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>Add a new user to the system</DialogDescription>
                  </DialogHeader>
                  <UserForm
                    onSubmit={handleCreateUser}
                    onCancel={() => setIsCreateDialogOpen(false)}
                    isLoading={isPending}
                  />
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden"
              >
                {isSidebarOpen ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 p-6">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                {searchQuery || selectedRole !== "all" || selectedDepartment !== "all" || showInactive
                  ? "No users match your current filters. Try adjusting your search criteria."
                  : "Get started by creating your first user account."}
              </p>
              {!searchQuery && selectedRole === "all" && selectedDepartment === "all" && !showInactive && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create User
                </Button>
              )}
            </div>
          ) : (
            <UserTable
              users={paginatedUsers}
              onEdit={(user) => {
                setSelectedUser(user)
                setIsEditDialogOpen(true)
              }}
              onPasswordReset={(user) => {
                setSelectedUser(user)
                setIsPasswordResetDialogOpen(true)
              }}
              onToggleStatus={handleToggleStatus}
              onDelete={(user) => {
                setSelectedUser(user)
                setIsDeleteDialogOpen(true)
              }}
            />
          )}

          {/* Pagination */}
          {filteredUsers.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({filteredUsers.length} users)
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(pageNum => {
                      // Show first page, last page, current page, and pages around current
                      if (pageNum === 1 || pageNum === totalPages) return true;
                      if (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) return true;
                      return false;
                    })
                    .map((pageNum, index, arr) => (
                      <div key={pageNum} className="flex items-center">
                        {/* Add ellipsis if there's a gap */}
                        {index > 0 && pageNum > arr[index - 1] + 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <Button
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      </div>
                    ))
                  }
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <UserSidebar
        isOpen={isSidebarOpen}
        searchQuery={searchQuery}
        selectedRole={selectedRole}
        selectedDepartment={selectedDepartment}
        showInactive={showInactive}
        departments={departments}
        stats={statsData}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onSearchChange={(value) => {
          setSearchQuery(value)
          resetToFirstPage()
        }}
        onRoleChange={(value) => {
          setSelectedRole(value)
          resetToFirstPage()
        }}
        onDepartmentChange={(value) => {
          setSelectedDepartment(value)
          resetToFirstPage()
        }}
        onStatusChange={(value) => {
          setShowInactive(value)
          resetToFirstPage()
        }}
        onClearFilters={clearAllFilters}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update the user information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserForm
              user={selectedUser}
              onSubmit={handleUpdateUser}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedUser(null)
              }}
              isLoading={isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={isPasswordResetDialogOpen} onOpenChange={setIsPasswordResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {selectedUser?.firstName} {selectedUser?.lastName} (@{selectedUser?.username})
            </DialogDescription>
          </DialogHeader>
          <PasswordResetForm
            onSubmit={handlePasswordReset}
            onCancel={() => {
              setIsPasswordResetDialogOpen(false)
              setSelectedUser(null)
            }}
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
              Are you sure you want to delete {selectedUser?.firstName} {selectedUser?.lastName} (@{selectedUser?.username})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedUser(null)
              }}
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