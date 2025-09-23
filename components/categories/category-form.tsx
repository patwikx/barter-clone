"use client"

import React, { useState } from "react"
import { Loader2, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DialogFooter } from "@/components/ui/dialog"
import { CostingMethodType } from "@prisma/client"
import { type CreateCategoryInput, type UpdateCategoryInput, type CategoryWithDetails } from "@/lib/actions/category-actions"

interface CategoryFormData {
  name: string
  description: string
  code: string
  isActive: boolean
  requiresApproval: boolean
  defaultCostMethod: CostingMethodType
  parentCategoryId: string
}

interface CategoryFormProps {
  category?: CategoryWithDetails
  categories: CategoryWithDetails[]
  onSubmit: (data: CreateCategoryInput | UpdateCategoryInput) => void
  onCancel: () => void
  isLoading: boolean
}

export function CategoryForm({ category, categories, onSubmit, onCancel, isLoading }: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || "",
    description: category?.description || "",
    code: category?.code || "",
    isActive: category?.isActive ?? true,
    requiresApproval: category?.requiresApproval ?? false,
    defaultCostMethod: category?.defaultCostMethod || CostingMethodType.WEIGHTED_AVERAGE,
    parentCategoryId: category?.parentCategoryId || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (category) {
      // Update operation
      const updateData: UpdateCategoryInput = {}
      
      if (formData.name !== category.name) updateData.name = formData.name
      if (formData.description !== (category.description || "")) updateData.description = formData.description || undefined
      if (formData.code !== (category.code || "")) updateData.code = formData.code || undefined
      if (formData.isActive !== category.isActive) updateData.isActive = formData.isActive
      if (formData.requiresApproval !== category.requiresApproval) updateData.requiresApproval = formData.requiresApproval
      if (formData.defaultCostMethod !== category.defaultCostMethod) updateData.defaultCostMethod = formData.defaultCostMethod
      if (formData.parentCategoryId !== (category.parentCategoryId || "")) updateData.parentCategoryId = formData.parentCategoryId || undefined

      onSubmit(updateData)
    } else {
      // Create operation
      const createData: CreateCategoryInput = {
        name: formData.name,
        description: formData.description || undefined,
        code: formData.code || undefined,
        isActive: formData.isActive,
        requiresApproval: formData.requiresApproval,
        defaultCostMethod: formData.defaultCostMethod,
        parentCategoryId: formData.parentCategoryId || undefined,
      }
      
      onSubmit(createData)
    }
  }

  // Filter out current category and its descendants from parent options
  const availableParentCategories = categories.filter(cat => 
    cat.id !== category?.id && 
    cat.parentCategoryId !== category?.id &&
    cat.parentCategoryId === null // Only show root categories as potential parents
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Category Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter category name"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">Category Code</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
            placeholder="e.g., RAW, FIN, CONS"
            disabled={isLoading}
            maxLength={10}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter category description"
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parentCategoryId">Parent Category</Label>
          <Select
            value={formData.parentCategoryId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, parentCategoryId: value }))}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select parent category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No Parent (Root Category)</SelectItem>
              {availableParentCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    {cat.code && (
                      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded mr-2">
                        {cat.code}
                      </span>
                    )}
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultCostMethod">Default Costing Method</Label>
          <Select
            value={formData.defaultCostMethod}
            onValueChange={(value) => setFormData(prev => ({ ...prev, defaultCostMethod: value as CostingMethodType }))}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(CostingMethodType).map((method) => (
                <SelectItem key={method} value={method}>
                  {method.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Category Settings</Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <Switch 
                id="isActive" 
                checked={formData.isActive} 
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                disabled={isLoading}
              />
              <Label htmlFor="isActive" className="text-sm text-gray-600">
                Category is active
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <Switch 
                id="requiresApproval" 
                checked={formData.requiresApproval} 
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresApproval: checked }))}
                disabled={isLoading}
              />
              <Label htmlFor="requiresApproval" className="text-sm text-gray-600">
                Requires approval for transactions
              </Label>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !formData.name.trim()}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {category ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{category ? "Update Category" : "Create Category"}</>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}