"use client"

import React, { useState } from "react"
import { Loader2, Plus, Trash2, Check, ChevronsUpDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
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
  const [supplierComboOpen, setSupplierComboOpen] = useState(false)
  const [itemComboOpen, setItemComboOpen] = useState<{ [key: number]: boolean }>({})

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
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getItemDetails = (itemId: string) => {
    return items.find(item => item.id === itemId)
  }

  const getSupplierName = (supplierId: string) => {
    return suppliers.find(supplier => supplier.id === supplierId)?.name || ""
  }

  const toggleItemCombo = (index: number, isOpen: boolean) => {
    setItemComboOpen(prev => ({ ...prev, [index]: isOpen }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Supplier Selection with Combobox */}
      <div className="space-y-3">
        <Label htmlFor="supplierId" className="text-base font-semibold text-gray-900">Supplier *</Label>
        <Popover open={supplierComboOpen} onOpenChange={setSupplierComboOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={supplierComboOpen}
              className="w-full justify-between h-12 text-left font-normal"
              disabled={isLoading}
            >
              <div className="flex items-center">
                <Search className="w-4 h-4 mr-2 text-gray-400" />
                {formData.supplierId
                  ? getSupplierName(formData.supplierId)
                  : "Search and select supplier..."}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search suppliers..." className="h-9" />
              <CommandList>
                <CommandEmpty>No supplier found.</CommandEmpty>
                <CommandGroup>
                  {suppliers.map((supplier) => (
                    <CommandItem
                      key={supplier.id}
                      value={supplier.name}
                      onSelect={() => {
                        setFormData(prev => ({ ...prev, supplierId: supplier.id }))
                        setSupplierComboOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          formData.supplierId === supplier.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {supplier.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Purchase Items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Purchase Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={addPurchaseItem} disabled={isLoading}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">Item Code</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[250px]">Description</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">UOM</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Quantity</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Unit Cost</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Total</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[60px]">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.purchaseItems.map((purchaseItem, index) => {
                const itemDetails = getItemDetails(purchaseItem.itemId)
                const quantity = parseFloat(purchaseItem.quantity) || 0
                const unitCost = parseFloat(purchaseItem.unitCost) || 0
                const total = quantity * unitCost

                return (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    {/* Item Code */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {itemDetails?.itemCode || "-"}
                      </div>
                    </td>
                    
                    {/* Item Description with Combobox */}
                    <td className="py-4 px-4">
                      <Popover 
                        open={itemComboOpen[index] || false} 
                        onOpenChange={(isOpen) => toggleItemCombo(index, isOpen)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={itemComboOpen[index] || false}
                            className="w-full justify-between h-10 text-left font-normal"
                            disabled={isLoading}
                          >
                            <div className="flex items-center min-w-0">
                              <Search className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span className="truncate">
                                {itemDetails?.description || "Search and select item..."}
                              </span>
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-96 p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search items..." className="h-9" />
                            <CommandList>
                              <CommandEmpty>No item found.</CommandEmpty>
                              <CommandGroup>
                                {items.map((item) => (
                                  <CommandItem
                                    key={item.id}
                                    value={`${item.itemCode} ${item.description}`}
                                    onSelect={() => {
                                      updatePurchaseItem(index, 'itemId', item.id)
                                      updatePurchaseItem(index, 'unitCost', item.standardCost.toString())
                                      toggleItemCombo(index, false)
                                    }}
                                    className="flex flex-col items-start p-3"
                                  >
                                    <div className="flex items-center w-full">
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4 flex-shrink-0",
                                          purchaseItem.itemId === item.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col min-w-0 flex-1">
                                        <div className="font-medium text-gray-900">{item.itemCode}</div>
                                        <div className="text-sm text-gray-600 truncate">{item.description}</div>
                                        <div className="text-xs text-gray-500">
                                          UOM: {item.unitOfMeasure} • Standard Cost: {formatCurrency(item.standardCost)}
                                        </div>
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </td>

                    {/* UOM */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {itemDetails?.unitOfMeasure || "-"}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={purchaseItem.quantity}
                        onChange={(e) => updatePurchaseItem(index, 'quantity', e.target.value)}
                        placeholder="0"
                        disabled={isLoading}
                        className="text-right h-10"
                      />
                    </td>

                    {/* Unit Cost */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={purchaseItem.unitCost}
                        onChange={(e) => updatePurchaseItem(index, 'unitCost', e.target.value)}
                        placeholder="0.00"
                        disabled={isLoading}
                        className="text-right h-10"
                      />
                    </td>

                    {/* Total */}
                    <td className="py-4 px-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(total)}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      {formData.purchaseItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePurchaseItem(index)}
                          disabled={isLoading}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          <div className="px-8 py-6 border-t border-gray-200 bg-gray-50/50">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Order Value:</span>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="h-12 px-6">
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={
            isLoading || 
            !formData.supplierId || 
            formData.purchaseItems.filter(item => item.itemId && item.quantity && item.unitCost).length === 0
          }
          className="h-12 px-6"
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