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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-1">Manage your suppliers and vendor relationships</p>
        </div>
        <div className="flex items-center space-x-2">
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

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>Search Suppliers</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, contact info, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Suppliers ({filteredSuppliers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSuppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Building className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
              <p className="text-gray-500 text-center mb-6">
                {searchQuery ? "No suppliers match your search criteria." : "Get started by adding your first supplier."}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Contact Information</TableHead>
                  <TableHead>Purchase Reference</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-center">Purchase Orders</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Building className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{supplier.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.contactInfo ? (
                        <div className="text-sm text-gray-600 max-w-xs">
                          {supplier.contactInfo}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.purchaseReference ? (
                        <div className="text-sm font-mono text-gray-600">
                          {supplier.purchaseReference}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{supplier._count.items}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <ShoppingCart className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{supplier._count.purchases}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {supplier.createdAt.toLocaleDateString()}
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
  )
}