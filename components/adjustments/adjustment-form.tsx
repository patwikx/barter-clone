"use client"

import React, { useState, useEffect } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdjustmentType } from "@prisma/client"
import { type CreateAdjustmentInput } from "@/lib/actions/adjustments-actions"
import { getItemsForTransfer } from "@/lib/actions/transfer-actions"

interface AdjustmentFormData {
  warehouseId: string
  adjustmentType: AdjustmentType
  reason: string
  notes: string
  adjustmentItems: Array<{
    itemId: string
    systemQuantity: string
    actualQuantity: string
  }>
}

interface AdjustmentFormProps {
  warehouses: Array<{ id: string; name: string; location: string | null }>
  onSubmit: (data: CreateAdjustmentInput) => void
  onCancel: () => void
  isLoading: boolean
}

interface AvailableItem {
  id: string
  itemCode: string
  description: string
  unitOfMeasure: string
  availableQuantity: number
}

export function AdjustmentForm({ warehouses, onSubmit, onCancel, isLoading }: AdjustmentFormProps) {
  const [formData, setFormData] = useState<AdjustmentFormData>({
    warehouseId: "",
    adjustmentType: AdjustmentType.PHYSICAL_COUNT,
    reason: "",
    notes: "",
    adjustmentItems: [{ itemId: "", systemQuantity: "", actualQuantity: "" }]
  })
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)

  // Load available items when warehouse changes
  useEffect(() => {
    if (formData.warehouseId) {
      setIsLoadingItems(true)
      getItemsForTransfer(formData.warehouseId)
        .then(result => {
          if (result.success) {
            setAvailableItems(result.data || [])
          } else {
            setAvailableItems([])
          }
        })
        .finally(() => setIsLoadingItems(false))
    } else {
      setAvailableItems([])
    }
  }, [formData.warehouseId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const adjustmentItems = formData.adjustmentItems
      .filter(item => item.itemId && item.systemQuantity && item.actualQuantity)
      .map(item => {
        const systemQty = parseFloat(item.systemQuantity)
        const actualQty = parseFloat(item.actualQuantity)
        const itemDetails = getItemDetails(item.itemId)
        const unitCost = itemDetails?.availableQuantity || 0 // This should come from current inventory
        
        return {
          itemId: item.itemId,
          systemQuantity: systemQty,
          actualQuantity: actualQty,
          unitCost: unitCost
        }
      })

    if (adjustmentItems.length === 0) {
      return
    }

    const createData: CreateAdjustmentInput = {
      warehouseId: formData.warehouseId,
      adjustmentType: formData.adjustmentType,
      reason: formData.reason,
      notes: formData.notes || undefined,
      adjustmentItems
    }
    
    onSubmit(createData)
  }

  const addAdjustmentItem = () => {
    setFormData(prev => ({
      ...prev,
      adjustmentItems: [...prev.adjustmentItems, { itemId: "", systemQuantity: "", actualQuantity: "" }]
    }))
  }

  const removeAdjustmentItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      adjustmentItems: prev.adjustmentItems.filter((_, i) => i !== index)
    }))
  }

  const updateAdjustmentItem = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      adjustmentItems: prev.adjustmentItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const getItemDetails = (itemId: string) => {
    return availableItems.find(item => item.id === itemId)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Warehouse and Adjustment Type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="warehouseId">Warehouse *</Label>
          <Select
            value={formData.warehouseId}
            onValueChange={(value) => {
              setFormData(prev => ({ 
                ...prev, 
                warehouseId: value,
                adjustmentItems: [{ itemId: "", systemQuantity: "", actualQuantity: "" }]
              }))
            }}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select warehouse" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  <div>
                    <div className="font-medium">{warehouse.name}</div>
                    {warehouse.location && (
                      <div className="text-sm text-gray-500">{warehouse.location}</div>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adjustmentType">Adjustment Type *</Label>
          <Select
            value={formData.adjustmentType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, adjustmentType: value as AdjustmentType }))}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(AdjustmentType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reason and Notes */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reason">Reason *</Label>
          <Input
            id="reason"
            value={formData.reason}
            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
            placeholder="Enter reason for adjustment"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Enter additional notes"
            disabled={isLoading}
            rows={3}
          />
        </div>
      </div>

      {/* Adjustment Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Adjustment Items</CardTitle>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addAdjustmentItem} 
              disabled={isLoading || !formData.warehouseId || isLoadingItems}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingItems ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading available items...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead className="text-right">System Qty</TableHead>
                  <TableHead className="text-right">Actual Qty</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.adjustmentItems.map((adjustmentItem, index) => {
                  const itemDetails = getItemDetails(adjustmentItem.itemId)
                  const systemQty = parseFloat(adjustmentItem.systemQuantity) || 0
                  const actualQty = parseFloat(adjustmentItem.actualQuantity) || 0
                  const variance = actualQty - systemQty

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={adjustmentItem.itemId}
                          onValueChange={(value) => {
                            updateAdjustmentItem(index, 'itemId', value)
                            // Auto-fill system quantity with current inventory
                            const item = getItemDetails(value)
                            if (item) {
                              updateAdjustmentItem(index, 'systemQuantity', item.availableQuantity.toString())
                            }
                          }}
                          disabled={isLoading || availableItems.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableItems.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                <div>
                                  <div className="font-medium">{item.itemCode}</div>
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {item.description}
                                  </div>
                                  <div className="text-xs text-blue-600">
                                    Current: {item.availableQuantity} {item.unitOfMeasure}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {itemDetails?.unitOfMeasure || "-"}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={adjustmentItem.systemQuantity}
                          onChange={(e) => updateAdjustmentItem(index, 'systemQuantity', e.target.value)}
                          placeholder="0"
                          disabled={isLoading || !adjustmentItem.itemId}
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={adjustmentItem.actualQuantity}
                          onChange={(e) => updateAdjustmentItem(index, 'actualQuantity', e.target.value)}
                          placeholder="0"
                          disabled={isLoading || !adjustmentItem.itemId}
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {variance > 0 ? '+' : ''}{variance.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formData.adjustmentItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAdjustmentItem(index)}
                            disabled={isLoading}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={
            isLoading || 
            !formData.warehouseId ||
            !formData.reason.trim() ||
            formData.adjustmentItems.filter(item => item.itemId && item.systemQuantity && item.actualQuantity).length === 0
          }
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Adjustment"
          )}
        </Button>
      </div>
    </form>
  )
}