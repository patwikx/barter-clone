"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export interface SearchResult {
  id: string
  type: 'ITEM' | 'ITEM_ENTRY' | 'TRANSFER' | 'WITHDRAWAL' | 'WAREHOUSE' | 'SUPPLIER' | 'USER'
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

    // Search Item Entries (replaces Purchase search)
    if (!type || type === 'ITEM_ENTRY') {
      const itemEntries = await prisma.itemEntry.findMany({
        where: {
          OR: [
            { purchaseReference: { contains: searchTerm, mode: 'insensitive' } },
            { notes: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          supplier: { select: { name: true } },
          item: { select: { itemCode: true, description: true } },
          warehouse: { select: { name: true } }
        },
        take: Math.floor(limit / 7)
      })

      results.push(...itemEntries.map(entry => ({
        id: entry.id,
        type: 'ITEM_ENTRY' as const,
        title: entry.purchaseReference || `Entry for ${entry.item.itemCode}`,
        description: `${entry.item.description} from ${entry.supplier.name}`,
        metadata: {
          date: entry.entryDate.toLocaleDateString(),
          value: `₱${Number(entry.totalValue).toFixed(2)}`,
          location: entry.warehouse.name
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
          warehouse: { select: { name: true } },
          withdrawalItems: {
            include: {
              item: { select: { itemCode: true } }
            }
          }
        },
        take: Math.floor(limit / 7)
      })

      results.push(...withdrawals.map(withdrawal => {
        const totalValue = withdrawal.withdrawalItems.reduce((sum, item) => 
          sum + Number(item.totalValue), 0
        )
        
        return {
          id: withdrawal.id,
          type: 'WITHDRAWAL' as const,
          title: withdrawal.withdrawalNumber,
          description: withdrawal.purpose || 'Material withdrawal',
          metadata: {
            date: withdrawal.withdrawalDate.toLocaleDateString(),
            status: withdrawal.status,
            location: withdrawal.warehouse.name,
            value: `₱${totalValue.toFixed(2)}`
          }
        }
      }))
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
        include: {
          _count: {
            select: {
              currentInventory: true
            }
          }
        },
        take: Math.floor(limit / 7)
      })

      results.push(...warehouses.map(warehouse => ({
        id: warehouse.id,
        type: 'WAREHOUSE' as const,
        title: warehouse.name,
        description: warehouse.description || 'Warehouse facility',
        metadata: {
          location: warehouse.location || undefined,
          value: `${warehouse._count.currentInventory} items`
        }
      })))
    }

    // Search Suppliers
    if (!type || type === 'SUPPLIER') {
      const suppliers = await prisma.supplier.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { contactInfo: { contains: searchTerm, mode: 'insensitive' } },
            { purchaseReference: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          _count: {
            select: {
              items: true,
              itemEntries: true
            }
          }
        },
        take: Math.floor(limit / 7)
      })

      results.push(...suppliers.map(supplier => ({
        id: supplier.id,
        type: 'SUPPLIER' as const,
        title: supplier.name,
        description: supplier.contactInfo || 'Supplier',
        metadata: {
          value: `${supplier._count.items} items, ${supplier._count.itemEntries} entries`
        }
      })))
    }

    // Search Users (if user has permission)
    if (!type || type === 'USER') {
      const users = await prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { username: { contains: searchTerm, mode: 'insensitive' } },
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
                { employeeId: { contains: searchTerm, mode: 'insensitive' } }
              ]
            },
            { isActive: true } // Only search active users
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
          isActive: true,
          lastLoginAt: true
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
            status: user.isActive ? 'Active' : 'Inactive',
            date: user.lastLoginAt?.toLocaleDateString()
          }
        }
      }))
    }

    // Sort results by relevance (exact matches first, then partial matches)
    const sortedResults = results.sort((a, b) => {
      const aExactMatch = a.title.toLowerCase().includes(searchTerm) || 
                         a.description.toLowerCase().includes(searchTerm)
      const bExactMatch = b.title.toLowerCase().includes(searchTerm) || 
                         b.description.toLowerCase().includes(searchTerm)
      
      if (aExactMatch && !bExactMatch) return -1
      if (!aExactMatch && bExactMatch) return 1
      
      // Secondary sort by type priority
      const typePriority = { 'ITEM': 1, 'ITEM_ENTRY': 2, 'TRANSFER': 3, 'WITHDRAWAL': 4, 'WAREHOUSE': 5, 'SUPPLIER': 6, 'USER': 7 }
      return typePriority[a.type] - typePriority[b.type]
    })

    return {
      success: true,
      data: sortedResults.slice(0, limit)
    }

  } catch (error) {
    console.error('Error performing global search:', error)
    return {
      success: false,
      error: 'Search failed'
    }
  }
}