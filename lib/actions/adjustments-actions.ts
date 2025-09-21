"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { AdjustmentType, MovementType, Prisma } from "@prisma/client"

export interface AdjustmentWithDetails {
  id: string
  adjustmentNumber: string
  adjustmentType: AdjustmentType
  reason: string
  notes: string | null
  adjustedAt: Date
  createdAt: Date
  updatedAt: Date
  warehouse: {
    id: string
    name: string
    location: string | null
  }
  adjustedBy: {
    id: string
    username: string
    firstName: string | null
    lastName: string | null
  }
  adjustmentItems: Array<{
    id: string
    systemQuantity: number
    actualQuantity: number
    adjustmentQuantity: number
    unitCost: number
    totalAdjustment: number
    item: {
      id: string
      itemCode: string
      description: string
      unitOfMeasure: string
    }
  }>
}

export interface CreateAdjustmentInput {
  warehouseId: string
  adjustmentType: AdjustmentType
  reason: string
  notes?: string
  adjustmentItems: Array<{
    itemId: string
    systemQuantity: number
    actualQuantity: number
    unitCost: number
  }>
}

export interface AdjustmentFilters {
  search: string
  warehouseId: string
  adjustmentType: string
  dateFrom: string
  dateTo: string
}

export interface AdjustmentStats {
  totalAdjustments: number
  physicalCountAdjustments: number
  damageAdjustments: number
  correctionAdjustments: number
  totalAdjustmentValue: number
}

// Include type for adjustment queries
const adjustmentInclude = {
  warehouse: {
    select: {
      id: true,
      name: true,
      location: true
    }
  },
  adjustedBy: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true
    }
  },
  adjustmentItems: {
    include: {
      item: {
        select: {
          id: true,
          itemCode: true,
          description: true,
          unitOfMeasure: true
        }
      }
    }
  }
} satisfies Prisma.InventoryAdjustmentInclude

// Where clause type for adjustment queries
interface AdjustmentWhereInput {
  OR?: Array<{
    adjustmentNumber?: {
      contains: string
      mode: 'insensitive'
    }
    reason?: {
      contains: string
      mode: 'insensitive'
    }
    notes?: {
      contains: string
      mode: 'insensitive'
    }
  }>
  warehouseId?: string
  adjustmentType?: AdjustmentType
  adjustedAt?: {
    gte?: Date
    lte?: Date
  }
}

// Raw type from database
type RawAdjustmentWithDetails = Prisma.InventoryAdjustmentGetPayload<{
  include: typeof adjustmentInclude
}>

// Transform function
function transformAdjustment(adjustment: RawAdjustmentWithDetails): AdjustmentWithDetails {
  return {
    id: adjustment.id,
    adjustmentNumber: adjustment.adjustmentNumber,
    adjustmentType: adjustment.adjustmentType,
    reason: adjustment.reason,
    notes: adjustment.notes,
    adjustedAt: adjustment.adjustedAt,
    createdAt: adjustment.createdAt,
    updatedAt: adjustment.updatedAt,
    warehouse: adjustment.warehouse,
    adjustedBy: adjustment.adjustedBy,
    adjustmentItems: adjustment.adjustmentItems.map(item => ({
      id: item.id,
      systemQuantity: Number(item.systemQuantity),
      actualQuantity: Number(item.actualQuantity),
      adjustmentQuantity: Number(item.adjustmentQuantity),
      unitCost: Number(item.unitCost),
      totalAdjustment: Number(item.totalAdjustment),
      item: item.item
    }))
  }
}

// Get all adjustments with filters
export async function getInventoryAdjustments(
  filters: Partial<AdjustmentFilters> = {}
): Promise<{
  success: boolean
  data?: AdjustmentWithDetails[]
  stats?: AdjustmentStats
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const { search = "", warehouseId = "all", adjustmentType = "all", dateFrom = "", dateTo = "" } = filters

    // Build where clause
    const where: AdjustmentWhereInput = {}

    // Search filter
    if (search && search.trim() !== "") {
      where.OR = [
        {
          adjustmentNumber: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          reason: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          notes: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Warehouse filter
    if (warehouseId && warehouseId !== 'all') {
      where.warehouseId = warehouseId
    }

    // Adjustment type filter
    if (adjustmentType && adjustmentType !== 'all') {
      where.adjustmentType = adjustmentType as AdjustmentType
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
      where.adjustedAt = dateFilter
    }

    const adjustments = await prisma.inventoryAdjustment.findMany({
      where,
      include: adjustmentInclude,
      orderBy: {
        createdAt: 'desc'
      }
    })

    const transformedAdjustments = adjustments.map(transformAdjustment)

    // Calculate stats
    const totalAdjustmentValue = adjustments.reduce((sum, adj) => {
      return sum + adj.adjustmentItems.reduce((itemSum, item) => 
        itemSum + Number(item.totalAdjustment), 0
      )
    }, 0)

    const stats: AdjustmentStats = {
      totalAdjustments: adjustments.length,
      physicalCountAdjustments: adjustments.filter(a => a.adjustmentType === AdjustmentType.PHYSICAL_COUNT).length,
      damageAdjustments: adjustments.filter(a => a.adjustmentType === AdjustmentType.DAMAGE).length,
      correctionAdjustments: adjustments.filter(a => a.adjustmentType === AdjustmentType.CORRECTION).length,
      totalAdjustmentValue
    }

    return {
      success: true,
      data: transformedAdjustments,
      stats
    }

  } catch (error) {
    console.error('Error fetching adjustments:', error)
    return {
      success: false,
      error: 'Failed to fetch adjustments'
    }
  }
}

// Get adjustment by ID
export async function getAdjustmentById(adjustmentId: string): Promise<{
  success: boolean
  data?: AdjustmentWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const adjustment = await prisma.inventoryAdjustment.findUnique({
      where: { id: adjustmentId },
      include: adjustmentInclude
    })

    if (!adjustment) {
      return { success: false, error: "Adjustment not found" }
    }

    return {
      success: true,
      data: transformAdjustment(adjustment)
    }

  } catch (error) {
    console.error('Error fetching adjustment:', error)
    return {
      success: false,
      error: 'Failed to fetch adjustment'
    }
  }
}

// Create new adjustment
export async function createInventoryAdjustment(data: CreateAdjustmentInput): Promise<{
  success: boolean
  data?: { id: string; adjustmentNumber: string }
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Generate adjustment number
    const lastAdjustment = await prisma.inventoryAdjustment.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { adjustmentNumber: true }
    })

    let nextNumber = 1
    if (lastAdjustment?.adjustmentNumber) {
      const match = lastAdjustment.adjustmentNumber.match(/ADJ-(\d{4})-(\d+)/)
      if (match) {
        nextNumber = parseInt(match[2]) + 1
      }
    }

    const currentYear = new Date().getFullYear()
    const adjustmentNumber = `ADJ-${currentYear}-${nextNumber.toString().padStart(3, '0')}`

    // Start transaction to create adjustment and update inventory
    const result = await prisma.$transaction(async (tx) => {
      // Create adjustment
      const adjustment = await tx.inventoryAdjustment.create({
        data: {
          adjustmentNumber,
          adjustmentType: data.adjustmentType,
          reason: data.reason,
          notes: data.notes,
          warehouseId: data.warehouseId,
          adjustedById: session.user.id,
          adjustmentItems: {
            create: data.adjustmentItems.map(item => ({
              itemId: item.itemId,
              systemQuantity: item.systemQuantity,
              actualQuantity: item.actualQuantity,
              adjustmentQuantity: item.actualQuantity - item.systemQuantity,
              unitCost: item.unitCost,
              totalAdjustment: (item.actualQuantity - item.systemQuantity) * item.unitCost
            }))
          }
        },
        include: adjustmentInclude
      })

      // Create inventory movements and update current inventory
      for (const adjustmentItem of data.adjustmentItems) {
        const adjustmentQuantity = adjustmentItem.actualQuantity - adjustmentItem.systemQuantity
        
        if (adjustmentQuantity !== 0) {
          const totalAdjustment = adjustmentQuantity * adjustmentItem.unitCost

          // Create adjustment movement
          await tx.inventoryMovement.create({
            data: {
              movementType: MovementType.ADJUSTMENT,
              quantity: adjustmentQuantity,
              unitCost: adjustmentItem.unitCost,
              totalValue: totalAdjustment,
              referenceId: adjustment.id,
              notes: `${data.adjustmentType} - ${data.reason}`,
              itemId: adjustmentItem.itemId,
              warehouseId: data.warehouseId,
              balanceQuantity: adjustmentItem.actualQuantity,
              balanceValue: adjustmentItem.actualQuantity * adjustmentItem.unitCost,
              costMethod: (await tx.item.findUnique({
                where: { id: adjustmentItem.itemId },
                select: { costingMethod: true }
              }))?.costingMethod || 'WEIGHTED_AVERAGE'
            }
          })

          // Update current inventory
          await tx.currentInventory.upsert({
            where: {
              itemId_warehouseId: {
                itemId: adjustmentItem.itemId,
                warehouseId: data.warehouseId
              }
            },
            update: {
              quantity: adjustmentItem.actualQuantity,
              totalValue: adjustmentItem.actualQuantity * adjustmentItem.unitCost,
              avgUnitCost: adjustmentItem.unitCost
            },
            create: {
              itemId: adjustmentItem.itemId,
              warehouseId: data.warehouseId,
              quantity: adjustmentItem.actualQuantity,
              totalValue: adjustmentItem.actualQuantity * adjustmentItem.unitCost,
              avgUnitCost: adjustmentItem.unitCost
            }
          })
        }
      }

      return adjustment
    })

    revalidatePath('/dashboard/adjustments')
    
    return {
      success: true,
      data: {
        id: result.id,
        adjustmentNumber: result.adjustmentNumber
      }
    }

  } catch (error) {
    console.error('Error creating adjustment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create adjustment'
    }
  }
}