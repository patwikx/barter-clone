"use client"

import React, { useState, useEffect } from "react"
import { Loader2, Plus, Trash2, ArrowRight, Check, ChevronsUpDown, Search } from "lucide-react"
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
  const [fromWarehouseComboOpen, setFromWarehouseComboOpen] = useState(false)
  const [toWarehouseComboOpen, setToWarehouseComboOpen] = useState(false)
  const [itemComboOpen, setItemComboOpen] = useState<{ [key: number]: boolean }>({})

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

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId)
    return warehouse ? warehouse.name : ""
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="fromWarehouseId" className="text-base font-semibold text-gray-900">From Warehouse *</Label>
          <Popover open={fromWarehouseComboOpen} onOpenChange={setFromWarehouseComboOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={fromWarehouseComboOpen}
                className="w-full justify-between h-12 text-left font-normal"
                disabled={isLoading}
              >
                <div className="flex items-center">
                  <Search className="w-4 h-4 mr-2 text-gray-400" />
                  {formData.fromWarehouseId
                    ? getWarehouseDisplay(formData.fromWarehouseId)
                    : "Search and select source warehouse..."}
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
                            fromWarehouseId: warehouse.id,
                            transferItems: [{ itemId: "", quantity: "" }] // Reset items when warehouse changes
                          }))
                          setFromWarehouseComboOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.fromWarehouseId === warehouse.id ? "opacity-100" : "opacity-0"
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

        <div className="space-y-3">
          <Label htmlFor="toWarehouseId" className="text-base font-semibold text-gray-900">To Warehouse *</Label>
          <Popover open={toWarehouseComboOpen} onOpenChange={setToWarehouseComboOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={toWarehouseComboOpen}
                className="w-full justify-between h-12 text-left font-normal"
                disabled={isLoading}
              >
                <div className="flex items-center">
                  <Search className="w-4 h-4 mr-2 text-gray-400" />
                  {formData.toWarehouseId
                    ? getWarehouseDisplay(formData.toWarehouseId)
                    : "Search and select destination warehouse..."}
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
                    {warehouses
                      .filter(w => w.id !== formData.fromWarehouseId)
                      .map((warehouse) => (
                      <CommandItem
                        key={warehouse.id}
                        value={`${warehouse.name} ${warehouse.location || ""}`}
                        onSelect={() => {
                          setFormData(prev => ({ ...prev, toWarehouseId: warehouse.id }))
                          setToWarehouseComboOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.toWarehouseId === warehouse.id ? "opacity-100" : "opacity-0"
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
      </div>

      {/* Transfer Direction Indicator */}
      {formData.fromWarehouseId && formData.toWarehouseId && (
        <div className="flex items-center justify-center p-6 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="font-semibold text-blue-900">
                {getWarehouseName(formData.fromWarehouseId)}
              </div>
              <div className="text-sm text-blue-600">Source</div>
            </div>
            <ArrowRight className="w-6 h-6 text-blue-600" />
            <div className="text-center">
              <div className="font-semibold text-blue-900">
                {getWarehouseName(formData.toWarehouseId)}
              </div>
              <div className="text-sm text-blue-600">Destination</div>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-3">
        <Label htmlFor="notes" className="text-base font-semibold text-gray-900">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Enter transfer notes or reason..."
          disabled={isLoading}
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Transfer Items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Transfer Items</h3>
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
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Transfer Qty</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[60px]">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.transferItems.map((transferItem, index) => {
                    const itemDetails = getItemDetails(transferItem.itemId)
                    const availableQty = getAvailableQuantity(transferItem.itemId)
                    const transferQty = parseFloat(transferItem.quantity) || 0

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
                                          updateTransferItem(index, 'itemId', item.id)
                                          toggleItemCombo(index, false)
                                        }}
                                        className="flex flex-col items-start p-3"
                                      >
                                        <div className="flex items-center w-full">
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4 flex-shrink-0",
                                              transferItem.itemId === item.id ? "opacity-100" : "opacity-0"
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

                        {/* Transfer Quantity */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max={availableQty}
                              value={transferItem.quantity}
                              onChange={(e) => updateTransferItem(index, 'quantity', e.target.value)}
                              placeholder="0"
                              disabled={isLoading || !transferItem.itemId}
                              className={`text-right h-10 ${transferQty > availableQty ? 'border-red-500' : ''}`}
                            />
                            {transferQty > availableQty && (
                              <div className="text-xs text-red-500">
                                Exceeds available
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          {formData.transferItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTransferItem(index)}
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
                    {formatNumber(formData.transferItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0))}
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
            !formData.fromWarehouseId || 
            !formData.toWarehouseId ||
            formData.transferItems.filter(item => item.itemId && item.quantity).length === 0 ||
            formData.transferItems.some(item => {
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
            "Create Transfer"
          )}
        </Button>
      </div>
    </form>
  )
}