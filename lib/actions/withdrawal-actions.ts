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
  approvedAt: Date | null
  warehouse: {
    id: string
    name: string
    location: string | null
  }
  requestedBy: {
    id: string
    username: string
    firstName: string | null
    lastName: string | null
  }
  approvedBy: {
    id: string
    username: string
    firstName: string | null
    lastName: string | null
  } | null
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
  pendingWithdrawals: number
  approvedWithdrawals: number
  completedWithdrawals: number
  rejectedWithdrawals: number
}

// Include type for withdrawal queries
const withdrawalInclude = {
  warehouse: {
    select: {
      id: true,
      name: true,
      location: true
    }
  },
  requestedBy: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true
    }
  },
  approvedBy: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true
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
    approvedAt: withdrawal.approvedAt,
    warehouse: withdrawal.warehouse,
    requestedBy: withdrawal.requestedBy,
    approvedBy: withdrawal.approvedBy,
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

    // Calculate stats
    const stats: WithdrawalStats = {
      totalWithdrawals: withdrawals.length,
      pendingWithdrawals: withdrawals.filter(w => w.status === WithdrawalStatus.PENDING).length,
      approvedWithdrawals: withdrawals.filter(w => w.status === WithdrawalStatus.APPROVED).length,
      completedWithdrawals: withdrawals.filter(w => w.status === WithdrawalStatus.COMPLETED).length,
      rejectedWithdrawals: withdrawals.filter(w => w.status === WithdrawalStatus.REJECTED).length,
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

// Create new withdrawal
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

    // Calculate costs for withdrawal items
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

    const withdrawal = await prisma.withdrawal.create({
      data: {
        withdrawalNumber,
        purpose: data.purpose,
        status: WithdrawalStatus.PENDING,
        warehouseId: data.warehouseId,
        requestedById: session.user.id,
        withdrawalItems: {
          create: withdrawalItemsWithCosts
        }
      },
      include: withdrawalInclude
    })

    revalidatePath('/dashboard/withdrawals')
    
    return {
      success: true,
      data: transformWithdrawal(withdrawal)
    }

  } catch (error) {
    console.error('Error creating withdrawal:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create withdrawal'
    }
  }
}

// Approve withdrawal
export async function approveWithdrawal(withdrawalId: string): Promise<{
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

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      return { success: false, error: "Withdrawal is not in pending status" }
    }

    // Start transaction to approve withdrawal and create inventory movements
    const result = await prisma.$transaction(async (tx) => {
      // Update withdrawal status
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: WithdrawalStatus.COMPLETED,
          approvedById: session.user.id,
          approvedAt: new Date()
        },
        include: withdrawalInclude
      })

      // Create inventory movements and update current inventory
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

        if (!currentInventory || Number(currentInventory.quantity) < Number(withdrawalItem.quantity)) {
          throw new Error(`Insufficient inventory for item ${withdrawalItem.item.itemCode}`)
        }

        const newQuantity = Number(currentInventory.quantity) - Number(withdrawalItem.quantity)
        const newValue = Number(currentInventory.totalValue) - Number(withdrawalItem.totalValue)

        // Create withdrawal movement
        await tx.inventoryMovement.create({
          data: {
            movementType: MovementType.WITHDRAWAL,
            quantity: -Number(withdrawalItem.quantity),
            unitCost: Number(withdrawalItem.unitCost),
            totalValue: -Number(withdrawalItem.totalValue),
            referenceId: withdrawalId,
            notes: withdrawal.purpose || 'Material withdrawal',
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

      return updatedWithdrawal
    })

    revalidatePath('/dashboard/withdrawals')
    revalidatePath(`/dashboard/withdrawals/${withdrawalId}`)
    
    return {
      success: true,
      data: transformWithdrawal(result)
    }

  } catch (error) {
    console.error('Error approving withdrawal:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve withdrawal'
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

// Delete withdrawal
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
      return { success: false, error: "Cannot delete completed withdrawal" }
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