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
import { type CreateWithdrawalInput } from "@/lib/actions/withdrawal-actions"
import { getItemsForTransfer } from "@/lib/actions/transfer-actions"

interface WithdrawalFormData {
  warehouseId: string
  purpose: string
  withdrawalItems: Array<{
    itemId: string
    quantity: string
  }>
}

interface WithdrawalFormProps {
  warehouses: Array<{ id: string; name: string; location: string | null }>
  onSubmit: (data: CreateWithdrawalInput) => void
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

export function WithdrawalForm({ warehouses, onSubmit, onCancel, isLoading }: WithdrawalFormProps) {
  const [formData, setFormData] = useState<WithdrawalFormData>({
    warehouseId: "",
    purpose: "",
    withdrawalItems: [{ itemId: "", quantity: "" }]
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
    
    const withdrawalItems = formData.withdrawalItems
      .filter(item => item.itemId && item.quantity)
      .map(item => ({
        itemId: item.itemId,
        quantity: parseFloat(item.quantity)
      }))

    if (withdrawalItems.length === 0) {
      return
    }

    const createData: CreateWithdrawalInput = {
      warehouseId: formData.warehouseId,
      purpose: formData.purpose || undefined,
      withdrawalItems
    }
    
    onSubmit(createData)
  }

  const addWithdrawalItem = () => {
    setFormData(prev => ({
      ...prev,
      withdrawalItems: [...prev.withdrawalItems, { itemId: "", quantity: "" }]
    }))
  }

  const removeWithdrawalItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      withdrawalItems: prev.withdrawalItems.filter((_, i) => i !== index)
    }))
  }

  const updateWithdrawalItem = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      withdrawalItems: prev.withdrawalItems.map((item, i) => 
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
      {/* Warehouse and Purpose */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="warehouseId">Warehouse *</Label>
          <Select
            value={formData.warehouseId}
            onValueChange={(value) => {
              setFormData(prev => ({ 
                ...prev, 
                warehouseId: value,
                withdrawalItems: [{ itemId: "", quantity: "" }] // Reset items when warehouse changes
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
          <Label htmlFor="purpose">Purpose</Label>
          <Textarea
            id="purpose"
            value={formData.purpose}
            onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
            placeholder="Enter purpose or reason for withdrawal"
            disabled={isLoading}
            rows={3}
          />
        </div>
      </div>

      {/* Withdrawal Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Withdrawal Items</CardTitle>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addWithdrawalItem} 
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
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">Withdraw Qty</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.withdrawalItems.map((withdrawalItem, index) => {
                  const itemDetails = getItemDetails(withdrawalItem.itemId)
                  const availableQty = getAvailableQuantity(withdrawalItem.itemId)
                  const withdrawQty = parseFloat(withdrawalItem.quantity) || 0

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={withdrawalItem.itemId}
                          onValueChange={(value) => updateWithdrawalItem(index, 'itemId', value)}
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
                          value={withdrawalItem.quantity}
                          onChange={(e) => updateWithdrawalItem(index, 'quantity', e.target.value)}
                          placeholder="0"
                          disabled={isLoading || !withdrawalItem.itemId}
                          className={`text-right ${withdrawQty > availableQty ? 'border-red-500' : ''}`}
                        />
                        {withdrawQty > availableQty && (
                          <div className="text-xs text-red-500 mt-1">
                            Exceeds available quantity
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {formData.withdrawalItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeWithdrawalItem(index)}
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
            formData.withdrawalItems.filter(item => item.itemId && item.quantity).length === 0 ||
            formData.withdrawalItems.some(item => {
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
            "Create Withdrawal Request"
          )}
        </Button>
      </div>
    </form>
  )
}