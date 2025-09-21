"use client"

import React, { useState, useTransition } from "react"
import {
  Building,
  Search,
  RefreshCw,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  Package,
  ShoppingCart,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, type SupplierWithDetails, type CreateSupplierInput, type UpdateSupplierInput } from "@/lib/actions/supplier-actions"
import { SupplierForm } from "./supplier-form"
import { toast } from "sonner"


interface SuppliersViewProps {
  initialSuppliers: SupplierWithDetails[]
}

export function SuppliersView({ initialSuppliers }: SuppliersViewProps) {
  const [suppliers, setSuppliers] = useState<SupplierWithDetails[]>(initialSuppliers)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithDetails | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await getSuppliers({ search: searchQuery })
      
      if (result.success) {
        setSuppliers(result.data || [])
        toast.success("Suppliers data refreshed")
      } else {
        toast.error(result.error || "Failed to refresh suppliers")
      }
    })
  }

  // Unified handler that works for both create and update
  const handleSupplierSubmit = (data: CreateSupplierInput | UpdateSupplierInput) => {
    startTransition(async () => {
      if (selectedSupplier) {
        // Update operation
        const result = await updateSupplier(selectedSupplier.id, data as UpdateSupplierInput)

        if (result.success && result.data) {
          setSuppliers(prev => prev.map(supplier => 
            supplier.id === selectedSupplier.id ? result.data! : supplier
          ))
          setIsEditDialogOpen(false)
          setSelectedSupplier(null)
          toast.success("Supplier updated successfully")
        } else {
          toast.error(result.error || "Failed to update supplier")
        }
      } else {
        // Create operation
        const result = await createSupplier(data as CreateSupplierInput)

        if (result.success && result.data) {
          setSuppliers(prev => [result.data!, ...prev])
          setIsCreateDialogOpen(false)
          toast.success("Supplier created successfully")
        } else {
          toast.error(result.error || "Failed to create supplier")
        }
      }
    })
  }

  const handleDeleteSupplier = () => {
    if (!selectedSupplier) return

    startTransition(async () => {
      const result = await deleteSupplier(selectedSupplier.id)

      if (result.success) {
        setSuppliers(prev => prev.filter(supplier => supplier.id !== selectedSupplier.id))
        setIsDeleteDialogOpen(false)
        setSelectedSupplier(null)
        toast.success("Supplier deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete supplier")
      }
    })
  }

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.contactInfo && supplier.contactInfo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (supplier.purchaseReference && supplier.purchaseReference.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Suppliers</h1>
            <p className="text-gray-600">Manage your suppliers and vendor relationships</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedSupplier(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Supplier</DialogTitle>
                  <DialogDescription>Add a new supplier to your vendor network</DialogDescription>
                </DialogHeader>
                <SupplierForm
                  onSubmit={handleSupplierSubmit}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={isPending}
                />
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleRefresh} disabled={isPending}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Building className="w-6 h-6 mr-3 text-blue-600" />
                Suppliers ({filteredSuppliers.length})
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 w-64"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {filteredSuppliers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-gray-50 rounded-full mb-4">
                  <Building className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No suppliers found</h3>
                <p className="text-gray-500 text-center mb-8 max-w-sm">
                  {searchQuery ? "No suppliers match your search criteria." : "Get started by adding your first supplier to your vendor network."}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Supplier
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Information</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Reference</th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Orders</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Building className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{supplier.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {supplier.contactInfo ? (
                          <div className="text-sm text-gray-600 max-w-xs">
                            {supplier.contactInfo}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {supplier.purchaseReference ? (
                          <div className="text-sm font-mono text-gray-600">
                            {supplier.purchaseReference}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-blue-600">{supplier._count.items}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <ShoppingCart className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-purple-600">{supplier._count.purchases}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-600">
                          {supplier.createdAt.toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedSupplier(supplier)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Supplier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedSupplier(supplier)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Supplier
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
              <DialogDescription>Update supplier information</DialogDescription>
            </DialogHeader>
            {selectedSupplier && (
              <SupplierForm
                supplier={selectedSupplier}
                onSubmit={handleSupplierSubmit}
                onCancel={() => {
                  setIsEditDialogOpen(false)
                  setSelectedSupplier(null)
                }}
                isLoading={isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Supplier</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedSupplier?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setSelectedSupplier(null)
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteSupplier} disabled={isPending}>
                {isPending ? "Deleting..." : "Delete Supplier"}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>
  )
}