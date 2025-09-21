"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { TransferStatus, MovementType, Prisma } from "@prisma/client"

export interface TransferWithDetails {
  id: string
  transferNumber: string
  transferDate: Date
  status: TransferStatus
  notes: string | null
  createdAt: Date
  updatedAt: Date
  approvedAt: Date | null
  fromWarehouse: {
    id: string
    name: string
    location: string | null
  }
  toWarehouse: {
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
  approvedBy: {
    id: string
    username: string
    firstName: string | null
    lastName: string | null
  } | null
  transferItems: Array<{
    id: string
    quantity: number
    item: {
      id: string
      itemCode: string
      description: string
      unitOfMeasure: string
    }
  }>
}

export interface CreateTransferInput {
  fromWarehouseId: string
  toWarehouseId: string
  notes?: string
  transferItems: Array<{
    itemId: string
    quantity: number
  }>
}

export interface UpdateTransferInput {
  fromWarehouseId?: string
  toWarehouseId?: string
  notes?: string
  status?: TransferStatus
  transferItems?: Array<{
    id?: string
    itemId: string
    quantity: number
  }>
}

export interface TransferFilters {
  search: string
  fromWarehouseId: string
  toWarehouseId: string
  status: string
  dateFrom: string
  dateTo: string
}

export interface TransferStats {
  totalTransfers: number
  pendingTransfers: number
  completedTransfers: number
  inTransitTransfers: number
}

// Include type for transfer queries
const transferInclude = {
  fromWarehouse: {
    select: {
      id: true,
      name: true,
      location: true
    }
  },
  toWarehouse: {
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
  },
  approvedBy: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true
    }
  },
  transferItems: {
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
} satisfies Prisma.TransferInclude

// Where clause type for transfer queries
interface TransferWhereInput {
  OR?: Array<{
    transferNumber?: {
      contains: string
      mode: 'insensitive'
    }
    notes?: {
      contains: string
      mode: 'insensitive'
    }
  }>
  fromWarehouseId?: string
  toWarehouseId?: string
  status?: TransferStatus
  transferDate?: {
    gte?: Date
    lte?: Date
  }
}

// Raw type from database
type RawTransferWithDetails = Prisma.TransferGetPayload<{
  include: typeof transferInclude
}>

// Transform function
function transformTransfer(transfer: RawTransferWithDetails): TransferWithDetails {
  return {
    id: transfer.id,
    transferNumber: transfer.transferNumber,
    transferDate: transfer.transferDate,
    status: transfer.status,
    notes: transfer.notes,
    createdAt: transfer.createdAt,
    updatedAt: transfer.updatedAt,
    approvedAt: transfer.approvedAt,
    fromWarehouse: transfer.fromWarehouse,
    toWarehouse: transfer.toWarehouse,
    createdBy: transfer.createdBy,
    approvedBy: transfer.approvedBy,
    transferItems: transfer.transferItems.map(item => ({
      id: item.id,
      quantity: Number(item.quantity),
      item: item.item
    }))
  }
}

// Get all transfers with filters
export async function getTransfers(
  filters: Partial<TransferFilters> = {}
): Promise<{
  success: boolean
  data?: TransferWithDetails[]
  stats?: TransferStats
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const { search = "", fromWarehouseId = "all", toWarehouseId = "all", status = "all", dateFrom = "", dateTo = "" } = filters

    // Build where clause
    const where: TransferWhereInput = {}

    // Search filter
    if (search && search.trim() !== "") {
      where.OR = [
        {
          transferNumber: {
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

    // Warehouse filters
    if (fromWarehouseId && fromWarehouseId !== 'all') {
      where.fromWarehouseId = fromWarehouseId
    }
    if (toWarehouseId && toWarehouseId !== 'all') {
      where.toWarehouseId = toWarehouseId
    }

    // Status filter
    if (status && status !== 'all') {
      where.status = status as TransferStatus
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
      where.transferDate = dateFilter
    }

    const transfers = await prisma.transfer.findMany({
      where,
      include: transferInclude,
      orderBy: {
        createdAt: 'desc'
      }
    })

    const transformedTransfers = transfers.map(transformTransfer)

    // Calculate stats
    const stats: TransferStats = {
      totalTransfers: transfers.length,
      pendingTransfers: transfers.filter(t => t.status === TransferStatus.PENDING).length,
      completedTransfers: transfers.filter(t => t.status === TransferStatus.COMPLETED).length,
      inTransitTransfers: transfers.filter(t => t.status === TransferStatus.IN_TRANSIT).length,
    }

    return {
      success: true,
      data: transformedTransfers,
      stats
    }

  } catch (error) {
    console.error('Error fetching transfers:', error)
    return {
      success: false,
      error: 'Failed to fetch transfers'
    }
  }
}

// Create new transfer
export async function createTransfer(data: CreateTransferInput): Promise<{
  success: boolean
  data?: TransferWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Validate that from and to warehouses are different
    if (data.fromWarehouseId === data.toWarehouseId) {
      return { success: false, error: "Source and destination warehouses must be different" }
    }

    // Generate transfer number
    const lastTransfer = await prisma.transfer.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { transferNumber: true }
    })

    let nextNumber = 1
    if (lastTransfer?.transferNumber) {
      const match = lastTransfer.transferNumber.match(/TRF-(\d{4})-(\d+)/)
      if (match) {
        nextNumber = parseInt(match[2]) + 1
      }
    }

    const currentYear = new Date().getFullYear()
    const transferNumber = `TRF-${currentYear}-${nextNumber.toString().padStart(3, '0')}`

    const transfer = await prisma.transfer.create({
      data: {
        transferNumber,
        status: TransferStatus.PENDING,
        notes: data.notes,
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: data.toWarehouseId,
        createdById: session.user.id,
        transferItems: {
          create: data.transferItems.map(item => ({
            itemId: item.itemId,
            quantity: item.quantity
          }))
        }
      },
      include: transferInclude
    })

    revalidatePath('/dashboard/transfers')
    
    return {
      success: true,
      data: transformTransfer(transfer)
    }

  } catch (error) {
    console.error('Error creating transfer:', error)
    return {
      success: false,
      error: 'Failed to create transfer'
    }
  }
}

// Approve and execute transfer
export async function approveTransfer(transferId: string): Promise<{
  success: boolean
  data?: TransferWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Get transfer details with warehouse relations
    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      include: {
        fromWarehouse: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        toWarehouse: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        transferItems: {
          include: {
            item: true
          }
        }
      }
    })

    if (!transfer) {
      return { success: false, error: "Transfer not found" }
    }

    if (transfer.status !== TransferStatus.PENDING) {
      return { success: false, error: "Transfer is not in pending status" }
    }

    // Start transaction to update transfer and create inventory movements
    const result = await prisma.$transaction(async (tx) => {
      // Update transfer status
      const updatedTransfer = await tx.transfer.update({
        where: { id: transferId },
        data: {
          status: TransferStatus.COMPLETED,
          approvedById: session.user.id,
          approvedAt: new Date()
        },
        include: transferInclude
      })

      // Create inventory movements for each item
      for (const transferItem of transfer.transferItems) {
        // Get current inventory for cost calculation
        const currentInventory = await tx.currentInventory.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: transferItem.itemId,
              warehouseId: transfer.fromWarehouseId
            }
          }
        })

        if (!currentInventory || Number(currentInventory.quantity) < Number(transferItem.quantity)) {
          throw new Error(`Insufficient inventory for item ${transferItem.item.itemCode}`)
        }

        const unitCost = Number(currentInventory.avgUnitCost)
        const totalValue = Number(transferItem.quantity) * unitCost

        // Create transfer out movement
        await tx.inventoryMovement.create({
          data: {
            movementType: MovementType.TRANSFER_OUT,
            quantity: -Number(transferItem.quantity),
            unitCost,
            totalValue: -totalValue,
            referenceId: transferId,
            notes: `Transfer to ${transfer.toWarehouse.name}`,
            itemId: transferItem.itemId,
            warehouseId: transfer.fromWarehouseId,
            balanceQuantity: Number(currentInventory.quantity) - Number(transferItem.quantity),
            balanceValue: Number(currentInventory.totalValue) - totalValue,
            costMethod: transferItem.item.costingMethod
          }
        })

        // Create transfer in movement
        const toInventory = await tx.currentInventory.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: transferItem.itemId,
              warehouseId: transfer.toWarehouseId
            }
          }
        })

        const newToQuantity = Number(toInventory?.quantity || 0) + Number(transferItem.quantity)
        const newToValue = Number(toInventory?.totalValue || 0) + totalValue

        await tx.inventoryMovement.create({
          data: {
            movementType: MovementType.TRANSFER_IN,
            quantity: Number(transferItem.quantity),
            unitCost,
            totalValue,
            referenceId: transferId,
            notes: `Transfer from ${transfer.fromWarehouse.name}`,
            itemId: transferItem.itemId,
            warehouseId: transfer.toWarehouseId,
            balanceQuantity: newToQuantity,
            balanceValue: newToValue,
            costMethod: transferItem.item.costingMethod
          }
        })

        // Update current inventory for source warehouse
        await tx.currentInventory.update({
          where: {
            itemId_warehouseId: {
              itemId: transferItem.itemId,
              warehouseId: transfer.fromWarehouseId
            }
          },
          data: {
            quantity: Number(currentInventory.quantity) - Number(transferItem.quantity),
            totalValue: Number(currentInventory.totalValue) - totalValue,
            avgUnitCost: unitCost
          }
        })

        // Update or create current inventory for destination warehouse
        await tx.currentInventory.upsert({
          where: {
            itemId_warehouseId: {
              itemId: transferItem.itemId,
              warehouseId: transfer.toWarehouseId
            }
          },
          update: {
            quantity: newToQuantity,
            totalValue: newToValue,
            avgUnitCost: newToValue / newToQuantity
          },
          create: {
            itemId: transferItem.itemId,
            warehouseId: transfer.toWarehouseId,
            quantity: Number(transferItem.quantity),
            totalValue,
            avgUnitCost: unitCost
          }
        })
      }

      return updatedTransfer
    })

    revalidatePath('/dashboard/transfers')
    revalidatePath(`/dashboard/transfers/${transferId}`)
    
    return {
      success: true,
      data: transformTransfer(result)
    }

  } catch (error) {
    console.error('Error approving transfer:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve transfer'
    }
  }
}

// Get transfer by ID
export async function getTransferById(transferId: string): Promise<{
  success: boolean
  data?: TransferWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      include: transferInclude
    })

    if (!transfer) {
      return { success: false, error: "Transfer not found" }
    }

    return {
      success: true,
      data: transformTransfer(transfer)
    }

  } catch (error) {
    console.error('Error fetching transfer:', error)
    return {
      success: false,
      error: 'Failed to fetch transfer'
    }
  }
}

// Delete transfer
export async function deleteTransfer(transferId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if transfer can be deleted
    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      select: { status: true }
    })

    if (!transfer) {
      return { success: false, error: "Transfer not found" }
    }

    if (transfer.status === TransferStatus.COMPLETED) {
      return { success: false, error: "Cannot delete completed transfer" }
    }

    await prisma.transfer.delete({
      where: { id: transferId }
    })

    revalidatePath('/dashboard/transfers')
    
    return { success: true }

  } catch (error) {
    console.error('Error deleting transfer:', error)
    return {
      success: false,
      error: 'Failed to delete transfer'
    }
  }
}

// Get warehouses for transfer
export async function getWarehousesForTransfer(): Promise<{
  success: boolean
  data?: Array<{ id: string; name: string; location: string | null }>
  error?: string
}> {
  try {
    const warehouses = await prisma.warehouse.findMany({
      select: {
        id: true,
        name: true,
        location: true
      },
      orderBy: {
        name: 'asc'
      }
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

// Get items available for transfer from specific warehouse
export async function getItemsForTransfer(warehouseId: string): Promise<{
  success: boolean
  data?: Array<{
    id: string
    itemCode: string
    description: string
    unitOfMeasure: string
    availableQuantity: number
  }>
  error?: string
}> {
  try {
    const currentInventory = await prisma.currentInventory.findMany({
      where: {
        warehouseId,
        quantity: { gt: 0 }
      },
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
    })

    const items = currentInventory.map(inv => ({
      id: inv.item.id,
      itemCode: inv.item.itemCode,
      description: inv.item.description,
      unitOfMeasure: inv.item.unitOfMeasure,
      availableQuantity: Number(inv.quantity)
    }))

    return {
      success: true,
      data: items
    }

  } catch (error) {
    console.error('Error fetching items for transfer:', error)
    return {
      success: false,
      error: 'Failed to fetch items for transfer'
    }
  }
}