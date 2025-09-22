"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { TransferStatus, WithdrawalStatus } from "@prisma/client"

export interface DashboardStats {
  inventory: {
    totalItems: number
    totalValue: number
    lowStockItems: number
    outOfStockItems: number
    warehouseCount: number
  }
  itemEntries: {
    totalEntries: number
    totalValue: number
    thisMonthEntries: number
    thisMonthValue: number
  }
  transfers: {
    totalTransfers: number
    inTransitTransfers: number
    completedTransfers: number
    thisMonthTransfers: number
  }
  withdrawals: {
    totalWithdrawals: number
    completedWithdrawals: number
    cancelledWithdrawals: number
    thisMonthWithdrawals: number
  }
  recentActivity: Array<{
    id: string
    type: 'ITEM_ENTRY' | 'TRANSFER' | 'WITHDRAWAL' | 'ADJUSTMENT'
    title: string
    description: string
    timestamp: Date
    status: string
  }>
}

export async function getDashboardStats(): Promise<{
  success: boolean
  data?: DashboardStats
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

    // Get inventory stats
    const [
      totalInventoryItems,
      inventoryValue,
      outOfStockItems,
      warehouseCount
    ] = await Promise.all([
      prisma.currentInventory.count(),
      prisma.currentInventory.aggregate({
        _sum: { totalValue: true }
      }),
      prisma.currentInventory.count({
        where: { quantity: 0 }
      }),
      prisma.warehouse.count()
    ])

    // Get low stock items - need to fetch and compare in application code
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
      inventory => inventory.item.reorderLevel && inventory.quantity.lte(inventory.item.reorderLevel)
    ).length

    // Get item entry stats (replacing purchase stats)
    const [
      totalEntries,
      entriesValue,
      thisMonthEntries,
      thisMonthEntriesValue
    ] = await Promise.all([
      prisma.itemEntry.count(),
      prisma.itemEntry.aggregate({
        _sum: { totalValue: true }
      }),
      prisma.itemEntry.count({
        where: {
          createdAt: { gte: firstDayOfMonth }
        }
      }),
      prisma.itemEntry.aggregate({
        where: {
          createdAt: { gte: firstDayOfMonth }
        },
        _sum: { totalValue: true }
      })
    ])

    // Get transfer stats (updated for your schema)
    const [
      totalTransfers,
      inTransitTransfers,
      completedTransfers,
      thisMonthTransfers
    ] = await Promise.all([
      prisma.transfer.count(),
      prisma.transfer.count({
        where: { status: TransferStatus.IN_TRANSIT }
      }),
      prisma.transfer.count({
        where: { status: TransferStatus.COMPLETED }
      }),
      prisma.transfer.count({
        where: {
          createdAt: { gte: firstDayOfMonth }
        }
      })
    ])

    // Get withdrawal stats (updated for your schema)
    const [
      totalWithdrawals,
      completedWithdrawals,
      cancelledWithdrawals,
      thisMonthWithdrawals
    ] = await Promise.all([
      prisma.withdrawal.count(),
      prisma.withdrawal.count({
        where: { status: WithdrawalStatus.COMPLETED }
      }),
      prisma.withdrawal.count({
        where: { status: WithdrawalStatus.CANCELLED }
      }),
      prisma.withdrawal.count({
        where: {
          createdAt: { gte: firstDayOfMonth }
        }
      })
    ])

    // Get recent activity (updated for your schema)
    const [recentItemEntries, recentTransfers, recentWithdrawals, recentAdjustments] = await Promise.all([
      prisma.itemEntry.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          purchaseReference: true,
          totalValue: true,
          createdAt: true,
          supplier: { select: { name: true } },
          item: { select: { description: true } }
        }
      }),
      prisma.transfer.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          transferNumber: true,
          status: true,
          createdAt: true,
          fromWarehouse: { select: { name: true } },
          toWarehouse: { select: { name: true } }
        }
      }),
      prisma.withdrawal.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          withdrawalNumber: true,
          status: true,
          createdAt: true,
          purpose: true
        }
      }),
      prisma.inventoryAdjustment.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          adjustmentNumber: true,
          adjustmentType: true,
          reason: true,
          createdAt: true,
          warehouse: { select: { name: true } }
        }
      })
    ])

    // Combine and format recent activity
    const recentActivity = [
      ...recentItemEntries.map(entry => ({
        id: entry.id,
        type: 'ITEM_ENTRY' as const,
        title: entry.purchaseReference || `Entry-${entry.id.slice(-6)}`,
        description: `${entry.item.description} from ${entry.supplier.name}`,
        timestamp: entry.createdAt,
        status: 'COMPLETED'
      })),
      ...recentTransfers.map(transfer => ({
        id: transfer.id,
        type: 'TRANSFER' as const,
        title: transfer.transferNumber,
        description: `${transfer.fromWarehouse.name} → ${transfer.toWarehouse.name}`,
        timestamp: transfer.createdAt,
        status: transfer.status
      })),
      ...recentWithdrawals.map(withdrawal => ({
        id: withdrawal.id,
        type: 'WITHDRAWAL' as const,
        title: withdrawal.withdrawalNumber,
        description: withdrawal.purpose || 'Material withdrawal',
        timestamp: withdrawal.createdAt,
        status: withdrawal.status
      })),
      ...recentAdjustments.map(adjustment => ({
        id: adjustment.id,
        type: 'ADJUSTMENT' as const,
        title: adjustment.adjustmentNumber,
        description: `${adjustment.adjustmentType} - ${adjustment.reason}`,
        timestamp: adjustment.createdAt,
        status: 'COMPLETED'
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10)

    const stats: DashboardStats = {
      inventory: {
        totalItems: totalInventoryItems,
        totalValue: Number(inventoryValue._sum.totalValue || 0),
        lowStockItems,
        outOfStockItems,
        warehouseCount
      },
      itemEntries: {
        totalEntries,
        totalValue: Number(entriesValue._sum.totalValue || 0),
        thisMonthEntries,
        thisMonthValue: Number(thisMonthEntriesValue._sum.totalValue || 0)
      },
      transfers: {
        totalTransfers,
        inTransitTransfers,
        completedTransfers,
        thisMonthTransfers
      },
      withdrawals: {
        totalWithdrawals,
        completedWithdrawals,
        cancelledWithdrawals,
        thisMonthWithdrawals
      },
      recentActivity
    }

    return {
      success: true,
      data: stats
    }

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      success: false,
      error: 'Failed to fetch dashboard statistics'
    }
  }
}