"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

export interface SupplierWithDetails {
  id: string
  name: string
  contactInfo: string | null
  purchaseReference: string | null
  createdAt: Date
  updatedAt: Date
  _count: {
    items: number
    itemEntries: number
  }
}

export interface CreateSupplierInput {
  name: string
  contactInfo?: string
  purchaseReference?: string
}

export interface UpdateSupplierInput {
  name?: string
  contactInfo?: string
  purchaseReference?: string
}

export interface SupplierFilters {
  search: string
}

// Where clause type for supplier queries
interface SupplierWhereInput {
  OR?: Array<{
    name?: {
      contains: string
      mode: 'insensitive'
    }
    contactInfo?: {
      contains: string
      mode: 'insensitive'
    }
    purchaseReference?: {
      contains: string
      mode: 'insensitive'
    }
  }>
}

// Include type for supplier queries
const supplierInclude = {
  _count: {
    select: {
      items: true,
      itemEntries: true
    }
  }
} satisfies Prisma.SupplierInclude

// Raw type from database
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type RawSupplierWithDetails = Prisma.SupplierGetPayload<{
  include: typeof supplierInclude
}>

// Get all suppliers with filters
export async function getSuppliers(
  filters: Partial<SupplierFilters> = {}
): Promise<{
  success: boolean
  data?: SupplierWithDetails[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const { search = "" } = filters

    // Build where clause with proper typing
    const where: SupplierWhereInput = {}

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
          contactInfo: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          purchaseReference: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: supplierInclude,
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

// Get single supplier by ID
export async function getSupplierById(supplierId: string): Promise<{
  success: boolean
  data?: SupplierWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: supplierInclude
    })

    if (!supplier) {
      return { success: false, error: "Supplier not found" }
    }

    return {
      success: true,
      data: supplier
    }

  } catch (error) {
    console.error('Error fetching supplier:', error)
    return {
      success: false,
      error: 'Failed to fetch supplier'
    }
  }
}

// Get supplier with detailed information including recent entries
export async function getSupplierDetails(supplierId: string): Promise<{
  success: boolean
  data?: SupplierWithDetails & {
    recentItemEntries: Array<{
      id: string
      quantity: number
      landedCost: number
      totalValue: number
      entryDate: Date
      purchaseReference: string | null
      item: {
        itemCode: string
        description: string
      }
      warehouse: {
        name: string
      }
    }>
  }
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        ...supplierInclude,
        itemEntries: {
          take: 10,
          orderBy: { entryDate: 'desc' },
          include: {
            item: {
              select: {
                itemCode: true,
                description: true
              }
            },
            warehouse: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!supplier) {
      return { success: false, error: "Supplier not found" }
    }

    // Convert Decimal types to numbers
    const recentItemEntries = supplier.itemEntries.map(entry => ({
      id: entry.id,
      quantity: Number(entry.quantity),
      landedCost: Number(entry.landedCost),
      totalValue: Number(entry.totalValue),
      entryDate: entry.entryDate,
      purchaseReference: entry.purchaseReference,
      item: entry.item,
      warehouse: entry.warehouse
    }))

    return {
      success: true,
      data: {
        ...supplier,
        recentItemEntries
      }
    }

  } catch (error) {
    console.error('Error fetching supplier details:', error)
    return {
      success: false,
      error: 'Failed to fetch supplier details'
    }
  }
}

// Create new supplier
export async function createSupplier(data: CreateSupplierInput): Promise<{
  success: boolean
  data?: SupplierWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Validate required fields
    if (!data.name || data.name.trim() === "") {
      return { success: false, error: "Supplier name is required" }
    }

    // Check if supplier name already exists
    const existingSupplier = await prisma.supplier.findFirst({
      where: { 
        name: {
          equals: data.name.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingSupplier) {
      return { success: false, error: "Supplier name already exists" }
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: data.name.trim(),
        contactInfo: data.contactInfo?.trim() || null,
        purchaseReference: data.purchaseReference?.trim() || null
      },
      include: supplierInclude
    })

    revalidatePath('/dashboard/suppliers')
    
    return {
      success: true,
      data: supplier
    }

  } catch (error) {
    console.error('Error creating supplier:', error)
    return {
      success: false,
      error: 'Failed to create supplier'
    }
  }
}

// Update supplier
export async function updateSupplier(supplierId: string, data: UpdateSupplierInput): Promise<{
  success: boolean
  data?: SupplierWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Validate supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    })

    if (!existingSupplier) {
      return { success: false, error: "Supplier not found" }
    }

    // Check if supplier name already exists (if updating name)
    if (data.name && data.name.trim() !== "") {
      const nameConflict = await prisma.supplier.findFirst({
        where: {
          name: {
            equals: data.name.trim(),
            mode: 'insensitive'
          },
          NOT: { id: supplierId }
        }
      })

      if (nameConflict) {
        return { success: false, error: "Supplier name already exists" }
      }
    }

    // Build update data with proper typing
    const updateData: {
      name?: string
      contactInfo?: string | null
      purchaseReference?: string | null
      updatedAt: Date
    } = {
      updatedAt: new Date()
    }

    if (data.name !== undefined) {
      if (data.name.trim() === "") {
        return { success: false, error: "Supplier name cannot be empty" }
      }
      updateData.name = data.name.trim()
    }
    if (data.contactInfo !== undefined) {
      updateData.contactInfo = data.contactInfo?.trim() || null
    }
    if (data.purchaseReference !== undefined) {
      updateData.purchaseReference = data.purchaseReference?.trim() || null
    }

    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: updateData,
      include: supplierInclude
    })

    revalidatePath('/dashboard/suppliers')
    revalidatePath(`/dashboard/suppliers/${supplierId}`)
    
    return {
      success: true,
      data: supplier
    }

  } catch (error) {
    console.error('Error updating supplier:', error)
    return {
      success: false,
      error: 'Failed to update supplier'
    }
  }
}

// Delete supplier
export async function deleteSupplier(supplierId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Validate supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    })

    if (!existingSupplier) {
      return { success: false, error: "Supplier not found" }
    }

    // Check if supplier has any items
    const hasItems = await prisma.item.findFirst({
      where: { supplierId },
      select: { id: true }
    })

    if (hasItems) {
      return { success: false, error: "Cannot delete supplier with existing items. Please reassign items to another supplier first." }
    }

    // Check if supplier has any item entries
    const hasItemEntries = await prisma.itemEntry.findFirst({
      where: { supplierId },
      select: { id: true }
    })

    if (hasItemEntries) {
      return { success: false, error: "Cannot delete supplier with item entry history. This supplier has transaction records that must be preserved for audit purposes." }
    }

    await prisma.supplier.delete({
      where: { id: supplierId }
    })

    revalidatePath('/dashboard/suppliers')
    
    return { success: true }

  } catch (error) {
    console.error('Error deleting supplier:', error)
    
    // Handle foreign key constraint errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return {
          success: false,
          error: 'Cannot delete supplier as it is referenced by other records'
        }
      }
    }
    
    return {
      success: false,
      error: 'Failed to delete supplier'
    }
  }
}

// Get supplier statistics
export async function getSupplierStats(supplierId: string): Promise<{
  success: boolean
  data?: {
    totalItems: number
    totalItemEntries: number
    totalValue: number
    averageEntryValue: number
    lastEntryDate: Date | null
    topItems: Array<{
      itemCode: string
      description: string
      totalQuantity: number
      totalValue: number
      entryCount: number
    }>
  }
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const [
      totalItems,
      itemEntriesStats,
      lastEntry,
      topItems
    ] = await Promise.all([
      prisma.item.count({
        where: { supplierId }
      }),
      prisma.itemEntry.aggregate({
        where: { supplierId },
        _count: true,
        _sum: { totalValue: true }
      }),
      prisma.itemEntry.findFirst({
        where: { supplierId },
        orderBy: { entryDate: 'desc' },
        select: { entryDate: true }
      }),
      prisma.itemEntry.groupBy({
        by: ['itemId'],
        where: { supplierId },
        _count: true,
        _sum: {
          quantity: true,
          totalValue: true
        },
        orderBy: {
          _sum: {
            totalValue: 'desc'
          }
        },
        take: 5
      })
    ])

    // Get item details for top items
    const topItemsWithDetails = await Promise.all(
      topItems.map(async (item) => {
        const itemDetails = await prisma.item.findUnique({
          where: { id: item.itemId },
          select: {
            itemCode: true,
            description: true
          }
        })
        
        return {
          itemCode: itemDetails?.itemCode || 'Unknown',
          description: itemDetails?.description || 'Unknown Item',
          totalQuantity: item._sum.quantity ? Number(item._sum.quantity) : 0,
          totalValue: item._sum.totalValue ? Number(item._sum.totalValue) : 0,
          entryCount: item._count
        }
      })
    )

    const totalValue = Number(itemEntriesStats._sum.totalValue || 0)
    const totalEntries = itemEntriesStats._count
    const averageEntryValue = totalEntries > 0 ? totalValue / totalEntries : 0

    return {
      success: true,
      data: {
        totalItems,
        totalItemEntries: totalEntries,
        totalValue,
        averageEntryValue,
        lastEntryDate: lastEntry?.entryDate || null,
        topItems: topItemsWithDetails
      }
    }

  } catch (error) {
    console.error('Error fetching supplier stats:', error)
    return {
      success: false,
      error: 'Failed to fetch supplier statistics'
    }
  }
}