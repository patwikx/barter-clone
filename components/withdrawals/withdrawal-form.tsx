"use client"

import React, { useState, useEffect } from "react"
import { Loader2, Plus, Trash2, Check, ChevronsUpDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  const [warehouseComboOpen, setWarehouseComboOpen] = useState(false)
  const [itemComboOpen, setItemComboOpen] = useState<{ [key: number]: boolean }>({})

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

  const getWarehouseDisplay = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId)
    if (!warehouse) return ""
    return warehouse.location ? `${warehouse.name} (${warehouse.location})` : warehouse.name
  }

  const toggleItemCombo = (index: number, isOpen: boolean) => {
    setItemComboOpen(prev => ({ ...prev, [index]: isOpen }))
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Warehouse Selection */}
      <div className="space-y-3">
        <Label htmlFor="warehouseId" className="text-base font-semibold text-gray-900">Warehouse *</Label>
        <Popover open={warehouseComboOpen} onOpenChange={setWarehouseComboOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={warehouseComboOpen}
              className="w-full justify-between h-12 text-left font-normal"
              disabled={isLoading}
            >
              <div className="flex items-center">
                <Search className="w-4 h-4 mr-2 text-gray-400" />
                {formData.warehouseId
                  ? getWarehouseDisplay(formData.warehouseId)
                  : "Search and select warehouse..."}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search warehouses..." className="h-9" />
              <CommandList>
                <CommandEmpty>No warehouse found.</CommandEmpty>
                <CommandGroup>
                  {warehouses.map((warehouse) => (
                    <CommandItem
                      key={warehouse.id}
                      value={`${warehouse.name} ${warehouse.location || ""}`}
                      onSelect={() => {
                        setFormData(prev => ({ 
                          ...prev, 
                          warehouseId: warehouse.id,
                          withdrawalItems: [{ itemId: "", quantity: "" }] // Reset items when warehouse changes
                        }))
                        setWarehouseComboOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          formData.warehouseId === warehouse.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div>
                        <div className="font-medium">{warehouse.name}</div>
                        {warehouse.location && (
                          <div className="text-sm text-gray-500">{warehouse.location}</div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Purpose */}
      <div className="space-y-3">
        <Label htmlFor="purpose" className="text-base font-semibold text-gray-900">Purpose</Label>
        <Textarea
          id="purpose"
          value={formData.purpose}
          onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
          placeholder="Enter purpose or reason for withdrawal..."
          disabled={isLoading}
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Withdrawal Items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Withdrawal Items</h3>
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
        </div>
        <div className="overflow-x-auto">
          {isLoadingItems ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mr-3 text-blue-600" />
              <span className="text-gray-600">Loading available items...</span>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Item Code</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[250px]">Description</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">UOM</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">Available</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Withdraw Qty</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[60px]">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.withdrawalItems.map((withdrawalItem, index) => {
                    const itemDetails = getItemDetails(withdrawalItem.itemId)
                    const availableQty = getAvailableQuantity(withdrawalItem.itemId)
                    const withdrawQty = parseFloat(withdrawalItem.quantity) || 0

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
                                disabled={isLoading || availableItems.length === 0}
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
                                    {availableItems.map((item) => (
                                      <CommandItem
                                        key={item.id}
                                        value={`${item.itemCode} ${item.description}`}
                                        onSelect={() => {
                                          updateWithdrawalItem(index, 'itemId', item.id)
                                          toggleItemCombo(index, false)
                                        }}
                                        className="flex flex-col items-start p-3"
                                      >
                                        <div className="flex items-center w-full">
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4 flex-shrink-0",
                                              withdrawalItem.itemId === item.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col min-w-0 flex-1">
                                            <div className="font-medium text-gray-900">{item.itemCode}</div>
                                            <div className="text-sm text-gray-600 truncate">{item.description}</div>
                                            <div className="text-xs text-blue-600">
                                              Available: {formatNumber(item.availableQuantity)} {item.unitOfMeasure}
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

                        {/* Available */}
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-blue-600">
                            {formatNumber(availableQty)}
                          </div>
                        </td>

                        {/* Withdraw Quantity */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max={availableQty}
                              value={withdrawalItem.quantity}
                              onChange={(e) => updateWithdrawalItem(index, 'quantity', e.target.value)}
                              placeholder="0"
                              disabled={isLoading || !withdrawalItem.itemId}
                              className={`text-right h-10 ${withdrawQty > availableQty ? 'border-red-500' : ''}`}
                            />
                            {withdrawQty > availableQty && (
                              <div className="text-xs text-red-500">
                                Exceeds available
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          {formData.withdrawalItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeWithdrawalItem(index)}
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
                  <span className="text-lg font-semibold text-gray-900">Total Items:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatNumber(formData.withdrawalItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0))}
                  </span>
                </div>
              </div>
            </>
          )}
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
            !formData.warehouseId ||
            formData.withdrawalItems.filter(item => item.itemId && item.quantity).length === 0 ||
            formData.withdrawalItems.some(item => {
              const qty = parseFloat(item.quantity) || 0
              const available = getAvailableQuantity(item.itemId)
              return qty > available
            })
          }
          className="h-12 px-6"
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