"use client"

import React, { useState } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type CreatePurchaseInput } from "@/lib/actions/purchase-actions"

interface PurchaseFormData {
  supplierId: string
  purchaseItems: Array<{
    itemId: string
    quantity: string
    unitCost: string
  }>
}

interface PurchaseFormProps {
  suppliers: Array<{ id: string; name: string }>
  items: Array<{
    id: string
    itemCode: string
    description: string
    unitOfMeasure: string
    standardCost: number
  }>
  onSubmit: (data: CreatePurchaseInput) => void
  onCancel: () => void
  isLoading: boolean
}

export function PurchaseForm({ suppliers, items, onSubmit, onCancel, isLoading }: PurchaseFormProps) {
  const [formData, setFormData] = useState<PurchaseFormData>({
    supplierId: "",
    purchaseItems: [{ itemId: "", quantity: "", unitCost: "" }]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const purchaseItems = formData.purchaseItems
      .filter(item => item.itemId && item.quantity && item.unitCost)
      .map(item => ({
        itemId: item.itemId,
        quantity: parseFloat(item.quantity),
        unitCost: parseFloat(item.unitCost)
      }))

    if (purchaseItems.length === 0) {
      return
    }

    const createData: CreatePurchaseInput = {
      supplierId: formData.supplierId,
      purchaseItems
    }
    
    onSubmit(createData)
  }

  const addPurchaseItem = () => {
    setFormData(prev => ({
      ...prev,
      purchaseItems: [...prev.purchaseItems, { itemId: "", quantity: "", unitCost: "" }]
    }))
  }

  const removePurchaseItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      purchaseItems: prev.purchaseItems.filter((_, i) => i !== index)
    }))
  }

  const updatePurchaseItem = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      purchaseItems: prev.purchaseItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const calculateTotal = () => {
    return formData.purchaseItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0
      const unitCost = parseFloat(item.unitCost) || 0
      return sum + (quantity * unitCost)
    }, 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const getItemDetails = (itemId: string) => {
    return items.find(item => item.id === itemId)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Supplier Selection */}
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

      {/* Purchase Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Purchase Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addPurchaseItem} disabled={isLoading}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>UOM</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.purchaseItems.map((purchaseItem, index) => {
                const itemDetails = getItemDetails(purchaseItem.itemId)
                const quantity = parseFloat(purchaseItem.quantity) || 0
                const unitCost = parseFloat(purchaseItem.unitCost) || 0
                const total = quantity * unitCost

                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={purchaseItem.itemId}
                        onValueChange={(value) => {
                          updatePurchaseItem(index, 'itemId', value)
                          // Auto-fill unit cost with standard cost
                          const item = getItemDetails(value)
                          if (item) {
                            updatePurchaseItem(index, 'unitCost', item.standardCost.toString())
                          }
                        }}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              <div>
                                <div className="font-medium">{item.itemCode}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {item.description}
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
                        value={purchaseItem.quantity}
                        onChange={(e) => updatePurchaseItem(index, 'quantity', e.target.value)}
                        placeholder="0"
                        disabled={isLoading}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={purchaseItem.unitCost}
                        onChange={(e) => updatePurchaseItem(index, 'unitCost', e.target.value)}
                        placeholder="0.00"
                        disabled={isLoading}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(total)}
                    </TableCell>
                    <TableCell>
                      {formData.purchaseItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePurchaseItem(index)}
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
          
          <div className="p-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Order Value:</span>
              <span className="text-xl font-bold">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
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
            !formData.supplierId || 
            formData.purchaseItems.filter(item => item.itemId && item.quantity && item.unitCost).length === 0
          }
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Purchase Order"
          )}
        </Button>
      </div>
    </form>
  )
}