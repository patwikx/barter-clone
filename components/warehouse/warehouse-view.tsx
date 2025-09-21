"use client"

import React, { useState, useTransition } from "react"
import {
  Warehouse,
  Search,
  RefreshCw,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Package,
  TrendingUp,
  MoreHorizontal,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse, type WarehouseWithDetails, type CreateWarehouseInput, type UpdateWarehouseInput } from "@/lib/actions/warehouse-actions"
import { WarehouseForm } from "./warehouse-form"
import { toast } from "sonner"


interface WarehousesViewProps {
  initialWarehouses: WarehouseWithDetails[]
}

export function WarehousesView({ initialWarehouses }: WarehousesViewProps) {
  const [warehouses, setWarehouses] = useState<WarehouseWithDetails[]>(initialWarehouses)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseWithDetails | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await getWarehouses({ search: searchQuery })
      
      if (result.success) {
        setWarehouses(result.data || [])
        toast.success("Warehouses data refreshed")
      } else {
        toast.error(result.error || "Failed to refresh warehouses")
      }
    })
  }

  // Unified handler that works for both create and update
  const handleWarehouseSubmit = (data: CreateWarehouseInput | UpdateWarehouseInput) => {
    startTransition(async () => {
      if (selectedWarehouse) {
        // Update operation
        const result = await updateWarehouse(selectedWarehouse.id, data as UpdateWarehouseInput)

        if (result.success && result.data) {
          setWarehouses(prev => prev.map(warehouse => 
            warehouse.id === selectedWarehouse.id ? result.data! : warehouse
          ))
          setIsEditDialogOpen(false)
          setSelectedWarehouse(null)
          toast.success("Warehouse updated successfully")
        } else {
          toast.error(result.error || "Failed to update warehouse")
        }
      } else {
        // Create operation
        const result = await createWarehouse(data as CreateWarehouseInput)

        if (result.success && result.data) {
          setWarehouses(prev => [result.data!, ...prev])
          setIsCreateDialogOpen(false)
          toast.success("Warehouse created successfully")
        } else {
          toast.error(result.error || "Failed to create warehouse")
        }
      }
    })
  }

  const handleDeleteWarehouse = () => {
    if (!selectedWarehouse) return

    startTransition(async () => {
      const result = await deleteWarehouse(selectedWarehouse.id)

      if (result.success) {
        setWarehouses(prev => prev.filter(warehouse => warehouse.id !== selectedWarehouse.id))
        setIsDeleteDialogOpen(false)
        setSelectedWarehouse(null)
        toast.success("Warehouse deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete warehouse")
      }
    })
  }

  const filteredWarehouses = warehouses.filter((warehouse) => {
    const matchesSearch = 
      warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (warehouse.location && warehouse.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (warehouse.description && warehouse.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Warehouses</h1>
            <p className="text-gray-600">Manage your warehouse locations and facilities</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedWarehouse(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Warehouse
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Warehouse</DialogTitle>
                  <DialogDescription>Add a new warehouse location to your network</DialogDescription>
                </DialogHeader>
                <WarehouseForm
                  onSubmit={handleWarehouseSubmit}
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

        {/* Warehouses Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Warehouse className="w-6 h-6 mr-3 text-blue-600" />
                Warehouses ({filteredWarehouses.length})
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search warehouses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 w-64"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {filteredWarehouses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-gray-50 rounded-full mb-4">
                  <Warehouse className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No warehouses found</h3>
                <p className="text-gray-500 text-center mb-8 max-w-sm">
                  {searchQuery ? "No warehouses match your search criteria." : "Get started by adding your first warehouse location."}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Warehouse
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Costing Method</th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory Items</th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Movements</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWarehouses.map((warehouse) => (
                    <tr key={warehouse.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Warehouse className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold text-gray-900">{warehouse.name}</span>
                              {warehouse.isMainWarehouse && (
                                <Badge variant="secondary">
                                  <Star className="w-3 h-3 mr-1" />
                                  Main
                                </Badge>
                              )}
                            </div>
                            {warehouse.description && (
                              <div className="text-xs text-gray-500 max-w-xs truncate">
                                {warehouse.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {warehouse.location ? (
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <MapPin className="w-3 h-3" />
                            <span className="max-w-xs truncate">{warehouse.location}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <Badge variant="outline">
                          {warehouse.defaultCostingMethod.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-blue-600">{warehouse._count.currentInventory}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-purple-600">{warehouse._count.inventoryMovements}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-600">
                          {warehouse.createdAt.toLocaleDateString()}
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
                                setSelectedWarehouse(warehouse)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Warehouse
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedWarehouse(warehouse)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Warehouse
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
              <DialogTitle>Edit Warehouse</DialogTitle>
              <DialogDescription>Update warehouse information</DialogDescription>
            </DialogHeader>
            {selectedWarehouse && (
              <WarehouseForm
                warehouse={selectedWarehouse}
                onSubmit={handleWarehouseSubmit}
                onCancel={() => {
                  setIsEditDialogOpen(false)
                  setSelectedWarehouse(null)
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
              <DialogTitle>Delete Warehouse</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedWarehouse?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setSelectedWarehouse(null)
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteWarehouse} disabled={isPending}>
                {isPending ? "Deleting..." : "Delete Warehouse"}
              </Button>
            </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
  )
}