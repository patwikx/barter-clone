"use client"

import React, { useState, useEffect } from "react"
import { Loader2, Plus, Trash2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreateTransferInput, getItemsForTransfer } from "@/lib/actions/transfer-actions"


interface TransferFormData {
  fromWarehouseId: string
  toWarehouseId: string
  notes: string
  transferItems: Array<{
    itemId: string
    quantity: string
  }>
}

interface TransferFormProps {
  warehouses: Array<{ id: string; name: string; location: string | null }>
  onSubmit: (data: CreateTransferInput) => void
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

export function TransferForm({ warehouses, onSubmit, onCancel, isLoading }: TransferFormProps) {
  const [formData, setFormData] = useState<TransferFormData>({
    fromWarehouseId: "",
    toWarehouseId: "",
    notes: "",
    transferItems: [{ itemId: "", quantity: "" }]
  })
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)

  // Load available items when source warehouse changes
  useEffect(() => {
    if (formData.fromWarehouseId) {
      setIsLoadingItems(true)
      getItemsForTransfer(formData.fromWarehouseId)
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
  }, [formData.fromWarehouseId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const transferItems = formData.transferItems
      .filter(item => item.itemId && item.quantity)
      .map(item => ({
        itemId: item.itemId,
        quantity: parseFloat(item.quantity)
      }))

    if (transferItems.length === 0) {
      return
    }

    const createData: CreateTransferInput = {
      fromWarehouseId: formData.fromWarehouseId,
      toWarehouseId: formData.toWarehouseId,
      notes: formData.notes || undefined,
      transferItems
    }
    
    onSubmit(createData)
  }

  const addTransferItem = () => {
    setFormData(prev => ({
      ...prev,
      transferItems: [...prev.transferItems, { itemId: "", quantity: "" }]
    }))
  }

  const removeTransferItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      transferItems: prev.transferItems.filter((_, i) => i !== index)
    }))
  }

  const updateTransferItem = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      transferItems: prev.transferItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const getItemDetails = (itemId: string) => {
    return availableItems.find(item => item.id === itemId)
  }

  const getAvailableQuantity = (itemId: string) => {
    const item = getItemDetails(itemId)
    return item?.availableQuantity || 0
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Warehouse Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromWarehouseId">From Warehouse *</Label>
          <Select
            value={formData.fromWarehouseId}
            onValueChange={(value) => {
              setFormData(prev => ({ 
                ...prev, 
                fromWarehouseId: value,
                transferItems: [{ itemId: "", quantity: "" }] // Reset items when warehouse changes
              }))
            }}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source warehouse" />
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
          <Label htmlFor="toWarehouseId">To Warehouse *</Label>
          <Select
            value={formData.toWarehouseId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, toWarehouseId: value }))}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select destination warehouse" />
            </SelectTrigger>
            <SelectContent>
              {warehouses
                .filter(w => w.id !== formData.fromWarehouseId)
                .map((warehouse) => (
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
      </div>

      {/* Transfer Direction Indicator */}
      {formData.fromWarehouseId && formData.toWarehouseId && (
        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <span className="font-medium text-blue-900">
              {warehouses.find(w => w.id === formData.fromWarehouseId)?.name}
            </span>
            <ArrowRight className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {warehouses.find(w => w.id === formData.toWarehouseId)?.name}
            </span>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Enter transfer notes or reason"
          disabled={isLoading}
          rows={3}
        />
      </div>

      {/* Transfer Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transfer Items</CardTitle>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addTransferItem} 
              disabled={isLoading || !formData.fromWarehouseId || isLoadingItems}
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
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">Transfer Qty</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.transferItems.map((transferItem, index) => {
                  const itemDetails = getItemDetails(transferItem.itemId)
                  const availableQty = getAvailableQuantity(transferItem.itemId)
                  const transferQty = parseFloat(transferItem.quantity) || 0

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={transferItem.itemId}
                          onValueChange={(value) => updateTransferItem(index, 'itemId', value)}
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
                                    Available: {item.availableQuantity} {item.unitOfMeasure}
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
                      <TableCell className="text-right">
                        <span className="font-medium text-blue-600">
                          {availableQty.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={availableQty}
                          value={transferItem.quantity}
                          onChange={(e) => updateTransferItem(index, 'quantity', e.target.value)}
                          placeholder="0"
                          disabled={isLoading || !transferItem.itemId}
                          className={`text-right ${transferQty > availableQty ? 'border-red-500' : ''}`}
                        />
                        {transferQty > availableQty && (
                          <div className="text-xs text-red-500 mt-1">
                            Exceeds available quantity
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {formData.transferItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTransferItem(index)}
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
            !formData.fromWarehouseId || 
            !formData.toWarehouseId ||
            formData.transferItems.filter(item => item.itemId && item.quantity).length === 0 ||
            formData.transferItems.some(item => {
              const qty = parseFloat(item.quantity) || 0
              const available = getAvailableQuantity(item.itemId)
              return qty > available
            })
          }
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Transfer"
          )}
        </Button>
      </div>
    </form>
  )
}