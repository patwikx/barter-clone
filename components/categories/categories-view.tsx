"use client"

import React, { useState, useTransition } from "react"
import {
  Tag,
  Search,
  RefreshCw,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Package,
  Layers,
  CheckCircle,
  XCircle,
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
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  type CategoryWithDetails, 
  type CreateCategoryInput, 
  type UpdateCategoryInput, 
  type CategoryFilters 
} from "@/lib/actions/category-actions"
import { CategoryForm } from "./category-form"
import { toast } from "sonner"

interface CategoriesViewProps {
  initialCategories: CategoryWithDetails[]
}

export function CategoriesView({ initialCategories }: CategoriesViewProps) {
  const [categories, setCategories] = useState<CategoryWithDetails[]>(initialCategories)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedParentCategory, setSelectedParentCategory] = useState("all")
  const [selectedActiveStatus, setSelectedActiveStatus] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithDetails | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const filters: Partial<CategoryFilters> = {
        search: searchQuery,
        parentCategoryId: selectedParentCategory,
        isActive: selectedActiveStatus
      }

      const result = await getCategories(filters)
      
      if (result.success) {
        setCategories(result.data || [])
        toast.success("Categories data refreshed")
      } else {
        toast.error(result.error || "Failed to refresh categories")
      }
    })
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedParentCategory("all")
    setSelectedActiveStatus("all")
    
    startTransition(async () => {
      const result = await getCategories()
      if (result.success) {
        setCategories(result.data || [])
      }
    })
  }

  const handleCategorySubmit = (data: CreateCategoryInput | UpdateCategoryInput) => {
    startTransition(async () => {
      if (selectedCategory) {
        // Update operation
        const result = await updateCategory(selectedCategory.id, data as UpdateCategoryInput)

        if (result.success && result.data) {
          setCategories(prev => prev.map(category => 
            category.id === selectedCategory.id ? result.data! : category
          ))
          setIsEditDialogOpen(false)
          setSelectedCategory(null)
          toast.success("Category updated successfully")
        } else {
          toast.error(result.error || "Failed to update category")
        }
      } else {
        // Create operation
        const result = await createCategory(data as CreateCategoryInput)

        if (result.success && result.data) {
          setCategories(prev => [result.data!, ...prev])
          setIsCreateDialogOpen(false)
          toast.success("Category created successfully")
        } else {
          toast.error(result.error || "Failed to create category")
        }
      }
    })
  }

  const handleDeleteCategory = () => {
    if (!selectedCategory) return

    startTransition(async () => {
      const result = await deleteCategory(selectedCategory.id)

      if (result.success) {
        setCategories(prev => prev.filter(category => category.id !== selectedCategory.id))
        setIsDeleteDialogOpen(false)
        setSelectedCategory(null)
        toast.success("Category deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete category")
      }
    })
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num)
  }

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (category.code && category.code.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesSearch
  })

  // Get parent categories for filter
  const parentCategories = categories.filter(cat => cat.parentCategoryId === null)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Item Categories</h1>
            <p className="text-gray-600">Organize and manage your inventory item categories</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedCategory(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                  <DialogDescription>Add a new item category to organize your inventory</DialogDescription>
                </DialogHeader>
                <CategoryForm
                  categories={categories}
                  onSubmit={handleCategorySubmit}
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

        {/* Categories Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Tag className="w-6 h-6 mr-3 text-blue-600" />
                Categories ({filteredCategories.length})
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 w-64"
                  />
                </div>
                <Select value={selectedParentCategory} onValueChange={setSelectedParentCategory}>
                  <SelectTrigger className="h-9 w-48">
                    <SelectValue placeholder="All Parent Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="root">Root Categories</SelectItem>
                    {parentCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedActiveStatus} onValueChange={setSelectedActiveStatus}>
                  <SelectTrigger className="h-9 w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={clearFilters} size="sm" className="h-9">
                  Clear
                </Button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {filteredCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-gray-50 rounded-full mb-4">
                  <Tag className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
                <p className="text-gray-500 text-center mb-8 max-w-sm">
                  {searchQuery ? "No categories match your search criteria." : "Get started by adding your first item category."}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Category</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Method</th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategories</th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Tag className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{category.name}</div>
                            {category.code && (
                              <div className="text-xs text-gray-500">Code: {category.code}</div>
                            )}
                            {category.description && (
                              <div className="text-xs text-gray-400 max-w-xs truncate">
                                {category.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {category.parentCategory ? (
                          <div className="flex items-center space-x-2">
                            <Layers className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{category.parentCategory.name}</div>
                              {category.parentCategory.code && (
                                <div className="text-xs text-gray-500">{category.parentCategory.code}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Root Category</span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <Badge variant="outline">
                          {category.defaultCostMethod.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-blue-600">{category._count.items}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Layers className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-purple-600">{category._count.childCategories}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
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
                                setSelectedCategory(category)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Category
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedCategory(category)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Category
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
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>Update category information</DialogDescription>
            </DialogHeader>
            {selectedCategory && (
              <CategoryForm
                category={selectedCategory}
                categories={categories}
                onSubmit={handleCategorySubmit}
                onCancel={() => {
                  setIsEditDialogOpen(false)
                  setSelectedCategory(null)
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
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedCategory?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setSelectedCategory(null)
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCategory} disabled={isPending}>
                {isPending ? "Deleting..." : "Delete Category"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}