"use client"

import React, { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogFooter } from "@/components/ui/dialog"
import { CostingMethodType } from "@prisma/client"
import { type CreateItemInput, type UpdateItemInput, type ItemWithDetails } from "@/lib/actions/item-actions"
import { getCategoriesForSelection } from "@/lib/actions/category-actions"

interface ItemFormData {
  itemCode: string
  description: string
  unitOfMeasure: string
  standardCost: string
  costingMethod: CostingMethodType
  reorderLevel: string
  maxLevel: string
  minLevel: string
  supplierId: string
  categoryId: string
}

interface ItemFormProps {
  item?: ItemWithDetails
  suppliers: Array<{ id: string; name: string }>
  onSubmit: (data: CreateItemInput | UpdateItemInput) => void
  onCancel: () => void
  isLoading: boolean
}

export function ItemForm({ item, suppliers, onSubmit, onCancel, isLoading }: ItemFormProps) {
  const [categories, setCategories] = useState<Array<{
    id: string
    name: string
    code: string | null
    parentCategory: { name: string } | null
  }>>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  const [formData, setFormData] = useState<ItemFormData>({
    itemCode: item?.itemCode || "",
    description: item?.description || "",
    unitOfMeasure: item?.unitOfMeasure || "",
    standardCost: item?.standardCost?.toString() || "",
    costingMethod: item?.costingMethod || CostingMethodType.WEIGHTED_AVERAGE,
    reorderLevel: item?.reorderLevel?.toString() || "",
    maxLevel: item?.maxLevel?.toString() || "",
    minLevel: item?.minLevel?.toString() || "",
    supplierId: item?.supplier.id || "",
    categoryId: item?.category?.id || "",
  })

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await getCategoriesForSelection()
        if (result.success && result.data) {
          setCategories(result.data)
        }
      } catch (error) {
        console.error('Error loading categories:', error)
      } finally {
        setIsLoadingCategories(false)
      }
    }

    loadCategories()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const standardCost = parseFloat(formData.standardCost)
    const reorderLevel = formData.reorderLevel ? parseFloat(formData.reorderLevel) : undefined
    const maxLevel = formData.maxLevel ? parseFloat(formData.maxLevel) : undefined
    const minLevel = formData.minLevel ? parseFloat(formData.minLevel) : undefined

    if (item) {
      // Update operation
      const updateData: UpdateItemInput = {}
      
      if (formData.itemCode !== item.itemCode) updateData.itemCode = formData.itemCode
      if (formData.description !== item.description) updateData.description = formData.description
      if (formData.unitOfMeasure !== item.unitOfMeasure) updateData.unitOfMeasure = formData.unitOfMeasure
      if (standardCost !== item.standardCost) updateData.standardCost = standardCost
      if (formData.costingMethod !== item.costingMethod) updateData.costingMethod = formData.costingMethod
      if (reorderLevel !== item.reorderLevel) updateData.reorderLevel = reorderLevel
      if (maxLevel !== item.maxLevel) updateData.maxLevel = maxLevel
      if (minLevel !== item.minLevel) updateData.minLevel = minLevel
      if (formData.supplierId !== item.supplier.id) updateData.supplierId = formData.supplierId
      if (formData.categoryId !== (item.category?.id || "")) updateData.categoryId = formData.categoryId || undefined

      onSubmit(updateData)
    } else {
      // Create operation
      const createData: CreateItemInput = {
        itemCode: formData.itemCode,
        description: formData.description,
        unitOfMeasure: formData.unitOfMeasure,
        standardCost,
        costingMethod: formData.costingMethod,
        reorderLevel,
        maxLevel,
        minLevel,
        supplierId: formData.supplierId,
        categoryId: formData.categoryId || undefined,
      }
      
      onSubmit(createData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="itemCode">Item Code *</Label>
          <Input
            id="itemCode"
            value={formData.itemCode}
            onChange={(e) => setFormData(prev => ({ ...prev, itemCode: e.target.value }))}
            placeholder="Enter item code"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
          <Input
            id="unitOfMeasure"
            value={formData.unitOfMeasure}
            onChange={(e) => setFormData(prev => ({ ...prev, unitOfMeasure: e.target.value }))}
            placeholder="e.g., pieces, kg, liters"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter item description"
          required
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="standardCost">Standard Cost *</Label>
          <Input
            id="standardCost"
            type="number"
            step="0.01"
            min="0"
            value={formData.standardCost}
            onChange={(e) => setFormData(prev => ({ ...prev, standardCost: e.target.value }))}
            placeholder="0.00"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="costingMethod">Costing Method</Label>
          <Select
            value={formData.costingMethod}
            onValueChange={(value) => setFormData(prev => ({ ...prev, costingMethod: value as CostingMethodType }))}
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

      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
          disabled={isLoading || isLoadingCategories}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No Category</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center">
                  {category.code && (
                    <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded mr-2">
                      {category.code}
                    </span>
                  )}
                  <span>{category.name}</span>
                  {category.parentCategory && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({category.parentCategory.name})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplierId">Supplier *</Label>
        <Select
          value={formData.supplierId}
          onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select supplier" />
          </SelectTrigger>
          <SelectContent>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minLevel">Min Level</Label>
          <Input
            id="minLevel"
            type="number"
            step="0.01"
            min="0"
            value={formData.minLevel}
            onChange={(e) => setFormData(prev => ({ ...prev, minLevel: e.target.value }))}
            placeholder="0"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reorderLevel">Reorder Level</Label>
          <Input
            id="reorderLevel"
            type="number"
            step="0.01"
            min="0"
            value={formData.reorderLevel}
            onChange={(e) => setFormData(prev => ({ ...prev, reorderLevel: e.target.value }))}
            placeholder="0"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxLevel">Max Level</Label>
          <Input
            id="maxLevel"
            type="number"
            step="0.01"
            min="0"
            value={formData.maxLevel}
            onChange={(e) => setFormData(prev => ({ ...prev, maxLevel: e.target.value }))}
            placeholder="0"
            disabled={isLoading}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !formData.itemCode.trim() || !formData.description.trim() || !formData.supplierId}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {item ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{item ? "Update Item" : "Create Item"}</>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}