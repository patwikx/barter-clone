"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export interface SearchResult {
  id: string
  type: 'ITEM' | 'PURCHASE' | 'TRANSFER' | 'WITHDRAWAL' | 'WAREHOUSE' | 'SUPPLIER' | 'USER'
  title: string
  description: string
  metadata?: {
    date?: string
    status?: string
    value?: string
    location?: string
  }
}

export interface SearchFilters {
  query: string
  type?: string
  limit?: number
}

export async function performGlobalSearch(
  filters: SearchFilters
): Promise<{
  success: boolean
  data?: SearchResult[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const { query, type, limit = 50 } = filters
    const searchTerm = query.trim().toLowerCase()

    if (!searchTerm) {
      return { success: false, error: "Search query is required" }
    }

    const results: SearchResult[] = []

    // Search Items
    if (!type || type === 'ITEM') {
      const items = await prisma.item.findMany({
        where: {
          OR: [
            { itemCode: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          supplier: { select: { name: true } }
        },
        take: Math.floor(limit / 7)
      })

      results.push(...items.map(item => ({
        id: item.id,
        type: 'ITEM' as const,
        title: item.itemCode,
        description: item.description,
        metadata: {
          value: `₱${Number(item.standardCost).toFixed(2)}`,
          location: item.supplier.name
        }
      })))
    }

    // Search Purchases
    if (!type || type === 'PURCHASE') {
      const purchases = await prisma.purchase.findMany({
        where: {
          OR: [
            { purchaseOrder: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          supplier: { select: { name: true } }
        },
        take: Math.floor(limit / 7)
      })

      results.push(...purchases.map(purchase => ({
        id: purchase.id,
        type: 'PURCHASE' as const,
        title: purchase.purchaseOrder,
        description: `Purchase from ${purchase.supplier.name}`,
        metadata: {
          date: purchase.purchaseDate.toLocaleDateString(),
          status: purchase.status,
          value: `₱${Number(purchase.totalCost).toFixed(2)}`
        }
      })))
    }

    // Search Transfers
    if (!type || type === 'TRANSFER') {
      const transfers = await prisma.transfer.findMany({
        where: {
          OR: [
            { transferNumber: { contains: searchTerm, mode: 'insensitive' } },
            { notes: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          fromWarehouse: { select: { name: true } },
          toWarehouse: { select: { name: true } }
        },
        take: Math.floor(limit / 7)
      })

      results.push(...transfers.map(transfer => ({
        id: transfer.id,
        type: 'TRANSFER' as const,
        title: transfer.transferNumber,
        description: `${transfer.fromWarehouse.name} → ${transfer.toWarehouse.name}`,
        metadata: {
          date: transfer.transferDate.toLocaleDateString(),
          status: transfer.status
        }
      })))
    }

    // Search Withdrawals
    if (!type || type === 'WITHDRAWAL') {
      const withdrawals = await prisma.withdrawal.findMany({
        where: {
          OR: [
            { withdrawalNumber: { contains: searchTerm, mode: 'insensitive' } },
            { purpose: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          warehouse: { select: { name: true } }
        },
        take: Math.floor(limit / 7)
      })

      results.push(...withdrawals.map(withdrawal => ({
        id: withdrawal.id,
        type: 'WITHDRAWAL' as const,
        title: withdrawal.withdrawalNumber,
        description: withdrawal.purpose || 'Material withdrawal',
        metadata: {
          date: withdrawal.withdrawalDate.toLocaleDateString(),
          status: withdrawal.status,
          location: withdrawal.warehouse.name
        }
      })))
    }

    // Search Warehouses
    if (!type || type === 'WAREHOUSE') {
      const warehouses = await prisma.warehouse.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { location: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: Math.floor(limit / 7)
      })

      results.push(...warehouses.map(warehouse => ({
        id: warehouse.id,
        type: 'WAREHOUSE' as const,
        title: warehouse.name,
        description: warehouse.description || 'Warehouse facility',
        metadata: {
          location: warehouse.location || undefined
        }
      })))
    }

    // Search Suppliers
    if (!type || type === 'SUPPLIER') {
      const suppliers = await prisma.supplier.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { contactInfo: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: Math.floor(limit / 7)
      })

      results.push(...suppliers.map(supplier => ({
        id: supplier.id,
        type: 'SUPPLIER' as const,
        title: supplier.name,
        description: supplier.contactInfo || 'Supplier',
        metadata: {}
      })))
    }

    // Search Users (if user has permission)
    if (!type || type === 'USER') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: searchTerm, mode: 'insensitive' } },
            { firstName: { contains: searchTerm, mode: 'insensitive' } },
            { lastName: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { employeeId: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          email: true,
          employeeId: true,
          department: true,
          position: true,
          role: true,
          isActive: true
        },
        take: Math.floor(limit / 7)
      })

      results.push(...users.map(user => {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username
        return {
          id: user.id,
          type: 'USER' as const,
          title: fullName,
          description: `@${user.username} - ${user.position || user.role}`,
          metadata: {
            location: user.department || undefined,
            status: user.isActive ? 'Active' : 'Inactive'
          }
        }
      }))
    }

    return {
      success: true,
      data: results.slice(0, limit)
    }

  } catch (error) {
    console.error('Error performing global search:', error)
    return {
      success: false,
      error: 'Search failed'
    }
  }
}