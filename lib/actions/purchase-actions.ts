"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { PurchaseStatus, Prisma } from "@prisma/client"

export interface PurchaseWithDetails {
  id: string
  purchaseOrder: string
  purchaseDate: Date
  totalCost: number
  status: PurchaseStatus
  createdAt: Date
  updatedAt: Date
  approvedAt: Date | null
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
    }
  }>
}

export interface CreatePurchaseInput {
  supplierId: string
  purchaseItems: Array<{
    itemId: string
    quantity: number
    unitCost: number
  }>
}

export interface UpdatePurchaseInput {
  supplierId?: string
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
  totalValue: number
  pendingPurchases: number
  receivedPurchases: number
  averageOrderValue: number
  topSuppliers: Array<{
    id: string
    name: string
    totalOrders: number
    totalValue: number
  }>
}

// Type for building the where clause
interface PurchaseWhereInput {
  OR?: Array<{
    purchaseOrder?: {
      contains: string
      mode: 'insensitive'
    }
    supplier?: {
      name?: {
        contains: string
        mode: 'insensitive'
      }
    }
  }>
  supplierId?: string
  status?: PurchaseStatus
  purchaseDate?: {
    gte?: Date
    lte?: Date
  }
}

// Type for purchase update data
interface PurchaseUpdateData {
  supplierId?: string
  status?: PurchaseStatus
  totalCost?: number
  purchaseItems?: {
    deleteMany: Record<string, never>
    create: Array<{
      itemId: string
      quantity: number
      unitCost: number
      totalCost: number
    }>
  }
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
          unitOfMeasure: true
        }
      }
    }
  }
} satisfies Prisma.PurchaseInclude

// Type for the raw purchase from database
type RawPurchaseWithDetails = Prisma.PurchaseGetPayload<{
  include: typeof purchaseInclude
}>

// Transform function to convert raw data to our interface
function transformPurchase(purchase: RawPurchaseWithDetails): PurchaseWithDetails {
  return {
    id: purchase.id,
    purchaseOrder: purchase.purchaseOrder,
    purchaseDate: purchase.purchaseDate,
    totalCost: Number(purchase.totalCost),
    status: purchase.status,
    createdAt: purchase.createdAt,
    updatedAt: purchase.updatedAt,
    approvedAt: purchase.approvedAt,
    supplier: purchase.supplier,
    createdBy: purchase.createdBy,
    approvedBy: purchase.approvedBy,
    purchaseItems: purchase.purchaseItems.map(item => ({
      id: item.id,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      totalCost: Number(item.totalCost),
      item: item.item
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

    // Build where clause with proper typing
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
          supplier: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
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

    // Transform data
    const transformedPurchases = purchases.map(transformPurchase)

    // Calculate stats
    const stats: PurchaseStats = {
      totalPurchases: purchases.length,
      totalValue: purchases.reduce((sum, p) => sum + Number(p.totalCost), 0),
      pendingPurchases: purchases.filter(p => p.status === PurchaseStatus.PENDING).length,
      receivedPurchases: purchases.filter(p => p.status === PurchaseStatus.RECEIVED).length,
      averageOrderValue: purchases.length > 0 
        ? purchases.reduce((sum, p) => sum + Number(p.totalCost), 0) / purchases.length 
        : 0,
      topSuppliers: [] // TODO: Implement top suppliers calculation
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

// Get single purchase by ID
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

    // Calculate total cost
    const totalCost = data.purchaseItems.reduce((sum, item) => 
      sum + (item.quantity * item.unitCost), 0
    )

    const purchase = await prisma.purchase.create({
      data: {
        purchaseOrder,
        totalCost,
        status: PurchaseStatus.PENDING,
        supplierId: data.supplierId,
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
      error: 'Failed to create purchase'
    }
  }
}

// Update purchase
export async function updatePurchase(purchaseId: string, data: UpdatePurchaseInput): Promise<{
  success: boolean
  data?: PurchaseWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if purchase exists and can be updated
    const existingPurchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      select: { status: true }
    })

    if (!existingPurchase) {
      return { success: false, error: "Purchase not found" }
    }

    if (existingPurchase.status === PurchaseStatus.RECEIVED) {
      return { success: false, error: "Cannot update received purchase" }
    }

    // Calculate new total cost if items are being updated
    let totalCost: number | undefined
    if (data.purchaseItems) {
      totalCost = data.purchaseItems.reduce((sum, item) => 
        sum + (item.quantity * item.unitCost), 0
      )
    }

    // Build update data with proper typing
    const updateData: PurchaseUpdateData = {}
    if (data.supplierId) updateData.supplierId = data.supplierId
    if (data.status) updateData.status = data.status
    if (totalCost !== undefined) updateData.totalCost = totalCost

    if (data.purchaseItems) {
      updateData.purchaseItems = {
        deleteMany: {},
        create: data.purchaseItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost
        }))
      }
    }

    const purchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: updateData,
      include: purchaseInclude
    })

    revalidatePath('/dashboard/purchases')
    revalidatePath(`/dashboard/purchases/${purchaseId}`)
    
    return {
      success: true,
      data: transformPurchase(purchase)
    }

  } catch (error) {
    console.error('Error updating purchase:', error)
    return {
      success: false,
      error: 'Failed to update purchase'
    }
  }
}

// Delete purchase
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

    if (purchase.status === PurchaseStatus.RECEIVED) {
      return { success: false, error: "Cannot delete received purchase" }
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

// Approve purchase
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

    const purchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: PurchaseStatus.RECEIVED,
        approvedById: session.user.id,
        approvedAt: new Date()
      },
      include: purchaseInclude
    })

    revalidatePath('/dashboard/purchases')
    revalidatePath(`/dashboard/purchases/${purchaseId}`)
    
    return {
      success: true,
      data: transformPurchase(purchase)
    }

  } catch (error) {
    console.error('Error approving purchase:', error)
    return {
      success: false,
      error: 'Failed to approve purchase'
    }
  }
}

// Get suppliers for dropdown
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
  }>
  error?: string
}> {
  try {
    const items = await prisma.item.findMany({
      select: {
        id: true,
        itemCode: true,
        description: true,
        unitOfMeasure: true,
        standardCost: true
      },
      orderBy: {
        itemCode: 'asc'
      }
    })

    return {
      success: true,
      data: items.map(item => ({
        ...item,
        standardCost: Number(item.standardCost)
      }))
    }

  } catch (error) {
    console.error('Error fetching items:', error)
    return {
      success: false,
      error: 'Failed to fetch items'
    }
  }
}