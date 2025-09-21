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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // Get inventory summary
    const [
      totalInventoryItems,
      inventoryValue,
      outOfStockItems
    ] = await Promise.all([
      prisma.currentInventory.count(),
      prisma.currentInventory.aggregate({
        _sum: { totalValue: true }
      }),
      prisma.currentInventory.count({
        where: { quantity: 0 }
      })
    ])

    // Get low stock items
    const inventoryWithReorderLevels = await prisma.currentInventory.findMany({
      where: {
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

    // Get purchase summary
    const [
      totalPurchases,
      purchaseValue,
      monthlyPurchases,
      monthlyPurchaseValue
    ] = await Promise.all([
      prisma.purchase.count(),
      prisma.purchase.aggregate({
        _sum: { totalCost: true }
      }),
      prisma.purchase.count({
        where: {
          createdAt: { gte: firstDayOfMonth }
        }
      }),
      prisma.purchase.aggregate({
        where: {
          createdAt: { gte: firstDayOfMonth }
        },
        _sum: { totalCost: true }
      })
    ])

    // Get transfer summary
    const [
      totalTransfers,
      activeTransfers,
      monthlyTransfers
    ] = await Promise.all([
      prisma.transfer.count(),
      prisma.transfer.count({
        where: {
          status: {
            in: ['PENDING', 'IN_TRANSIT']
          }
        }
      }),
      prisma.transfer.count({
        where: {
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
      prisma.withdrawal.count(),
      prisma.withdrawalItem.aggregate({
        _sum: { totalValue: true }
      }),
      prisma.withdrawal.count({
        where: {
          createdAt: { gte: firstDayOfMonth }
        }
      }),
      prisma.withdrawalItem.aggregate({
        where: {
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
        monthlyCount: monthlyPurchases,
        monthlyValue: Number(monthlyPurchaseValue._sum.totalCost || 0),
        totalCount: totalPurchases,
        totalValue: Number(purchaseValue._sum.totalCost || 0)
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