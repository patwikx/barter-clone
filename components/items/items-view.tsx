"use client"

import React, { useState, useTransition } from "react"
import {
  Package,
  Search,
  Filter,
  RefreshCw,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  TrendingUp,
  Building,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { getItems, createItem, updateItem, deleteItem, type ItemWithDetails, type CreateItemInput, type UpdateItemInput, type ItemFilters } from "@/lib/actions/item-actions"
import { CostingMethodType } from "@prisma/client"
import { ItemForm } from "./items-form"
import { toast } from "sonner"

interface ItemsViewProps {
  initialItems: ItemWithDetails[]
  suppliers: Array<{ id: string; name: string }>
}

export function ItemsView({ initialItems, suppliers }: ItemsViewProps) {
  const [items, setItems] = useState<ItemWithDetails[]>(initialItems)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState("all")
  const [selectedCostingMethod, setSelectedCostingMethod] = useState("all")
  const [selectedItem, setSelectedItem] = useState<ItemWithDetails | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const filters: Partial<ItemFilters> = {
        search: searchQuery,
        supplierId: selectedSupplier,
        costingMethod: selectedCostingMethod
      }

      const result = await getItems(filters)
      
      if (result.success) {
        setItems(result.data || [])
        toast.success("Items data refreshed")
      } else {
        toast.error(result.error || "Failed to refresh items")
      }
    })
  }

  const handleFilterChange = () => {
    handleRefresh()
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedSupplier("all")
    setSelectedCostingMethod("all")
    
    startTransition(async () => {
      const result = await getItems()
      if (result.success) {
        setItems(result.data || [])
      }
    })
  }

  const handleItemSubmit = (data: CreateItemInput | UpdateItemInput) => {
    startTransition(async () => {
      if (selectedItem) {
        // Update operation
        const result = await updateItem(selectedItem.id, data as UpdateItemInput)

        if (result.success && result.data) {
          setItems(prev => prev.map(item => 
            item.id === selectedItem.id ? result.data! : item
          ))
          setIsEditDialogOpen(false)
          setSelectedItem(null)
          toast.success("Item updated successfully")
        } else {
          toast.error(result.error || "Failed to update item")
        }
      } else {
        // Create operation
        const result = await createItem(data as CreateItemInput)

        if (result.success && result.data) {
          setItems(prev => [result.data!, ...prev])
          setIsCreateDialogOpen(false)
          toast.success("Item created successfully")
        } else {
          toast.error(result.error || "Failed to create item")
        }
      }
    })
  }

  const handleDeleteItem = () => {
    if (!selectedItem) return

    startTransition(async () => {
      const result = await deleteItem(selectedItem.id)

      if (result.success) {
        setItems(prev => prev.filter(item => item.id !== selectedItem.id))
        setIsDeleteDialogOpen(false)
        setSelectedItem(null)
        toast.success("Item deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete item")
      }
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatNumber = (num: number | null) => {
    if (num === null) return "-"
    return new Intl.NumberFormat('en-PH').format(num)
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Items & Catalog</h1>
          <p className="text-gray-600 mt-1">Manage your inventory items and product catalog</p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedItem(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create New Item</DialogTitle>
                <DialogDescription>Add a new item to your catalog</DialogDescription>
              </DialogHeader>
              <ItemForm
                suppliers={suppliers}
                onSubmit={handleItemSubmit}
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Costing Method</Label>
              <Select value={selectedCostingMethod} onValueChange={setSelectedCostingMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {Object.values(CostingMethodType).map((method) => (
                    <SelectItem key={method} value={method}>
                      {method.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={handleFilterChange} disabled={isPending}>
              Apply Filters
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Items ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500 text-center mb-6">
                {searchQuery ? "No items match your search criteria." : "Get started by adding your first item."}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Costing Method</TableHead>
                  <TableHead className="text-right">Standard Cost</TableHead>
                  <TableHead className="text-right">Reorder Level</TableHead>
                  <TableHead className="text-center">Inventory</TableHead>
                  <TableHead className="text-center">Movements</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.itemCode}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {item.description}
                        </div>
                        <div className="text-xs text-gray-400">
                          UOM: {item.unitOfMeasure}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{item.supplier.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.costingMethod.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.standardCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(item.reorderLevel)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{item._count.currentInventory}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{item._count.inventoryMovements}</span>
                      </div>
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
                              setSelectedItem(item)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Item
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedItem(item)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Item
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Update item information</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <ItemForm
              item={selectedItem}
              suppliers={suppliers}
              onSubmit={handleItemSubmit}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedItem(null)
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
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedItem?.itemCode}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedItem(null)
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete Item"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}