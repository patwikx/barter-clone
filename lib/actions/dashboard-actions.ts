"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { PurchaseStatus, TransferStatus, WithdrawalStatus } from "@prisma/client"

export interface DashboardStats {
  inventory: {
    totalItems: number
    totalValue: number
    lowStockItems: number
    outOfStockItems: number
    warehouseCount: number
  }
  purchases: {
    totalPurchases: number
    pendingPurchases: number
    totalValue: number
    thisMonthPurchases: number
  }
  transfers: {
    totalTransfers: number
    pendingTransfers: number
    inTransitTransfers: number
    thisMonthTransfers: number
  }
  withdrawals: {
    totalWithdrawals: number
    pendingWithdrawals: number
    approvedWithdrawals: number
    thisMonthWithdrawals: number
  }
  recentActivity: Array<{
    id: string
    type: 'PURCHASE' | 'TRANSFER' | 'WITHDRAWAL' | 'ADJUSTMENT'
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

    // Get purchase stats
    const [
      totalPurchases,
      pendingPurchases,
      purchaseValue,
      thisMonthPurchases
    ] = await Promise.all([
      prisma.purchase.count(),
      prisma.purchase.count({
        where: { status: PurchaseStatus.PENDING }
      }),
      prisma.purchase.aggregate({
        _sum: { totalCost: true }
      }),
      prisma.purchase.count({
        where: {
          createdAt: { gte: firstDayOfMonth }
        }
      })
    ])

    // Get transfer stats
    const [
      totalTransfers,
      pendingTransfers,
      inTransitTransfers,
      thisMonthTransfers
    ] = await Promise.all([
      prisma.transfer.count(),
      prisma.transfer.count({
        where: { status: TransferStatus.PENDING }
      }),
      prisma.transfer.count({
        where: { status: TransferStatus.IN_TRANSIT }
      }),
      prisma.transfer.count({
        where: {
          createdAt: { gte: firstDayOfMonth }
        }
      })
    ])

    // Get withdrawal stats
    const [
      totalWithdrawals,
      pendingWithdrawals,
      approvedWithdrawals,
      thisMonthWithdrawals
    ] = await Promise.all([
      prisma.withdrawal.count(),
      prisma.withdrawal.count({
        where: { status: WithdrawalStatus.PENDING }
      }),
      prisma.withdrawal.count({
        where: { status: WithdrawalStatus.APPROVED }
      }),
      prisma.withdrawal.count({
        where: {
          createdAt: { gte: firstDayOfMonth }
        }
      })
    ])

    // Get recent activity
    const [recentPurchases, recentTransfers, recentWithdrawals] = await Promise.all([
      prisma.purchase.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          purchaseOrder: true,
          status: true,
          createdAt: true,
          supplier: { select: { name: true } }
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
      })
    ])

    // Combine and format recent activity
    const recentActivity = [
      ...recentPurchases.map(p => ({
        id: p.id,
        type: 'PURCHASE' as const,
        title: p.purchaseOrder,
        description: `Purchase from ${p.supplier.name}`,
        timestamp: p.createdAt,
        status: p.status
      })),
      ...recentTransfers.map(t => ({
        id: t.id,
        type: 'TRANSFER' as const,
        title: t.transferNumber,
        description: `${t.fromWarehouse.name} → ${t.toWarehouse.name}`,
        timestamp: t.createdAt,
        status: t.status
      })),
      ...recentWithdrawals.map(w => ({
        id: w.id,
        type: 'WITHDRAWAL' as const,
        title: w.withdrawalNumber,
        description: w.purpose || 'Material withdrawal',
        timestamp: w.createdAt,
        status: w.status
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
      purchases: {
        totalPurchases,
        pendingPurchases,
        totalValue: Number(purchaseValue._sum.totalCost || 0),
        thisMonthPurchases
      },
      transfers: {
        totalTransfers,
        pendingTransfers,
        inTransitTransfers,
        thisMonthTransfers
      },
      withdrawals: {
        totalWithdrawals,
        pendingWithdrawals,
        approvedWithdrawals,
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