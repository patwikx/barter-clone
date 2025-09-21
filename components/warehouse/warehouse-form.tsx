"use client"

import React, { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogFooter } from "@/components/ui/dialog"
import { CostingMethodType } from "@prisma/client"
import { type CreateWarehouseInput, type UpdateWarehouseInput, type WarehouseWithDetails } from "@/lib/actions/warehouse-actions"

// Create a unified form data type
interface WarehouseFormData {
  name: string
  location: string
  description: string
  isMainWarehouse: boolean
  defaultCostingMethod: CostingMethodType
}

interface WarehouseFormProps {
  warehouse?: WarehouseWithDetails
  onSubmit: (data: CreateWarehouseInput | UpdateWarehouseInput) => void
  onCancel: () => void
  isLoading: boolean
}

export function WarehouseForm({ warehouse, onSubmit, onCancel, isLoading }: WarehouseFormProps) {
  const [formData, setFormData] = useState<WarehouseFormData>({
    name: warehouse?.name || "",
    location: warehouse?.location || "",
    description: warehouse?.description || "",
    isMainWarehouse: warehouse?.isMainWarehouse || false,
    defaultCostingMethod: warehouse?.defaultCostingMethod || CostingMethodType.WEIGHTED_AVERAGE,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Transform form data based on whether we're creating or updating
    if (warehouse) {
      // For updates, only send changed fields
      const updateData: UpdateWarehouseInput = {}
      
      if (formData.name !== warehouse.name) {
        updateData.name = formData.name
      }
      if (formData.location !== (warehouse.location || "")) {
        updateData.location = formData.location || undefined
      }
      if (formData.description !== (warehouse.description || "")) {
        updateData.description = formData.description || undefined
      }
      if (formData.isMainWarehouse !== warehouse.isMainWarehouse) {
        updateData.isMainWarehouse = formData.isMainWarehouse
      }
      if (formData.defaultCostingMethod !== warehouse.defaultCostingMethod) {
        updateData.defaultCostingMethod = formData.defaultCostingMethod
      }

      // Always include name for updates to ensure it's not undefined
      if (!updateData.name) {
        updateData.name = formData.name
      }

      onSubmit(updateData)
    } else {
      // For creation, send all required fields
      const createData: CreateWarehouseInput = {
        name: formData.name,
        location: formData.location || undefined,
        description: formData.description || undefined,
        isMainWarehouse: formData.isMainWarehouse,
        defaultCostingMethod: formData.defaultCostingMethod,
      }
      
      onSubmit(createData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Warehouse Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter warehouse name"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          placeholder="Enter warehouse location/address"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter warehouse description"
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultCostingMethod">Default Costing Method</Label>
        <Select
          value={formData.defaultCostingMethod}
          onValueChange={(value) => setFormData(prev => ({ ...prev, defaultCostingMethod: value as CostingMethodType }))}
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

      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Warehouse Settings</Label>
        <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <Switch 
            id="isMainWarehouse" 
            checked={formData.isMainWarehouse} 
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isMainWarehouse: checked }))}
            disabled={isLoading}
          />
          <Label htmlFor="isMainWarehouse" className="text-sm text-gray-600">
            Set as main warehouse
          </Label>
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
              {warehouse ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{warehouse ? "Update Warehouse" : "Create Warehouse"}</>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}