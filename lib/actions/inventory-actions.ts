"use server"

import { prisma } from "@/lib/prisma"


export interface CurrentInventoryItem {
  id: string
  quantity: number
  totalValue: number
  avgUnitCost: number
  lastUpdated: Date
  item: {
    id: string
    itemCode: string
    description: string
    unitOfMeasure: string
    standardCost: number
    reorderLevel: number | null
    supplier: {
      id: string
      name: string
    }
  }
  warehouse: {
    id: string
    name: string
    location: string | null
  }
}

export interface InventoryFilters {
  search: string
  warehouseId: string
  supplierId: string
  lowStock: boolean
}

export interface InventoryStats {
  totalItems: number
  totalValue: number
  lowStockItems: number
  outOfStockItems: number
  averageValue: number
  warehouseCount: number
}

export async function getCurrentInventory(
  filters: Partial<InventoryFilters> = {}
): Promise<{
  success: boolean
  data?: CurrentInventoryItem[]
  stats?: InventoryStats
  error?: string
}> {
  try {
    const { search = "", warehouseId = "all", lowStock = false, supplierId = "all" } = filters

    // Build where clause with proper typing
    interface WhereClause {
      quantity: { gt: number }
      warehouseId?: string
      OR?: Array<{
        item: {
          itemCode?: { contains: string; mode: 'insensitive' }
          description?: { contains: string; mode: 'insensitive' }
          supplier?: { name: { contains: string; mode: 'insensitive' } }
          supplierId?: string
        }
      }>
      item?: {
        supplierId?: string
      }
    }

    const where: WhereClause = {
      quantity: {
        gt: 0 // Only show items with positive quantity
      }
    }

    // Search filter
    if (search && search.trim() !== "") {
      where.OR = [
        {
          item: {
            itemCode: {
              contains: search,
              mode: 'insensitive' as const
            }
          }
        },
        {
          item: {
            description: {
              contains: search,
              mode: 'insensitive' as const
            }
          }
        },
        {
          item: {
            supplier: {
              name: {
                contains: search,
                mode: 'insensitive' as const
              }
            }
          }
        }
      ]
    }

    // Warehouse filter
    if (warehouseId && warehouseId !== 'all') {
      where.warehouseId = warehouseId
    }

    // Supplier filter
    if (supplierId && supplierId !== 'all') {
      // If we already have search filters, add supplier to each OR condition
      if (where.OR) {
        where.OR = where.OR.map(condition => ({
          item: {
            ...condition.item,
            supplierId: supplierId
          }
        }))
      } else {
        where.item = {
          supplierId: supplierId
        }
      }
    }

    // Get current inventory with relationships
    const inventoryQuery = prisma.currentInventory.findMany({
      where,
      include: {
        item: {
          include: {
            supplier: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      },
      orderBy: [
        { item: { itemCode: 'asc' } },
        { warehouse: { name: 'asc' } }
      ]
    })

    const inventory = await inventoryQuery

    // Apply low stock filter after database query
    let filteredInventory = inventory
    if (lowStock) {
      filteredInventory = inventory.filter(item => 
        item.item.reorderLevel && 
        Number(item.quantity) <= Number(item.item.reorderLevel)
      )
    }

    // Transform to match interface
    const transformedInventory: CurrentInventoryItem[] = filteredInventory.map(item => ({
      id: item.id,
      quantity: Number(item.quantity),
      totalValue: Number(item.totalValue),
      avgUnitCost: Number(item.avgUnitCost),
      lastUpdated: item.lastUpdated,
      item: {
        id: item.item.id,
        itemCode: item.item.itemCode,
        description: item.item.description,
        unitOfMeasure: item.item.unitOfMeasure,
        standardCost: Number(item.item.standardCost),
        reorderLevel: item.item.reorderLevel ? Number(item.item.reorderLevel) : null,
        supplier: {
          id: item.item.supplier.id,
          name: item.item.supplier.name
        }
      },
      warehouse: {
        id: item.warehouse.id,
        name: item.warehouse.name,
        location: item.warehouse.location
      }
    }))

    // Calculate stats
    const stats: InventoryStats = {
      totalItems: inventory.length,
      totalValue: inventory.reduce((sum, item) => sum + Number(item.totalValue), 0),
      lowStockItems: inventory.filter(item => 
        item.item.reorderLevel && 
        Number(item.quantity) <= Number(item.item.reorderLevel)
      ).length,
      outOfStockItems: inventory.filter(item => Number(item.quantity) === 0).length,
      averageValue: inventory.length > 0 
        ? inventory.reduce((sum, item) => sum + Number(item.totalValue), 0) / inventory.length 
        : 0,
      warehouseCount: new Set(inventory.map(item => item.warehouseId)).size
    }

    return {
      success: true,
      data: transformedInventory,
      stats
    }

  } catch (error) {
    console.error('Error fetching current inventory:', error)
    return {
      success: false,
      error: 'Failed to fetch current inventory'
    }
  }
}

export async function getWarehouses(): Promise<{
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

export async function getSuppliers(): Promise<{
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