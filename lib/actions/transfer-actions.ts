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
  completedTransfers: number
  inTransitTransfers: number
  cancelledTransfers: number
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
    fromWarehouse: transfer.fromWarehouse,
    toWarehouse: transfer.toWarehouse,
    createdBy: transfer.createdBy,
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

    // Calculate stats (no PENDING status since removed)
    const stats: TransferStats = {
      totalTransfers: transfers.length,
      completedTransfers: transfers.filter(t => t.status === TransferStatus.COMPLETED).length,
      inTransitTransfers: transfers.filter(t => t.status === TransferStatus.IN_TRANSIT).length,
      cancelledTransfers: transfers.filter(t => t.status === TransferStatus.CANCELLED).length,
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

// Create new transfer (automatically completed)
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

    // Validate input
    if (!data.transferItems || data.transferItems.length === 0) {
      return { success: false, error: "At least one item is required for transfer" }
    }

    // Validate that from and to warehouses are different
    if (data.fromWarehouseId === data.toWarehouseId) {
      return { success: false, error: "Source and destination warehouses must be different" }
    }

    // Validate warehouse existence
    const [fromWarehouse, toWarehouse] = await Promise.all([
      prisma.warehouse.findUnique({ where: { id: data.fromWarehouseId } }),
      prisma.warehouse.findUnique({ where: { id: data.toWarehouseId } })
    ])

    if (!fromWarehouse) {
      return { success: false, error: "Source warehouse not found" }
    }
    if (!toWarehouse) {
      return { success: false, error: "Destination warehouse not found" }
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

    // Execute transfer in transaction (auto-complete)
    const result = await prisma.$transaction(async (tx) => {
      // Create transfer with COMPLETED status
      const transfer = await tx.transfer.create({
        data: {
          transferNumber,
          status: TransferStatus.COMPLETED,
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
        include: {
          fromWarehouse: { select: { id: true, name: true, location: true } },
          toWarehouse: { select: { id: true, name: true, location: true } },
          transferItems: {
            include: {
              item: {
                select: {
                  id: true,
                  itemCode: true,
                  description: true,
                  unitOfMeasure: true,
                  costingMethod: true
                }
              }
            }
          }
        }
      })

      // Process inventory movements for each item
      for (const transferItem of transfer.transferItems) {
        // Check inventory availability
        const currentInventory = await tx.currentInventory.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: transferItem.itemId,
              warehouseId: data.fromWarehouseId
            }
          }
        })

        if (!currentInventory) {
          throw new Error(`Item ${transferItem.item.itemCode} not found in source warehouse`)
        }

        if (Number(currentInventory.quantity) < Number(transferItem.quantity)) {
          throw new Error(`Insufficient inventory for item ${transferItem.item.itemCode}. Available: ${Number(currentInventory.quantity)}, Requested: ${Number(transferItem.quantity)}`)
        }

        const unitCost = Number(currentInventory.avgUnitCost)
        const totalValue = Number(transferItem.quantity) * unitCost

        // Create transfer out movement
        const newFromQuantity = Number(currentInventory.quantity) - Number(transferItem.quantity)
        const newFromValue = Number(currentInventory.totalValue) - totalValue

        await tx.inventoryMovement.create({
          data: {
            movementType: MovementType.TRANSFER_OUT,
            quantity: -Number(transferItem.quantity),
            unitCost,
            totalValue: -totalValue,
            referenceId: transfer.id,
            notes: `Transfer to ${transfer.toWarehouse.name}`,
            itemId: transferItem.itemId,
            warehouseId: data.fromWarehouseId,
            balanceQuantity: newFromQuantity,
            balanceValue: newFromValue,
            costMethod: transferItem.item.costingMethod
          }
        })

        // Update source warehouse inventory
        await tx.currentInventory.update({
          where: {
            itemId_warehouseId: {
              itemId: transferItem.itemId,
              warehouseId: data.fromWarehouseId
            }
          },
          data: {
            quantity: newFromQuantity,
            totalValue: newFromValue,
            avgUnitCost: newFromQuantity > 0 ? newFromValue / newFromQuantity : 0
          }
        })

        // Handle destination warehouse inventory
        const toInventory = await tx.currentInventory.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: transferItem.itemId,
              warehouseId: data.toWarehouseId
            }
          }
        })

        const newToQuantity = Number(toInventory?.quantity || 0) + Number(transferItem.quantity)
        const newToValue = Number(toInventory?.totalValue || 0) + totalValue

        // Create transfer in movement
        await tx.inventoryMovement.create({
          data: {
            movementType: MovementType.TRANSFER_IN,
            quantity: Number(transferItem.quantity),
            unitCost,
            totalValue,
            referenceId: transfer.id,
            notes: `Transfer from ${transfer.fromWarehouse.name}`,
            itemId: transferItem.itemId,
            warehouseId: data.toWarehouseId,
            balanceQuantity: newToQuantity,
            balanceValue: newToValue,
            costMethod: transferItem.item.costingMethod
          }
        })

        // Update or create destination warehouse inventory
        await tx.currentInventory.upsert({
          where: {
            itemId_warehouseId: {
              itemId: transferItem.itemId,
              warehouseId: data.toWarehouseId
            }
          },
          update: {
            quantity: newToQuantity,
            totalValue: newToValue,
            avgUnitCost: newToValue / newToQuantity
          },
          create: {
            itemId: transferItem.itemId,
            warehouseId: data.toWarehouseId,
            quantity: Number(transferItem.quantity),
            totalValue,
            avgUnitCost: unitCost
          }
        })
      }

      return transfer
    })

    // Get the full transfer data for response
    const fullTransfer = await prisma.transfer.findUnique({
      where: { id: result.id },
      include: transferInclude
    })

    if (!fullTransfer) {
      throw new Error("Failed to retrieve created transfer")
    }

    revalidatePath('/dashboard/transfers')
    
    return {
      success: true,
      data: transformTransfer(fullTransfer)
    }

  } catch (error) {
    console.error('Error creating transfer:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create transfer'
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

// Cancel transfer (only if IN_TRANSIT)
export async function cancelTransfer(transferId: string): Promise<{
  success: boolean
  data?: TransferWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check transfer status
    const existingTransfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      select: { status: true }
    })

    if (!existingTransfer) {
      return { success: false, error: "Transfer not found" }
    }

    if (existingTransfer.status === TransferStatus.COMPLETED) {
      return { success: false, error: "Cannot cancel completed transfer" }
    }

    if (existingTransfer.status === TransferStatus.CANCELLED) {
      return { success: false, error: "Transfer is already cancelled" }
    }

    const updatedTransfer = await prisma.transfer.update({
      where: { id: transferId },
      data: {
        status: TransferStatus.CANCELLED,
        updatedAt: new Date()
      },
      include: transferInclude
    })

    revalidatePath('/dashboard/transfers')
    revalidatePath(`/dashboard/transfers/${transferId}`)

    return {
      success: true,
      data: transformTransfer(updatedTransfer)
    }

  } catch (error) {
    console.error('Error cancelling transfer:', error)
    return {
      success: false,
      error: 'Failed to cancel transfer'
    }
  }
}

// Delete transfer (only if cancelled)
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
      return { success: false, error: "Cannot delete completed transfer. Completed transfers must be kept for audit purposes." }
    }

    if (transfer.status === TransferStatus.IN_TRANSIT) {
      return { success: false, error: "Cannot delete transfer in transit. Please cancel the transfer first." }
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
    avgUnitCost: number
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
      },
      orderBy: {
        item: {
          itemCode: 'asc'
        }
      }
    })

    const items = currentInventory.map(inv => ({
      id: inv.item.id,
      itemCode: inv.item.itemCode,
      description: inv.item.description,
      unitOfMeasure: inv.item.unitOfMeasure,
      availableQuantity: Number(inv.quantity),
      avgUnitCost: Number(inv.avgUnitCost)
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