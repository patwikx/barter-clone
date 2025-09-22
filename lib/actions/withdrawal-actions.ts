"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { WithdrawalStatus, MovementType, Prisma } from "@prisma/client"

export interface WithdrawalWithDetails {
  id: string
  withdrawalNumber: string
  withdrawalDate: Date
  purpose: string | null
  status: WithdrawalStatus
  createdAt: Date
  updatedAt: Date
  warehouse: {
    id: string
    name: string
    location: string | null
    description: string | null
  }
  createdBy: {
    id: string
    username: string
    firstName: string | null
    lastName: string | null
    position: string | null
    department: string | null
  }
  withdrawalItems: Array<{
    id: string
    quantity: number
    unitCost: number
    totalValue: number
    item: {
      id: string
      itemCode: string
      description: string
      unitOfMeasure: string
    }
  }>
}

export interface CreateWithdrawalInput {
  warehouseId: string
  purpose?: string
  withdrawalItems: Array<{
    itemId: string
    quantity: number
  }>
}

export interface UpdateWithdrawalInput {
  warehouseId?: string
  purpose?: string
  status?: WithdrawalStatus
  withdrawalItems?: Array<{
    id?: string
    itemId: string
    quantity: number
  }>
}

export interface WithdrawalFilters {
  search: string
  warehouseId: string
  status: string
  dateFrom: string
  dateTo: string
}

export interface WithdrawalStats {
  totalWithdrawals: number
  completedWithdrawals: number
  cancelledWithdrawals: number
}

// Include type for withdrawal queries
const withdrawalInclude = {
  warehouse: {
    select: {
      id: true,
      name: true,
      location: true,
      description: true
    }
  },
  createdBy: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      position: true,
      department: true
    }
  },
  withdrawalItems: {
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
} satisfies Prisma.WithdrawalInclude

// Where clause type for withdrawal queries
interface WithdrawalWhereInput {
  OR?: Array<{
    withdrawalNumber?: {
      contains: string
      mode: 'insensitive'
    }
    purpose?: {
      contains: string
      mode: 'insensitive'
    }
  }>
  warehouseId?: string
  status?: WithdrawalStatus
  withdrawalDate?: {
    gte?: Date
    lte?: Date
  }
}

// Raw type from database
type RawWithdrawalWithDetails = Prisma.WithdrawalGetPayload<{
  include: typeof withdrawalInclude
}>

// Transform function
function transformWithdrawal(withdrawal: RawWithdrawalWithDetails): WithdrawalWithDetails {
  return {
    id: withdrawal.id,
    withdrawalNumber: withdrawal.withdrawalNumber,
    withdrawalDate: withdrawal.withdrawalDate,
    purpose: withdrawal.purpose,
    status: withdrawal.status,
    createdAt: withdrawal.createdAt,
    updatedAt: withdrawal.updatedAt,
    warehouse: withdrawal.warehouse,
    createdBy: withdrawal.createdBy,
    withdrawalItems: withdrawal.withdrawalItems.map(item => ({
      id: item.id,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      totalValue: Number(item.totalValue),
      item: item.item
    }))
  }
}

// Get all withdrawals with filters
export async function getWithdrawals(
  filters: Partial<WithdrawalFilters> = {}
): Promise<{
  success: boolean
  data?: WithdrawalWithDetails[]
  stats?: WithdrawalStats
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const { search = "", warehouseId = "all", status = "all", dateFrom = "", dateTo = "" } = filters

    // Build where clause
    const where: WithdrawalWhereInput = {}

    // Search filter
    if (search && search.trim() !== "") {
      where.OR = [
        {
          withdrawalNumber: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          purpose: {
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

    // Status filter
    if (status && status !== 'all') {
      where.status = status as WithdrawalStatus
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
      where.withdrawalDate = dateFilter
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where,
      include: withdrawalInclude,
      orderBy: {
        createdAt: 'desc'
      }
    })

    const transformedWithdrawals = withdrawals.map(transformWithdrawal)

    // Calculate stats - updated to match schema
    const stats: WithdrawalStats = {
      totalWithdrawals: withdrawals.length,
      completedWithdrawals: withdrawals.filter(w => w.status === WithdrawalStatus.COMPLETED).length,
      cancelledWithdrawals: withdrawals.filter(w => w.status === WithdrawalStatus.CANCELLED).length,
    }

    return {
      success: true,
      data: transformedWithdrawals,
      stats
    }

  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    return {
      success: false,
      error: 'Failed to fetch withdrawals'
    }
  }
}

// Create new withdrawal (auto-completes since no approval needed)
export async function createWithdrawal(data: CreateWithdrawalInput): Promise<{
  success: boolean
  data?: WithdrawalWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Generate withdrawal number
    const lastWithdrawal = await prisma.withdrawal.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { withdrawalNumber: true }
    })

    let nextNumber = 1
    if (lastWithdrawal?.withdrawalNumber) {
      const match = lastWithdrawal.withdrawalNumber.match(/WTH-(\d{4})-(\d+)/)
      if (match) {
        nextNumber = parseInt(match[2]) + 1
      }
    }

    const currentYear = new Date().getFullYear()
    const withdrawalNumber = `WTH-${currentYear}-${nextNumber.toString().padStart(3, '0')}`

    // Calculate costs for withdrawal items and validate inventory
    const withdrawalItemsWithCosts = await Promise.all(
      data.withdrawalItems.map(async (item) => {
        const currentInventory = await prisma.currentInventory.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: item.itemId,
              warehouseId: data.warehouseId
            }
          }
        })

        if (!currentInventory || Number(currentInventory.quantity) < item.quantity) {
          throw new Error(`Insufficient inventory for item ${item.itemId}`)
        }

        const unitCost = Number(currentInventory.avgUnitCost)
        const totalValue = item.quantity * unitCost

        return {
          itemId: item.itemId,
          quantity: item.quantity,
          unitCost,
          totalValue
        }
      })
    )

    // Create withdrawal and process inventory movements in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create withdrawal with COMPLETED status (no approval needed)
      const withdrawal = await tx.withdrawal.create({
        data: {
          withdrawalNumber,
          purpose: data.purpose,
          status: WithdrawalStatus.COMPLETED,
          warehouseId: data.warehouseId,
          createdById: session.user.id,
          withdrawalItems: {
            create: withdrawalItemsWithCosts
          }
        },
        include: withdrawalInclude
      })

      // Create inventory movements and update current inventory
      for (const withdrawalItem of withdrawalItemsWithCosts) {
        // Get current inventory again within transaction
        const currentInventory = await tx.currentInventory.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: withdrawalItem.itemId,
              warehouseId: data.warehouseId
            }
          }
        })

        if (!currentInventory) {
          throw new Error(`Current inventory not found for item ${withdrawalItem.itemId}`)
        }

        const newQuantity = Number(currentInventory.quantity) - withdrawalItem.quantity
        const newValue = Number(currentInventory.totalValue) - withdrawalItem.totalValue

        // Get item for costing method
        const item = await tx.item.findUnique({
          where: { id: withdrawalItem.itemId },
          select: { costingMethod: true }
        })

        if (!item) {
          throw new Error(`Item not found: ${withdrawalItem.itemId}`)
        }

        // Create withdrawal movement
        await tx.inventoryMovement.create({
          data: {
            movementType: MovementType.WITHDRAWAL,
            quantity: -withdrawalItem.quantity,
            unitCost: withdrawalItem.unitCost,
            totalValue: -withdrawalItem.totalValue,
            referenceId: withdrawal.id,
            notes: data.purpose || 'Material withdrawal',
            itemId: withdrawalItem.itemId,
            warehouseId: data.warehouseId,
            balanceQuantity: newQuantity,
            balanceValue: newValue,
            costMethod: item.costingMethod
          }
        })

        // Update current inventory
        await tx.currentInventory.update({
          where: {
            itemId_warehouseId: {
              itemId: withdrawalItem.itemId,
              warehouseId: data.warehouseId
            }
          },
          data: {
            quantity: newQuantity,
            totalValue: newValue,
            avgUnitCost: newQuantity > 0 ? newValue / newQuantity : 0
          }
        })
      }

      return withdrawal
    })

    revalidatePath('/dashboard/withdrawals')
    
    return {
      success: true,
      data: transformWithdrawal(result)
    }

  } catch (error) {
    console.error('Error creating withdrawal:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create withdrawal'
    }
  }
}

// Cancel withdrawal
export async function cancelWithdrawal(withdrawalId: string): Promise<{
  success: boolean
  data?: WithdrawalWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Get withdrawal details
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        withdrawalItems: {
          include: {
            item: true
          }
        }
      }
    })

    if (!withdrawal) {
      return { success: false, error: "Withdrawal not found" }
    }

    if (withdrawal.status === WithdrawalStatus.CANCELLED) {
      return { success: false, error: "Withdrawal is already cancelled" }
    }

    // If withdrawal is completed, we need to reverse the inventory movements
    const result = await prisma.$transaction(async (tx) => {
      if (withdrawal.status === WithdrawalStatus.COMPLETED) {
        // Reverse inventory movements
        for (const withdrawalItem of withdrawal.withdrawalItems) {
          // Get current inventory
          const currentInventory = await tx.currentInventory.findUnique({
            where: {
              itemId_warehouseId: {
                itemId: withdrawalItem.itemId,
                warehouseId: withdrawal.warehouseId
              }
            }
          })

          if (!currentInventory) {
            throw new Error(`Current inventory not found for item ${withdrawalItem.item.itemCode}`)
          }

          const newQuantity = Number(currentInventory.quantity) + Number(withdrawalItem.quantity)
          const newValue = Number(currentInventory.totalValue) + Number(withdrawalItem.totalValue)

          // Create reversal movement
          await tx.inventoryMovement.create({
            data: {
              movementType: MovementType.WITHDRAWAL,
              quantity: Number(withdrawalItem.quantity), // Positive to reverse
              unitCost: Number(withdrawalItem.unitCost),
              totalValue: Number(withdrawalItem.totalValue),
              referenceId: withdrawalId,
              notes: `Reversal of withdrawal ${withdrawal.withdrawalNumber}`,
              itemId: withdrawalItem.itemId,
              warehouseId: withdrawal.warehouseId,
              balanceQuantity: newQuantity,
              balanceValue: newValue,
              costMethod: withdrawalItem.item.costingMethod
            }
          })

          // Update current inventory
          await tx.currentInventory.update({
            where: {
              itemId_warehouseId: {
                itemId: withdrawalItem.itemId,
                warehouseId: withdrawal.warehouseId
              }
            },
            data: {
              quantity: newQuantity,
              totalValue: newValue,
              avgUnitCost: newQuantity > 0 ? newValue / newQuantity : 0
            }
          })
        }
      }

      // Update withdrawal status
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: WithdrawalStatus.CANCELLED
        },
        include: withdrawalInclude
      })

      return updatedWithdrawal
    })

    revalidatePath('/dashboard/withdrawals')
    revalidatePath(`/dashboard/withdrawals/${withdrawalId}`)
    
    return {
      success: true,
      data: transformWithdrawal(result)
    }

  } catch (error) {
    console.error('Error cancelling withdrawal:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel withdrawal'
    }
  }
}

// Get withdrawal by ID
export async function getWithdrawalById(withdrawalId: string): Promise<{
  success: boolean
  data?: WithdrawalWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: withdrawalInclude
    })

    if (!withdrawal) {
      return { success: false, error: "Withdrawal not found" }
    }

    return {
      success: true,
      data: transformWithdrawal(withdrawal)
    }

  } catch (error) {
    console.error('Error fetching withdrawal:', error)
    return {
      success: false,
      error: 'Failed to fetch withdrawal'
    }
  }
}

// Update withdrawal (only for non-completed withdrawals)
export async function updateWithdrawal(
  withdrawalId: string, 
  data: UpdateWithdrawalInput
): Promise<{
  success: boolean
  data?: WithdrawalWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if withdrawal exists and can be updated
    const existingWithdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      select: { status: true }
    })

    if (!existingWithdrawal) {
      return { success: false, error: "Withdrawal not found" }
    }

    if (existingWithdrawal.status === WithdrawalStatus.COMPLETED) {
      return { success: false, error: "Cannot update completed withdrawal" }
    }

    const withdrawal = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        purpose: data.purpose,
        warehouseId: data.warehouseId,
        status: data.status
      },
      include: withdrawalInclude
    })

    revalidatePath('/dashboard/withdrawals')
    revalidatePath(`/dashboard/withdrawals/${withdrawalId}`)
    
    return {
      success: true,
      data: transformWithdrawal(withdrawal)
    }

  } catch (error) {
    console.error('Error updating withdrawal:', error)
    return {
      success: false,
      error: 'Failed to update withdrawal'
    }
  }
}

// Delete withdrawal (only for cancelled withdrawals)
export async function deleteWithdrawal(withdrawalId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if withdrawal can be deleted
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      select: { status: true }
    })

    if (!withdrawal) {
      return { success: false, error: "Withdrawal not found" }
    }

    if (withdrawal.status === WithdrawalStatus.COMPLETED) {
      return { success: false, error: "Cannot delete completed withdrawal. Cancel it first." }
    }

    await prisma.withdrawal.delete({
      where: { id: withdrawalId }
    })

    revalidatePath('/dashboard/withdrawals')
    
    return { success: true }

  } catch (error) {
    console.error('Error deleting withdrawal:', error)
    return {
      success: false,
      error: 'Failed to delete withdrawal'
    }
  }
}