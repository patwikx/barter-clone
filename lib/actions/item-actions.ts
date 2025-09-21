"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { CostingMethodType, Prisma } from "@prisma/client"

export interface ItemWithDetails {
  id: string
  itemCode: string
  description: string
  unitOfMeasure: string
  standardCost: number
  costingMethod: CostingMethodType
  reorderLevel: number | null
  maxLevel: number | null
  minLevel: number | null
  createdAt: Date
  updatedAt: Date
  supplier: {
    id: string
    name: string
  }
  _count: {
    purchaseItems: number
    currentInventory: number
    inventoryMovements: number
  }
}

export interface CreateItemInput {
  itemCode: string
  description: string
  unitOfMeasure: string
  standardCost: number
  costingMethod?: CostingMethodType
  reorderLevel?: number
  maxLevel?: number
  minLevel?: number
  supplierId: string
}

export interface UpdateItemInput {
  itemCode?: string
  description?: string
  unitOfMeasure?: string
  standardCost?: number
  costingMethod?: CostingMethodType
  reorderLevel?: number
  maxLevel?: number
  minLevel?: number
  supplierId?: string
}

export interface ItemFilters {
  search: string
  supplierId: string
  costingMethod: string
}

// Include type for item queries
const itemInclude = {
  supplier: {
    select: {
      id: true,
      name: true
    }
  },
  _count: {
    select: {
      purchaseItems: true,
      currentInventory: true,
      inventoryMovements: true
    }
  }
} satisfies Prisma.ItemInclude

// Where clause type for item queries
interface ItemWhereInput {
  OR?: Array<{
    itemCode?: {
      contains: string
      mode: 'insensitive'
    }
    description?: {
      contains: string
      mode: 'insensitive'
    }
  }>
  supplierId?: string
  costingMethod?: CostingMethodType
}

// Get all items with filters
export async function getItems(
  filters: Partial<ItemFilters> = {}
): Promise<{
  success: boolean
  data?: ItemWithDetails[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const { search = "", supplierId = "all", costingMethod = "all" } = filters

    // Build where clause
    const where: ItemWhereInput = {}

    // Search filter
    if (search && search.trim() !== "") {
      where.OR = [
        {
          itemCode: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Supplier filter
    if (supplierId && supplierId !== 'all') {
      where.supplierId = supplierId
    }

    // Costing method filter
    if (costingMethod && costingMethod !== 'all') {
      where.costingMethod = costingMethod as CostingMethodType
    }

    const items = await prisma.item.findMany({
      where,
      include: itemInclude,
      orderBy: {
        itemCode: 'asc'
      }
    })

    const transformedItems: ItemWithDetails[] = items.map(item => ({
      id: item.id,
      itemCode: item.itemCode,
      description: item.description,
      unitOfMeasure: item.unitOfMeasure,
      standardCost: Number(item.standardCost),
      costingMethod: item.costingMethod,
      reorderLevel: item.reorderLevel ? Number(item.reorderLevel) : null,
      maxLevel: item.maxLevel ? Number(item.maxLevel) : null,
      minLevel: item.minLevel ? Number(item.minLevel) : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      supplier: item.supplier,
      _count: item._count
    }))

    return {
      success: true,
      data: transformedItems
    }

  } catch (error) {
    console.error('Error fetching items:', error)
    return {
      success: false,
      error: 'Failed to fetch items'
    }
  }
}

// Get single item by ID
export async function getItemById(itemId: string): Promise<{
  success: boolean
  data?: ItemWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: itemInclude
    })

    if (!item) {
      return { success: false, error: "Item not found" }
    }

    const transformedItem: ItemWithDetails = {
      id: item.id,
      itemCode: item.itemCode,
      description: item.description,
      unitOfMeasure: item.unitOfMeasure,
      standardCost: Number(item.standardCost),
      costingMethod: item.costingMethod,
      reorderLevel: item.reorderLevel ? Number(item.reorderLevel) : null,
      maxLevel: item.maxLevel ? Number(item.maxLevel) : null,
      minLevel: item.minLevel ? Number(item.minLevel) : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      supplier: item.supplier,
      _count: item._count
    }

    return {
      success: true,
      data: transformedItem
    }

  } catch (error) {
    console.error('Error fetching item:', error)
    return {
      success: false,
      error: 'Failed to fetch item'
    }
  }
}

// Create new item
export async function createItem(data: CreateItemInput): Promise<{
  success: boolean
  data?: ItemWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if item code already exists
    const existingItem = await prisma.item.findFirst({
      where: { 
        itemCode: {
          equals: data.itemCode,
          mode: 'insensitive'
        }
      }
    })

    if (existingItem) {
      return { success: false, error: "Item code already exists" }
    }

    const item = await prisma.item.create({
      data: {
        itemCode: data.itemCode,
        description: data.description,
        unitOfMeasure: data.unitOfMeasure,
        standardCost: data.standardCost,
        costingMethod: data.costingMethod || CostingMethodType.WEIGHTED_AVERAGE,
        reorderLevel: data.reorderLevel,
        maxLevel: data.maxLevel,
        minLevel: data.minLevel,
        supplierId: data.supplierId
      },
      include: itemInclude
    })

    const transformedItem: ItemWithDetails = {
      id: item.id,
      itemCode: item.itemCode,
      description: item.description,
      unitOfMeasure: item.unitOfMeasure,
      standardCost: Number(item.standardCost),
      costingMethod: item.costingMethod,
      reorderLevel: item.reorderLevel ? Number(item.reorderLevel) : null,
      maxLevel: item.maxLevel ? Number(item.maxLevel) : null,
      minLevel: item.minLevel ? Number(item.minLevel) : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      supplier: item.supplier,
      _count: item._count
    }

    revalidatePath('/dashboard/items')
    
    return {
      success: true,
      data: transformedItem
    }

  } catch (error) {
    console.error('Error creating item:', error)
    return {
      success: false,
      error: 'Failed to create item'
    }
  }
}

// Update item
export async function updateItem(itemId: string, data: UpdateItemInput): Promise<{
  success: boolean
  data?: ItemWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if item code already exists (if updating item code)
    if (data.itemCode) {
      const existingItem = await prisma.item.findFirst({
        where: {
          itemCode: {
            equals: data.itemCode,
            mode: 'insensitive'
          },
          NOT: { id: itemId }
        }
      })

      if (existingItem) {
        return { success: false, error: "Item code already exists" }
      }
    }

    const updateData: {
      itemCode?: string
      description?: string
      unitOfMeasure?: string
      standardCost?: number
      costingMethod?: CostingMethodType
      reorderLevel?: number | null
      maxLevel?: number | null
      minLevel?: number | null
      supplierId?: string
      updatedAt: Date
    } = {
      updatedAt: new Date()
    }

    if (data.itemCode !== undefined) updateData.itemCode = data.itemCode
    if (data.description !== undefined) updateData.description = data.description
    if (data.unitOfMeasure !== undefined) updateData.unitOfMeasure = data.unitOfMeasure
    if (data.standardCost !== undefined) updateData.standardCost = data.standardCost
    if (data.costingMethod !== undefined) updateData.costingMethod = data.costingMethod
    if (data.reorderLevel !== undefined) updateData.reorderLevel = data.reorderLevel
    if (data.maxLevel !== undefined) updateData.maxLevel = data.maxLevel
    if (data.minLevel !== undefined) updateData.minLevel = data.minLevel
    if (data.supplierId !== undefined) updateData.supplierId = data.supplierId

    const item = await prisma.item.update({
      where: { id: itemId },
      data: updateData,
      include: itemInclude
    })

    const transformedItem: ItemWithDetails = {
      id: item.id,
      itemCode: item.itemCode,
      description: item.description,
      unitOfMeasure: item.unitOfMeasure,
      standardCost: Number(item.standardCost),
      costingMethod: item.costingMethod,
      reorderLevel: item.reorderLevel ? Number(item.reorderLevel) : null,
      maxLevel: item.maxLevel ? Number(item.maxLevel) : null,
      minLevel: item.minLevel ? Number(item.minLevel) : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      supplier: item.supplier,
      _count: item._count
    }

    revalidatePath('/dashboard/items')
    revalidatePath(`/dashboard/items/${itemId}`)
    
    return {
      success: true,
      data: transformedItem
    }

  } catch (error) {
    console.error('Error updating item:', error)
    return {
      success: false,
      error: 'Failed to update item'
    }
  }
}

// Delete item
export async function deleteItem(itemId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if item has any inventory or transactions
    const hasInventory = await prisma.currentInventory.findFirst({
      where: { itemId },
      select: { id: true }
    })

    if (hasInventory) {
      return { success: false, error: "Cannot delete item with existing inventory" }
    }

    const hasMovements = await prisma.inventoryMovement.findFirst({
      where: { itemId },
      select: { id: true }
    })

    if (hasMovements) {
      return { success: false, error: "Cannot delete item with transaction history" }
    }

    await prisma.item.delete({
      where: { id: itemId }
    })

    revalidatePath('/dashboard/items')
    
    return { success: true }

  } catch (error) {
    console.error('Error deleting item:', error)
    return {
      success: false,
      error: 'Failed to delete item'
    }
  }
}