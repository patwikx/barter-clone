"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { CostingMethodType, Prisma } from "@prisma/client"

export interface WarehouseWithDetails {
  id: string
  name: string
  location: string | null
  description: string | null
  isMainWarehouse: boolean
  defaultCostingMethod: CostingMethodType
  createdAt: Date
  updatedAt: Date
  _count: {
    currentInventory: number
    inventoryMovements: number
  }
}

export interface CreateWarehouseInput {
  name: string
  location?: string
  description?: string
  isMainWarehouse?: boolean
  defaultCostingMethod?: CostingMethodType
}

export interface UpdateWarehouseInput {
  name?: string
  location?: string
  description?: string
  isMainWarehouse?: boolean
  defaultCostingMethod?: CostingMethodType
}

export interface WarehouseFilters {
  search: string
  isMainWarehouse: string
}

// Where clause type for warehouse queries
interface WarehouseWhereInput {
  OR?: Array<{
    name?: {
      contains: string
      mode: 'insensitive'
    }
    location?: {
      contains: string
      mode: 'insensitive'
    }
    description?: {
      contains: string
      mode: 'insensitive'
    }
  }>
  isMainWarehouse?: boolean
}

// Include type for warehouse queries
const warehouseInclude = {
  _count: {
    select: {
      currentInventory: true,
      inventoryMovements: true
    }
  }
} satisfies Prisma.WarehouseInclude

// Raw type from database
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type RawWarehouseWithDetails = Prisma.WarehouseGetPayload<{
  include: typeof warehouseInclude
}>

// Get all warehouses with filters
export async function getWarehouses(
  filters: Partial<WarehouseFilters> = {}
): Promise<{
  success: boolean
  data?: WarehouseWithDetails[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const { search = "", isMainWarehouse = "all" } = filters

    // Build where clause with proper typing
    const where: WarehouseWhereInput = {}

    // Search filter
    if (search && search.trim() !== "") {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          location: {
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

    // Main warehouse filter
    if (isMainWarehouse === "true") {
      where.isMainWarehouse = true
    } else if (isMainWarehouse === "false") {
      where.isMainWarehouse = false
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: warehouseInclude,
      orderBy: [
        { isMainWarehouse: 'desc' },
        { name: 'asc' }
      ]
    })

    return {
      success: true,
      data: warehouses
    }

  } catch (error) {
    console.error('Error fetching warehouses:', error)
    return {
      success: false,
      error: 'Failed to fetch warehouses'
    }
  }
}

// Get single warehouse by ID
export async function getWarehouseById(warehouseId: string): Promise<{
  success: boolean
  data?: WarehouseWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: warehouseInclude
    })

    if (!warehouse) {
      return { success: false, error: "Warehouse not found" }
    }

    return {
      success: true,
      data: warehouse
    }

  } catch (error) {
    console.error('Error fetching warehouse:', error)
    return {
      success: false,
      error: 'Failed to fetch warehouse'
    }
  }
}

// Create new warehouse
export async function createWarehouse(data: CreateWarehouseInput): Promise<{
  success: boolean
  data?: WarehouseWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if warehouse name already exists
    const existingWarehouse = await prisma.warehouse.findFirst({
      where: { 
        name: {
          equals: data.name,
          mode: 'insensitive'
        }
      },
      select: { id: true }
    })

    if (existingWarehouse) {
      return { success: false, error: "Warehouse name already exists" }
    }

    // If setting as main warehouse, unset other main warehouses
    if (data.isMainWarehouse) {
      await prisma.warehouse.updateMany({
        where: { isMainWarehouse: true },
        data: { isMainWarehouse: false }
      })
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: data.name,
        location: data.location,
        description: data.description,
        isMainWarehouse: data.isMainWarehouse || false,
        defaultCostingMethod: data.defaultCostingMethod || CostingMethodType.WEIGHTED_AVERAGE
      },
      include: warehouseInclude
    })

    revalidatePath('/dashboard/warehouses')
    
    return {
      success: true,
      data: warehouse
    }

  } catch (error) {
    console.error('Error creating warehouse:', error)
    return {
      success: false,
      error: 'Failed to create warehouse'
    }
  }
}

// Update warehouse
export async function updateWarehouse(warehouseId: string, data: UpdateWarehouseInput): Promise<{
  success: boolean
  data?: WarehouseWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if warehouse name already exists (if updating name)
    if (data.name) {
      const existingWarehouse = await prisma.warehouse.findFirst({
        where: {
          name: {
            equals: data.name,
            mode: 'insensitive'
          },
          NOT: { id: warehouseId }
        },
        select: { id: true }
      })

      if (existingWarehouse) {
        return { success: false, error: "Warehouse name already exists" }
      }
    }

    // If setting as main warehouse, unset other main warehouses
    if (data.isMainWarehouse) {
      await prisma.warehouse.updateMany({
        where: { 
          isMainWarehouse: true,
          NOT: { id: warehouseId }
        },
        data: { isMainWarehouse: false }
      })
    }

    // Build update data with proper typing
    const updateData: {
      name?: string
      location?: string
      description?: string
      isMainWarehouse?: boolean
      defaultCostingMethod?: CostingMethodType
      updatedAt: Date
    } = {
      updatedAt: new Date()
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.location !== undefined) updateData.location = data.location
    if (data.description !== undefined) updateData.description = data.description
    if (data.isMainWarehouse !== undefined) updateData.isMainWarehouse = data.isMainWarehouse
    if (data.defaultCostingMethod !== undefined) updateData.defaultCostingMethod = data.defaultCostingMethod

    const warehouse = await prisma.warehouse.update({
      where: { id: warehouseId },
      data: updateData,
      include: warehouseInclude
    })

    revalidatePath('/dashboard/warehouses')
    revalidatePath(`/dashboard/warehouses/${warehouseId}`)
    
    return {
      success: true,
      data: warehouse
    }

  } catch (error) {
    console.error('Error updating warehouse:', error)
    return {
      success: false,
      error: 'Failed to update warehouse'
    }
  }
}

// Delete warehouse
export async function deleteWarehouse(warehouseId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if warehouse has any inventory
    const hasInventory = await prisma.currentInventory.findFirst({
      where: { warehouseId },
      select: { id: true }
    })

    if (hasInventory) {
      return { success: false, error: "Cannot delete warehouse with existing inventory" }
    }

    // Check if warehouse has any movements
    const hasMovements = await prisma.inventoryMovement.findFirst({
      where: { warehouseId },
      select: { id: true }
    })

    if (hasMovements) {
      return { success: false, error: "Cannot delete warehouse with transaction history" }
    }

    await prisma.warehouse.delete({
      where: { id: warehouseId }
    })

    revalidatePath('/dashboard/warehouses')
    
    return { success: true }

  } catch (error) {
    console.error('Error deleting warehouse:', error)
    return {
      success: false,
      error: 'Failed to delete warehouse'
    }
  }
}