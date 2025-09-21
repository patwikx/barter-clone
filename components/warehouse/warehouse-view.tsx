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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-gray-600 mt-1">Manage your warehouse locations and facilities</p>
        </div>
        <div className="flex items-center space-x-2">
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

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>Search Warehouses</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, location, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warehouses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Warehouse className="w-5 h-5 mr-2" />
            Warehouses ({filteredWarehouses.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredWarehouses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Warehouse className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No warehouses found</h3>
              <p className="text-gray-500 text-center mb-6">
                {searchQuery ? "No warehouses match your search criteria." : "Get started by adding your first warehouse."}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Warehouse
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Costing Method</TableHead>
                  <TableHead className="text-center">Inventory Items</TableHead>
                  <TableHead className="text-center">Movements</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Warehouse className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{warehouse.name}</span>
                            {warehouse.isMainWarehouse && (
                              <Badge variant="secondary">
                                <Star className="w-3 h-3 mr-1" />
                                Main
                              </Badge>
                            )}
                          </div>
                          {warehouse.description && (
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {warehouse.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {warehouse.location ? (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span className="max-w-xs truncate">{warehouse.location}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {warehouse.defaultCostingMethod.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{warehouse._count.currentInventory}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{warehouse._count.inventoryMovements}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {warehouse.createdAt.toLocaleDateString()}
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
  )
}