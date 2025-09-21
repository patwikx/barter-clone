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
    purchases: number
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
      purchases: true
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

    // Check if supplier name already exists
    const existingSupplier = await prisma.supplier.findFirst({
      where: { 
        name: {
          equals: data.name,
          mode: 'insensitive'
        }
      }
    })

    if (existingSupplier) {
      return { success: false, error: "Supplier name already exists" }
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        contactInfo: data.contactInfo,
        purchaseReference: data.purchaseReference
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

    // Check if supplier name already exists (if updating name)
    if (data.name) {
      const existingSupplier = await prisma.supplier.findFirst({
        where: {
          name: {
            equals: data.name,
            mode: 'insensitive'
          },
          NOT: { id: supplierId }
        }
      })

      if (existingSupplier) {
        return { success: false, error: "Supplier name already exists" }
      }
    }

    // Build update data with proper typing
    const updateData: {
      name?: string
      contactInfo?: string
      purchaseReference?: string
      updatedAt: Date
    } = {
      updatedAt: new Date()
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.contactInfo !== undefined) updateData.contactInfo = data.contactInfo
    if (data.purchaseReference !== undefined) updateData.purchaseReference = data.purchaseReference

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

    // Check if supplier has any items or purchases
    const hasItems = await prisma.item.findFirst({
      where: { supplierId },
      select: { id: true }
    })

    if (hasItems) {
      return { success: false, error: "Cannot delete supplier with existing items" }
    }

    const hasPurchases = await prisma.purchase.findFirst({
      where: { supplierId },
      select: { id: true }
    })

    if (hasPurchases) {
      return { success: false, error: "Cannot delete supplier with purchase history" }
    }

    await prisma.supplier.delete({
      where: { id: supplierId }
    })

    revalidatePath('/dashboard/suppliers')
    
    return { success: true }

  } catch (error) {
    console.error('Error deleting supplier:', error)
    return {
      success: false,
      error: 'Failed to delete supplier'
    }
  }
}