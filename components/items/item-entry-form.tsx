"use client"

import React, { useState } from "react"
import { Loader2, Check, ChevronsUpDown, Search } from "lucide-react"
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
import { type CreateItemEntryInput } from "@/lib/actions/item-entry-actions"

interface ItemEntryFormData {
  itemId: string
  warehouseId: string
  supplierId: string
  quantity: string
  landedCost: string
  purchaseReference: string
  notes: string
}

interface ItemEntryFormProps {
  items: Array<{
    id: string
    itemCode: string
    description: string
    unitOfMeasure: string
    standardCost: number
    supplier: {
      id: string
      name: string
    }
  }>
  warehouses: Array<{ id: string; name: string; location: string | null }>
  suppliers: Array<{ id: string; name: string }>
  onSubmit: (data: CreateItemEntryInput) => void
  onCancel: () => void
  isLoading: boolean
}

export function ItemEntryForm({ 
  items, 
  warehouses, 
  suppliers, 
  onSubmit, 
  onCancel, 
  isLoading 
}: ItemEntryFormProps) {
  const [formData, setFormData] = useState<ItemEntryFormData>({
    itemId: "",
    warehouseId: "",
    supplierId: "",
    quantity: "",
    landedCost: "",
    purchaseReference: "",
    notes: ""
  })
  const [itemComboOpen, setItemComboOpen] = useState(false)
  const [warehouseComboOpen, setWarehouseComboOpen] = useState(false)
  const [supplierComboOpen, setSupplierComboOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const quantity = parseFloat(formData.quantity)
    const landedCost = parseFloat(formData.landedCost)

    if (quantity <= 0 || landedCost <= 0) {
      return
    }

    const createData: CreateItemEntryInput = {
      itemId: formData.itemId,
      warehouseId: formData.warehouseId,
      supplierId: formData.supplierId,
      quantity,
      landedCost,
      purchaseReference: formData.purchaseReference || undefined,
      notes: formData.notes || undefined
    }
    
    onSubmit(createData)
  }

  const getItemName = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    return item ? `${item.itemCode} - ${item.description}` : ""
  }

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId)
    return warehouse ? warehouse.name : ""
  }

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    return supplier ? supplier.name : ""
  }

  const getWarehouseDisplay = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId)
    if (!warehouse) return ""
    return warehouse.location ? `${warehouse.name} (${warehouse.location})` : warehouse.name
  }

  const selectedItem = items.find(i => i.id === formData.itemId)
  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0
    const landedCost = parseFloat(formData.landedCost) || 0
    return quantity * landedCost
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Item Selection */}
      <div className="space-y-2">
        <Label className="text-base font-semibold text-gray-900">Item *</Label>
        <Popover open={itemComboOpen} onOpenChange={setItemComboOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={itemComboOpen}
              className="w-full justify-between h-12 text-left font-normal"
              disabled={isLoading}
            >
              <div className="flex items-center">
                <Search className="w-4 h-4 mr-2 text-gray-400" />
                {formData.itemId
                  ? getItemName(formData.itemId)
                  : "Search and select item..."}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[500px] p-0" align="start">
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
                        setFormData(prev => ({ 
                          ...prev, 
                          itemId: item.id,
                          supplierId: item.supplier.id,
                          landedCost: item.standardCost.toString()
                        }))
                        setItemComboOpen(false)
                      }}
                      className="flex flex-col items-start p-3"
                    >
                      <div className="flex items-center w-full">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 flex-shrink-0",
                            formData.itemId === item.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="font-medium text-gray-900">{item.itemCode}</div>
                          <div className="text-sm text-gray-600 truncate">{item.description}</div>
                          <div className="text-xs text-gray-500">
                            UOM: {item.unitOfMeasure} • Standard: {formatCurrency(item.standardCost)} • Supplier: {item.supplier.name}
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
      </div>

      {/* Warehouse and Supplier Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-base font-semibold text-gray-900">Warehouse *</Label>
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
                    ? getWarehouseName(formData.warehouseId)
                    : "Select warehouse..."}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
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
                          setFormData(prev => ({ ...prev, warehouseId: warehouse.id }))
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

        <div className="space-y-2">
          <Label className="text-base font-semibold text-gray-900">Supplier *</Label>
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
                    : "Select supplier..."}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
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
      </div>

      {/* Quantity and Cost */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            min="0"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
            placeholder="0"
            required
            disabled={isLoading}
          />
          {selectedItem && (
            <p className="text-xs text-gray-500">UOM: {selectedItem.unitOfMeasure}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="landedCost">Landed Cost *</Label>
          <Input
            id="landedCost"
            type="number"
            step="0.01"
            min="0"
            value={formData.landedCost}
            onChange={(e) => setFormData(prev => ({ ...prev, landedCost: e.target.value }))}
            placeholder="0.00"
            required
            disabled={isLoading}
          />
          {selectedItem && (
            <p className="text-xs text-gray-500">Standard: {formatCurrency(selectedItem.standardCost)}</p>
          )}
        </div>
      </div>

      {/* Total Value Display */}
      {formData.quantity && formData.landedCost && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-blue-900">Total Value:</span>
            <span className="text-2xl font-bold text-blue-900">{formatCurrency(calculateTotal())}</span>
          </div>
        </div>
      )}

      {/* Purchase Reference */}
      <div className="space-y-2">
        <Label htmlFor="purchaseReference">Purchase Reference</Label>
        <Input
          id="purchaseReference"
          value={formData.purchaseReference}
          onChange={(e) => setFormData(prev => ({ ...prev, purchaseReference: e.target.value }))}
          placeholder="PO number, invoice, etc."
          disabled={isLoading}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes about this entry..."
          disabled={isLoading}
          rows={3}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={
            isLoading || 
            !formData.itemId ||
            !formData.warehouseId ||
            !formData.supplierId ||
            !formData.quantity ||
            !formData.landedCost ||
            parseFloat(formData.quantity) <= 0 ||
            parseFloat(formData.landedCost) <= 0
          }
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Item Entry"
          )}
        </Button>
      </div>
    </form>
  )
}