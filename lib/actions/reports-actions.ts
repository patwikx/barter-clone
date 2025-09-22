"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export interface ReportsData {
  inventorySummary: {
    totalItems: number
    totalValue: number
    lowStockItems: number
    outOfStockItems: number
  }
  purchaseSummary: {
    monthlyCount: number
    monthlyValue: number
    totalCount: number
    totalValue: number
  }
  transferSummary: {
    activeTransfers: number
    monthlyCount: number
    totalCount: number
  }
  withdrawalSummary: {
    monthlyCount: number
    monthlyValue: number
    totalCount: number
    totalValue: number
  }
}

export interface ReportsFilters {
  dateFrom?: string
  dateTo?: string
  warehouseId?: string
  reportType?: string
}

export async function getReportsData(
  filters: ReportsFilters = {}
): Promise<{
  success: boolean
  data?: ReportsData
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

    // Apply warehouse filter if provided
    const warehouseFilter = filters.warehouseId ? { warehouseId: filters.warehouseId } : {}

    // Get inventory summary
    const [
      totalInventoryItems,
      inventoryValue,
      outOfStockItems
    ] = await Promise.all([
      prisma.currentInventory.count({
        where: warehouseFilter
      }),
      prisma.currentInventory.aggregate({
        where: warehouseFilter,
        _sum: { totalValue: true }
      }),
      prisma.currentInventory.count({
        where: { 
          ...warehouseFilter,
          quantity: 0 
        }
      })
    ])

    // Get low stock items
    const inventoryWithReorderLevels = await prisma.currentInventory.findMany({
      where: {
        ...warehouseFilter,
        item: {
          reorderLevel: { not: null }
        }
      },
      select: {
        quantity: true,
        item: {
          select: {
            reorderLevel: true
          }
        }
      }
    })

    const lowStockItems = inventoryWithReorderLevels.filter(
      inventory => inventory.item.reorderLevel && 
      inventory.quantity.lte(inventory.item.reorderLevel)
    ).length

    // Get item entry summary (replaces purchase summary)
    const [
      totalEntries,
      entriesValue,
      monthlyEntries,
      monthlyEntriesValue
    ] = await Promise.all([
      prisma.itemEntry.count({
        where: warehouseFilter
      }),
      prisma.itemEntry.aggregate({
        where: warehouseFilter,
        _sum: { totalValue: true }
      }),
      prisma.itemEntry.count({
        where: {
          ...warehouseFilter,
          createdAt: { gte: firstDayOfMonth }
        }
      }),
      prisma.itemEntry.aggregate({
        where: {
          ...warehouseFilter,
          createdAt: { gte: firstDayOfMonth }
        },
        _sum: { totalValue: true }
      })
    ])

    // Get transfer summary (note: no PENDING status anymore)
    const transferWhereClause = filters.warehouseId 
      ? {
          OR: [
            { fromWarehouseId: filters.warehouseId },
            { toWarehouseId: filters.warehouseId }
          ]
        }
      : {}

    const [
      totalTransfers,
      activeTransfers,
      monthlyTransfers
    ] = await Promise.all([
      prisma.transfer.count({
        where: transferWhereClause
      }),
      prisma.transfer.count({
        where: {
          ...transferWhereClause,
          status: 'IN_TRANSIT'
        }
      }),
      prisma.transfer.count({
        where: {
          ...transferWhereClause,
          createdAt: { gte: firstDayOfMonth }
        }
      })
    ])

    // Get withdrawal summary
    const [
      totalWithdrawals,
      withdrawalValue,
      monthlyWithdrawals,
      monthlyWithdrawalValue
    ] = await Promise.all([
      prisma.withdrawal.count({
        where: warehouseFilter
      }),
      prisma.withdrawalItem.aggregate({
        where: filters.warehouseId 
          ? {
              withdrawal: {
                warehouseId: filters.warehouseId
              }
            }
          : undefined,
        _sum: { totalValue: true }
      }),
      prisma.withdrawal.count({
        where: {
          ...warehouseFilter,
          createdAt: { gte: firstDayOfMonth }
        }
      }),
      prisma.withdrawalItem.aggregate({
        where: filters.warehouseId
          ? {
              withdrawal: {
                warehouseId: filters.warehouseId,
                createdAt: { gte: firstDayOfMonth }
              }
            }
          : {
              withdrawal: {
                createdAt: { gte: firstDayOfMonth }
              }
            },
        _sum: { totalValue: true }
      })
    ])

    const data: ReportsData = {
      inventorySummary: {
        totalItems: totalInventoryItems,
        totalValue: Number(inventoryValue._sum.totalValue || 0),
        lowStockItems,
        outOfStockItems
      },
      purchaseSummary: {
        monthlyCount: monthlyEntries,
        monthlyValue: Number(monthlyEntriesValue._sum.totalValue || 0),
        totalCount: totalEntries,
        totalValue: Number(entriesValue._sum.totalValue || 0)
      },
      transferSummary: {
        activeTransfers,
        monthlyCount: monthlyTransfers,
        totalCount: totalTransfers
      },
      withdrawalSummary: {
        monthlyCount: monthlyWithdrawals,
        monthlyValue: Number(monthlyWithdrawalValue._sum.totalValue || 0),
        totalCount: totalWithdrawals,
        totalValue: Number(withdrawalValue._sum.totalValue || 0)
      }
    }

    return {
      success: true,
      data
    }

  } catch (error) {
    console.error('Error fetching reports data:', error)
    return {
      success: false,
      error: 'Failed to fetch reports data'
    }
  }
}