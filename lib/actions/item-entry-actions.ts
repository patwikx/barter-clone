"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { MovementType, Prisma } from "@prisma/client"

export interface ItemEntryWithDetails {
  id: string
  quantity: number
  landedCost: number
  totalValue: number
  purchaseReference: string | null
  notes: string | null
  entryDate: Date
  createdAt: Date
  updatedAt: Date
  item: {
    id: string
    itemCode: string
    description: string
    unitOfMeasure: string
    standardCost: number
  }
  supplier: {
    id: string
    name: string
  }
  warehouse: {
    id: string
    name: string
    location: string | null
  }
  createdBy: {
    id: string
    username: string
    firstName: string | null
    lastName: string | null
  }
}

export interface CreateItemEntryInput {
  itemId: string
  warehouseId: string
  supplierId: string
  quantity: number
  landedCost: number
  purchaseReference?: string
  notes?: string
}

export interface UpdateItemEntryInput {
  quantity?: number
  landedCost?: number
  purchaseReference?: string
  notes?: string
}

export interface ItemEntryFilters {
  search: string
  warehouseId: string
  supplierId: string
  itemId: string
  dateFrom: string
  dateTo: string
}

export interface ItemEntryStats {
  totalEntries: number
  totalValue: number
  thisMonthEntries: number
  thisMonthValue: number
  averageEntryValue: number
}

// Include type for item entry queries
const itemEntryInclude = {
  item: {
    select: {
      id: true,
      itemCode: true,
      description: true,
      unitOfMeasure: true,
      standardCost: true
    }
  },
  supplier: {
    select: {
      id: true,
      name: true
    }
  },
  warehouse: {
    select: {
      id: true,
      name: true,
      location: true
    }
  },
  createdBy: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true
    }
  }
} satisfies Prisma.ItemEntryInclude

// Where clause type for item entry queries
interface ItemEntryWhereInput {
  OR?: Array<{
    purchaseReference?: {
      contains: string
      mode: 'insensitive'
    }
    notes?: {
      contains: string
      mode: 'insensitive'
    }
    item?: {
      itemCode?: {
        contains: string
        mode: 'insensitive'
      }
      description?: {
        contains: string
        mode: 'insensitive'
      }
    }
  }>
  warehouseId?: string
  supplierId?: string
  itemId?: string
  entryDate?: {
    gte?: Date
    lte?: Date
  }
}

// Raw type from database
type RawItemEntryWithDetails = Prisma.ItemEntryGetPayload<{
  include: typeof itemEntryInclude
}>

// Transform function
function transformItemEntry(entry: RawItemEntryWithDetails): ItemEntryWithDetails {
  return {
    id: entry.id,
    quantity: Number(entry.quantity),
    landedCost: Number(entry.landedCost),
    totalValue: Number(entry.totalValue),
    purchaseReference: entry.purchaseReference,
    notes: entry.notes,
    entryDate: entry.entryDate,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    item: {
      id: entry.item.id,
      itemCode: entry.item.itemCode,
      description: entry.item.description,
      unitOfMeasure: entry.item.unitOfMeasure,
      standardCost: Number(entry.item.standardCost)
    },
    supplier: entry.supplier,
    warehouse: entry.warehouse,
    createdBy: entry.createdBy
  }
}

// Get all item entries with filters
export async function getItemEntries(
  filters: Partial<ItemEntryFilters> = {}
): Promise<{
  success: boolean
  data?: ItemEntryWithDetails[]
  stats?: ItemEntryStats
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const { search = "", warehouseId = "all", supplierId = "all", itemId = "all", dateFrom = "", dateTo = "" } = filters

    // Build where clause
    const where: ItemEntryWhereInput = {}

    // Search filter
    if (search && search.trim() !== "") {
      where.OR = [
        {
          purchaseReference: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          notes: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          item: {
            itemCode: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          item: {
            description: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    // Warehouse filter
    if (warehouseId && warehouseId !== 'all') {
      where.warehouseId = warehouseId
    }

    // Supplier filter
    if (supplierId && supplierId !== 'all') {
      where.supplierId = supplierId
    }

    // Item filter
    if (itemId && itemId !== 'all') {
      where.itemId = itemId
    }

    // Date filters
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom)
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo)
    }
    if (Object.keys(dateFilter).length > 0) {
      where.entryDate = dateFilter
    }

    const entries = await prisma.itemEntry.findMany({
      where,
      include: itemEntryInclude,
      orderBy: {
        createdAt: 'desc'
      }
    })

    const transformedEntries = entries.map(transformItemEntry)

    // Calculate stats
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    
    const thisMonthEntries = entries.filter(entry => entry.entryDate >= firstDayOfMonth)
    const totalValue = entries.reduce((sum, entry) => sum + Number(entry.totalValue), 0)
    const thisMonthValue = thisMonthEntries.reduce((sum, entry) => sum + Number(entry.totalValue), 0)

    const stats: ItemEntryStats = {
      totalEntries: entries.length,
      totalValue,
      thisMonthEntries: thisMonthEntries.length,
      thisMonthValue,
      averageEntryValue: entries.length > 0 ? totalValue / entries.length : 0
    }

    return {
      success: true,
      data: transformedEntries,
      stats
    }

  } catch (error) {
    console.error('Error fetching item entries:', error)
    return {
      success: false,
      error: 'Failed to fetch item entries'
    }
  }
}

// Get item entry by ID
export async function getItemEntryById(entryId: string): Promise<{
  success: boolean
  data?: ItemEntryWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const entry = await prisma.itemEntry.findUnique({
      where: { id: entryId },
      include: itemEntryInclude
    })

    if (!entry) {
      return { success: false, error: "Item entry not found" }
    }

    return {
      success: true,
      data: transformItemEntry(entry)
    }

  } catch (error) {
    console.error('Error fetching item entry:', error)
    return {
      success: false,
      error: 'Failed to fetch item entry'
    }
  }
}

// Create new item entry
export async function createItemEntry(data: CreateItemEntryInput): Promise<{
  success: boolean
  data?: ItemEntryWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Validate input
    if (data.quantity <= 0) {
      return { success: false, error: "Quantity must be greater than 0" }
    }

    if (data.landedCost <= 0) {
      return { success: false, error: "Landed cost must be greater than 0" }
    }

    // Validate that item, warehouse, and supplier exist
    const [item, warehouse, supplier] = await Promise.all([
      prisma.item.findUnique({ where: { id: data.itemId } }),
      prisma.warehouse.findUnique({ where: { id: data.warehouseId } }),
      prisma.supplier.findUnique({ where: { id: data.supplierId } })
    ])

    if (!item) {
      return { success: false, error: "Item not found" }
    }
    if (!warehouse) {
      return { success: false, error: "Warehouse not found" }
    }
    if (!supplier) {
      return { success: false, error: "Supplier not found" }
    }

    const totalValue = data.quantity * data.landedCost

    // Create item entry and update inventory in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create item entry
      const entry = await tx.itemEntry.create({
        data: {
          itemId: data.itemId,
          warehouseId: data.warehouseId,
          supplierId: data.supplierId,
          quantity: data.quantity,
          landedCost: data.landedCost,
          totalValue,
          purchaseReference: data.purchaseReference,
          notes: data.notes,
          createdById: session.user.id
        },
        include: itemEntryInclude
      })

      // Get current inventory for this item-warehouse combination
      const currentInventory = await tx.currentInventory.findUnique({
        where: {
          itemId_warehouseId: {
            itemId: data.itemId,
            warehouseId: data.warehouseId
          }
        }
      })

      // Calculate new inventory values
      const currentQty = currentInventory ? Number(currentInventory.quantity) : 0
      const currentValue = currentInventory ? Number(currentInventory.totalValue) : 0
      
      const newQuantity = currentQty + data.quantity
      const newTotalValue = currentValue + totalValue
      const newAvgUnitCost = newTotalValue / newQuantity

      // Create inventory movement
      await tx.inventoryMovement.create({
        data: {
          movementType: MovementType.ITEM_ENTRY,
          quantity: data.quantity,
          unitCost: data.landedCost,
          totalValue,
          referenceId: entry.id,
          notes: data.notes || `Item entry from ${supplier.name}`,
          itemId: data.itemId,
          warehouseId: data.warehouseId,
          balanceQuantity: newQuantity,
          balanceValue: newTotalValue,
          costMethod: item.costingMethod
        }
      })

      // Update or create current inventory
      await tx.currentInventory.upsert({
        where: {
          itemId_warehouseId: {
            itemId: data.itemId,
            warehouseId: data.warehouseId
          }
        },
        update: {
          quantity: newQuantity,
          totalValue: newTotalValue,
          avgUnitCost: newAvgUnitCost
        },
        create: {
          itemId: data.itemId,
          warehouseId: data.warehouseId,
          quantity: data.quantity,
          totalValue,
          avgUnitCost: data.landedCost
        }
      })

      return entry
    })

    revalidatePath('/dashboard/item-entries')
    revalidatePath('/dashboard/inventory')
    
    return {
      success: true,
      data: transformItemEntry(result)
    }

  } catch (error) {
    console.error('Error creating item entry:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create item entry'
    }
  }
}

// Update item entry (only if not yet processed into inventory)
export async function updateItemEntry(entryId: string, data: UpdateItemEntryInput): Promise<{
  success: boolean
  data?: ItemEntryWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if entry exists
    const existingEntry = await prisma.itemEntry.findUnique({
      where: { id: entryId },
      select: { id: true, quantity: true, landedCost: true }
    })

    if (!existingEntry) {
      return { success: false, error: "Item entry not found" }
    }

    // Build update data
    const updateData: {
      quantity?: number
      landedCost?: number
      totalValue?: number
      purchaseReference?: string
      notes?: string
      updatedAt: Date
    } = {
      updatedAt: new Date()
    }

    if (data.quantity !== undefined) {
      updateData.quantity = data.quantity
    }
    if (data.landedCost !== undefined) {
      updateData.landedCost = data.landedCost
    }
    if (data.purchaseReference !== undefined) {
      updateData.purchaseReference = data.purchaseReference
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes
    }

    // Recalculate total value if quantity or cost changed
    const finalQuantity = data.quantity ?? Number(existingEntry.quantity)
    const finalCost = data.landedCost ?? Number(existingEntry.landedCost)
    updateData.totalValue = finalQuantity * finalCost

    const entry = await prisma.itemEntry.update({
      where: { id: entryId },
      data: updateData,
      include: itemEntryInclude
    })

    revalidatePath('/dashboard/item-entries')
    revalidatePath(`/dashboard/item-entries/${entryId}`)
    
    return {
      success: true,
      data: transformItemEntry(entry)
    }

  } catch (error) {
    console.error('Error updating item entry:', error)
    return {
      success: false,
      error: 'Failed to update item entry'
    }
  }
}

// Delete item entry
export async function deleteItemEntry(entryId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if entry has been processed (has inventory movements)
    const hasMovements = await prisma.inventoryMovement.findFirst({
      where: { referenceId: entryId },
      select: { id: true }
    })

    if (hasMovements) {
      return { success: false, error: "Cannot delete item entry that has been processed into inventory" }
    }

    await prisma.itemEntry.delete({
      where: { id: entryId }
    })

    revalidatePath('/dashboard/item-entries')
    
    return { success: true }

  } catch (error) {
    console.error('Error deleting item entry:', error)
    return {
      success: false,
      error: 'Failed to delete item entry'
    }
  }
}

// Get available items for entry
export async function getItemsForEntry(): Promise<{
  success: boolean
  data?: Array<{
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
  error?: string
}> {
  try {
    const items = await prisma.item.findMany({
      include: {
        supplier: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        itemCode: 'asc'
      }
    })

    const transformedItems = items.map(item => ({
      id: item.id,
      itemCode: item.itemCode,
      description: item.description,
      unitOfMeasure: item.unitOfMeasure,
      standardCost: Number(item.standardCost),
      supplier: item.supplier
    }))

    return {
      success: true,
      data: transformedItems
    }

  } catch (error) {
    console.error('Error fetching items for entry:', error)
    return {
      success: false,
      error: 'Failed to fetch items for entry'
    }
  }
}