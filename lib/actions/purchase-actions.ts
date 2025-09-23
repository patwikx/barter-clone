"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { PurchaseStatus, MovementType, Prisma } from "@prisma/client"

export interface PurchaseWithDetails {
  id: string
  purchaseOrder: string
  purchaseDate: Date
  status: PurchaseStatus
  totalCost: number
  notes: string | null
  approvedAt: Date | null
  createdAt: Date
  updatedAt: Date
  supplier: {
    id: string
    name: string
    contactInfo: string | null
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
  purchaseItems: Array<{
    id: string
    quantity: number
    unitCost: number
    totalCost: number
    item: {
      id: string
      itemCode: string
      description: string
      unitOfMeasure: string
      category: {
        id: string
        name: string
        code: string | null
      } | null
    }
  }>
}

export interface CreatePurchaseInput {
  supplierId: string
  notes?: string
  purchaseItems: Array<{
    itemId: string
    quantity: number
    unitCost: number
  }>
}

export interface UpdatePurchaseInput {
  supplierId?: string
  notes?: string
  status?: PurchaseStatus
  purchaseItems?: Array<{
    id?: string
    itemId: string
    quantity: number
    unitCost: number
  }>
}

export interface PurchaseFilters {
  search: string
  supplierId: string
  status: string
  dateFrom: string
  dateTo: string
}

export interface PurchaseStats {
  totalPurchases: number
  pendingPurchases: number
  receivedPurchases: number
  totalValue: number
  averageOrderValue: number
}

// Include type for purchase queries
const purchaseInclude = {
  supplier: {
    select: {
      id: true,
      name: true,
      contactInfo: true
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
  purchaseItems: {
    include: {
      item: {
        select: {
          id: true,
          itemCode: true,
          description: true,
          unitOfMeasure: true,
          category: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      }
    }
  }
} satisfies Prisma.PurchaseInclude

// Where clause type for purchase queries
interface PurchaseWhereInput {
  OR?: Array<{
    purchaseOrder?: {
      contains: string
      mode: 'insensitive'
    }
    notes?: {
      contains: string
      mode: 'insensitive'
    }
  }>
  supplierId?: string
  status?: PurchaseStatus
  purchaseDate?: {
    gte?: Date
    lte?: Date
  }
}

// Raw type from database
type RawPurchaseWithDetails = Prisma.PurchaseGetPayload<{
  include: typeof purchaseInclude
}>

// Transform function
function transformPurchase(purchase: RawPurchaseWithDetails): PurchaseWithDetails {
  return {
    id: purchase.id,
    purchaseOrder: purchase.purchaseOrder,
    purchaseDate: purchase.purchaseDate,
    status: purchase.status,
    totalCost: Number(purchase.totalCost),
    notes: purchase.notes,
    approvedAt: purchase.approvedAt,
    createdAt: purchase.createdAt,
    updatedAt: purchase.updatedAt,
    supplier: purchase.supplier,
    createdBy: purchase.createdBy,
    approvedBy: purchase.approvedBy,
    purchaseItems: purchase.purchaseItems.map(item => ({
      id: item.id,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      totalCost: Number(item.totalCost),
      item: {
        id: item.item.id,
        itemCode: item.item.itemCode,
        description: item.item.description,
        unitOfMeasure: item.item.unitOfMeasure,
        category: item.item.category
      }
    }))
  }
}

// Get all purchases with filters
export async function getPurchases(
  filters: Partial<PurchaseFilters> = {}
): Promise<{
  success: boolean
  data?: PurchaseWithDetails[]
  stats?: PurchaseStats
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const { search = "", supplierId = "all", status = "all", dateFrom = "", dateTo = "" } = filters

    // Build where clause
    const where: PurchaseWhereInput = {}

    // Search filter
    if (search && search.trim() !== "") {
      where.OR = [
        {
          purchaseOrder: {
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

    // Supplier filter
    if (supplierId && supplierId !== 'all') {
      where.supplierId = supplierId
    }

    // Status filter
    if (status && status !== 'all') {
      where.status = status as PurchaseStatus
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
      where.purchaseDate = dateFilter
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: purchaseInclude,
      orderBy: {
        createdAt: 'desc'
      }
    })

    const transformedPurchases = purchases.map(transformPurchase)

    // Calculate stats
    const totalValue = purchases.reduce((sum, purchase) => sum + Number(purchase.totalCost), 0)
    const stats: PurchaseStats = {
      totalPurchases: purchases.length,
      pendingPurchases: purchases.filter(p => p.status === PurchaseStatus.PENDING).length,
      receivedPurchases: purchases.filter(p => p.status === PurchaseStatus.RECEIVED).length,
      totalValue,
      averageOrderValue: purchases.length > 0 ? totalValue / purchases.length : 0
    }

    return {
      success: true,
      data: transformedPurchases,
      stats
    }

  } catch (error) {
    console.error('Error fetching purchases:', error)
    return {
      success: false,
      error: 'Failed to fetch purchases'
    }
  }
}

// Create new purchase
export async function createPurchase(data: CreatePurchaseInput): Promise<{
  success: boolean
  data?: PurchaseWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Validate input
    if (!data.purchaseItems || data.purchaseItems.length === 0) {
      return { success: false, error: "At least one item is required" }
    }

    // Generate purchase order number
    const lastPurchase = await prisma.purchase.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { purchaseOrder: true }
    })

    let nextNumber = 1
    if (lastPurchase?.purchaseOrder) {
      const match = lastPurchase.purchaseOrder.match(/PO-(\d{4})-(\d+)/)
      if (match) {
        nextNumber = parseInt(match[2]) + 1
      }
    }

    const currentYear = new Date().getFullYear()
    const purchaseOrder = `PO-${currentYear}-${nextNumber.toString().padStart(3, '0')}`

    const totalCost = data.purchaseItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)

    const purchase = await prisma.purchase.create({
      data: {
        purchaseOrder,
        supplierId: data.supplierId,
        totalCost,
        notes: data.notes,
        createdById: session.user.id,
        purchaseItems: {
          create: data.purchaseItems.map(item => ({
            itemId: item.itemId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.quantity * item.unitCost
          }))
        }
      },
      include: purchaseInclude
    })

    revalidatePath('/dashboard/purchases')
    
    return {
      success: true,
      data: transformPurchase(purchase)
    }

  } catch (error) {
    console.error('Error creating purchase:', error)
    return {
      success: false,
      error: 'Failed to create purchase order'
    }
  }
}

// Get purchase by ID
export async function getPurchaseById(purchaseId: string): Promise<{
  success: boolean
  data?: PurchaseWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: purchaseInclude
    })

    if (!purchase) {
      return { success: false, error: "Purchase not found" }
    }

    return {
      success: true,
      data: transformPurchase(purchase)
    }

  } catch (error) {
    console.error('Error fetching purchase:', error)
    return {
      success: false,
      error: 'Failed to fetch purchase'
    }
  }
}

// Approve purchase and create item entries
export async function approvePurchase(purchaseId: string): Promise<{
  success: boolean
  data?: PurchaseWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Get purchase details
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        purchaseItems: {
          include: {
            item: true
          }
        },
        supplier: true
      }
    })

    if (!purchase) {
      return { success: false, error: "Purchase not found" }
    }

    if (purchase.status !== PurchaseStatus.PENDING) {
      return { success: false, error: "Purchase is not pending approval" }
    }

    // Get main warehouse for item entries
    const mainWarehouse = await prisma.warehouse.findFirst({
      where: { isMainWarehouse: true }
    })

    if (!mainWarehouse) {
      return { success: false, error: "Main warehouse not found" }
    }

    // Process purchase approval in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update purchase status
      const updatedPurchase = await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          status: PurchaseStatus.RECEIVED,
          approvedAt: new Date(),
          approvedById: session.user.id
        },
        include: purchaseInclude
      })

      // Create item entries for each purchase item
      for (const purchaseItem of purchase.purchaseItems) {
        await tx.itemEntry.create({
          data: {
            itemId: purchaseItem.itemId,
            warehouseId: mainWarehouse.id,
            supplierId: purchase.supplierId,
            quantity: Number(purchaseItem.quantity),
            landedCost: Number(purchaseItem.unitCost),
            totalValue: Number(purchaseItem.totalCost),
            purchaseReference: purchase.purchaseOrder,
            notes: `From purchase order ${purchase.purchaseOrder}`,
            createdById: session.user.id
          }
        })

        // Get current inventory for this item-warehouse combination
        const currentInventory = await tx.currentInventory.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: purchaseItem.itemId,
              warehouseId: mainWarehouse.id
            }
          }
        })

        // Calculate new inventory values
        const currentQty = currentInventory ? Number(currentInventory.quantity) : 0
        const currentValue = currentInventory ? Number(currentInventory.totalValue) : 0
        
        const newQuantity = currentQty + Number(purchaseItem.quantity)
        const newTotalValue = currentValue + Number(purchaseItem.totalCost)
        const newAvgUnitCost = newTotalValue / newQuantity

        // Create inventory movement
        await tx.inventoryMovement.create({
          data: {
            movementType: MovementType.PURCHASE_RECEIPT,
            quantity: Number(purchaseItem.quantity),
            unitCost: Number(purchaseItem.unitCost),
            totalValue: Number(purchaseItem.totalCost),
            referenceId: purchaseId,
            notes: `Purchase receipt from ${purchase.supplier.name}`,
            itemId: purchaseItem.itemId,
            warehouseId: mainWarehouse.id,
            balanceQuantity: newQuantity,
            balanceValue: newTotalValue,
            costMethod: purchaseItem.item.costingMethod
          }
        })

        // Update or create current inventory
        await tx.currentInventory.upsert({
          where: {
            itemId_warehouseId: {
              itemId: purchaseItem.itemId,
              warehouseId: mainWarehouse.id
            }
          },
          update: {
            quantity: newQuantity,
            totalValue: newTotalValue,
            avgUnitCost: newAvgUnitCost
          },
          create: {
            itemId: purchaseItem.itemId,
            warehouseId: mainWarehouse.id,
            quantity: Number(purchaseItem.quantity),
            totalValue: Number(purchaseItem.totalCost),
            avgUnitCost: Number(purchaseItem.unitCost)
          }
        })
      }

      return updatedPurchase
    })

    revalidatePath('/dashboard/purchases')
    revalidatePath(`/dashboard/purchases/${purchaseId}`)
    
    return {
      success: true,
      data: transformPurchase(result)
    }

  } catch (error) {
    console.error('Error approving purchase:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve purchase'
    }
  }
}

// Delete purchase (only if pending)
export async function deletePurchase(purchaseId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if purchase can be deleted
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      select: { status: true }
    })

    if (!purchase) {
      return { success: false, error: "Purchase not found" }
    }

    if (purchase.status !== PurchaseStatus.PENDING) {
      return { success: false, error: "Can only delete pending purchase orders" }
    }

    await prisma.purchase.delete({
      where: { id: purchaseId }
    })

    revalidatePath('/dashboard/purchases')
    
    return { success: true }

  } catch (error) {
    console.error('Error deleting purchase:', error)
    return {
      success: false,
      error: 'Failed to delete purchase'
    }
  }
}

// Get suppliers for purchase
export async function getSuppliersForPurchase(): Promise<{
  success: boolean
  data?: Array<{ id: string; name: string }>
  error?: string
}> {
  try {
    const suppliers = await prisma.supplier.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return {
      success: true,
      data: suppliers
    }

  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return {
      success: false,
      error: 'Failed to fetch suppliers'
    }
  }
}

// Get items for purchase
export async function getItemsForPurchase(): Promise<{
  success: boolean
  data?: Array<{
    id: string
    itemCode: string
    description: string
    unitOfMeasure: string
    standardCost: number
    category: {
      id: string
      name: string
      code: string | null
    } | null
  }>
  error?: string
}> {
  try {
    const items = await prisma.item.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            code: true
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
      category: item.category
    }))

    return {
      success: true,
      data: transformedItems
    }

  } catch (error) {
    console.error('Error fetching items for purchase:', error)
    return {
      success: false,
      error: 'Failed to fetch items for purchase'
    }
  }
}