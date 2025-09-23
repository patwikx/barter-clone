"use client"

import React, { useState, useTransition } from "react"
import {
  Package,
  Search,
  RefreshCw,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  TrendingUp,
  Building,
  Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { getCategoriesForSelection } from "@/lib/actions/category-actions"
import { CostingMethodType } from "@prisma/client"
import { ItemForm } from "./items-form"
import { toast } from "sonner"

interface ItemsViewProps {
  initialItems: ItemWithDetails[]
  suppliers: Array<{ id: string; name: string }>
}

export function ItemsView({ initialItems, suppliers }: ItemsViewProps) {
  const [items, setItems] = useState<ItemWithDetails[]>(initialItems)
  const [categories, setCategories] = useState<Array<{
    id: string
    name: string
    code: string | null
    parentCategory: { name: string } | null
  }>>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState("all")
  const [selectedCostingMethod, setSelectedCostingMethod] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedItem, setSelectedItem] = useState<ItemWithDetails | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Load categories on component mount
  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await getCategoriesForSelection()
        if (result.success && result.data) {
          setCategories(result.data)
        }
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }

    loadCategories()
  }, [])
  const handleRefresh = () => {
    startTransition(async () => {
      const filters: Partial<ItemFilters> = {
        search: searchQuery,
        supplierId: selectedSupplier,
        costingMethod: selectedCostingMethod,
        categoryId: selectedCategory
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFilterChange = () => {
    handleRefresh()
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedSupplier("all")
    setSelectedCostingMethod("all")
    setSelectedCategory("all")
    
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Items & Catalog</h1>
            <p className="text-gray-600">Manage your inventory items and product catalog</p>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Items Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Package className="w-6 h-6 mr-3 text-blue-600" />
                Items ({filteredItems.length})
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 w-64"
                  />
                </div>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="h-9 w-48">
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
                <Select value={selectedCostingMethod} onValueChange={setSelectedCostingMethod}>
                  <SelectTrigger className="h-9 w-48">
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
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-9 w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center">
                          <Tag className="w-4 h-4 mr-2" />
                          {category.code && (
                            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded mr-2">
                              {category.code}
                            </span>
                          )}
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={clearFilters} size="sm" className="h-9">
                  Clear
                </Button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-gray-50 rounded-full mb-4">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-500 text-center mb-8 max-w-sm">
                  {searchQuery ? "No items match your search criteria." : "Get started by adding your first item."}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Costing Method</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Standard Cost</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Movements</th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{item.itemCode}</div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {item.description}
                          </div>
                          <div className="text-xs text-gray-400">
                            UOM: {item.unitOfMeasure}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {item.category ? (
                          <div className="flex items-center space-x-2">
                            <Tag className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.category.name}</div>
                              {item.category.code && (
                                <div className="text-xs text-gray-500">{item.category.code}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{item.supplier.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <Badge variant="outline">
                          {item.costingMethod.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.standardCost)}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-600">
                          {formatNumber(item.reorderLevel)}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-blue-600">{item._count.currentInventory}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-purple-600">{item._count.inventoryMovements}</span>
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
    </div>
  )
}