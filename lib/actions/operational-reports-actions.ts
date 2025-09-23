"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export interface OperationalReportData {
  title: string
  subtitle: string
  generatedAt: Date
  filters: OperationalReportFilters // Changed from Record<string, string>
  summary: {
    totalRecords: number
    totalValue: number
    averageValue: number
    additionalMetrics?: Record<string, number>
  }
  records: Array<Record<string, unknown>>
}

export interface OperationalReportFilters {
  reportType: string
  warehouseId: string
  supplierId: string
  dateFrom: string
  dateTo: string
}

export async function generateOperationalReport(
  filters: OperationalReportFilters
): Promise<{
  success: boolean
  data?: OperationalReportData
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    let reportData: OperationalReportData

    switch (filters.reportType) {
      case 'WAREHOUSE_EFFICIENCY':
        reportData = await generateWarehouseEfficiencyReport(filters)
        break
      case 'SUPPLIER_PERFORMANCE':
        reportData = await generateSupplierPerformanceReport(filters)
        break
      case 'INVENTORY_TURNOVER':
        reportData = await generateInventoryTurnoverReport(filters)
        break
      case 'OPERATIONAL_SUMMARY':
        reportData = await generateOperationalSummaryReport(filters)
        break
      default:
        return { success: false, error: "Invalid report type" }
    }

    return { success: true, data: reportData }

  } catch (error) {
    console.error('Error generating operational report:', error)
    return { success: false, error: 'Failed to generate operational report' }
  }
}

async function generateWarehouseEfficiencyReport(filters: OperationalReportFilters): Promise<OperationalReportData> {
  const whereClause: {
    id?: string
  } = {}

  if (filters.warehouseId !== 'all') {
    whereClause.id = filters.warehouseId
  }

  const warehouses = await prisma.warehouse.findMany({
    where: whereClause,
    include: {
      _count: {
        select: {
          currentInventory: true,
          inventoryMovements: true,
          itemEntries: true,
          transfersFrom: true,
          transfersTo: true,
          withdrawals: true,
        }
      },
      currentInventory: {
        select: {
          totalValue: true,
          quantity: true,
        }
      }
    }
  })

  const records = warehouses.map(warehouse => {
    const totalValue = warehouse.currentInventory.reduce((sum, inv) => sum + Number(inv.totalValue), 0)
    const totalQuantity = warehouse.currentInventory.reduce((sum, inv) => sum + Number(inv.quantity), 0)
    const totalMovements = warehouse._count.inventoryMovements
    const totalTransfers = warehouse._count.transfersFrom + warehouse._count.transfersTo

    return {
      warehouseName: warehouse.name,
      location: warehouse.location || 'N/A',
      totalItems: warehouse._count.currentInventory,
      totalValue,
      totalQuantity,
      totalMovements,
      totalEntries: warehouse._count.itemEntries,
      totalTransfers,
      totalWithdrawals: warehouse._count.withdrawals,
      efficiencyScore: totalMovements > 0 ? Math.round((totalTransfers / totalMovements) * 100) : 0,
    }
  })

  return {
    title: 'Warehouse Efficiency Report',
    subtitle: 'Performance metrics by warehouse location',
    generatedAt: new Date(),
    filters,
    summary: {
      totalRecords: records.length,
      totalValue: records.reduce((sum, r) => sum + (r.totalValue as number), 0),
      averageValue: records.length > 0 ? records.reduce((sum, r) => sum + (r.totalValue as number), 0) / records.length : 0,
      additionalMetrics: {
        totalMovements: records.reduce((sum, r) => sum + (r.totalMovements as number), 0),
        averageEfficiency: records.length > 0 ? records.reduce((sum, r) => sum + (r.efficiencyScore as number), 0) / records.length : 0,
      }
    },
    records
  }
}

async function generateSupplierPerformanceReport(filters: OperationalReportFilters): Promise<OperationalReportData> {
  const whereClause: {
    id?: string
  } = {}

  if (filters.supplierId !== 'all') {
    whereClause.id = filters.supplierId
  }

  const suppliers = await prisma.supplier.findMany({
    where: whereClause,
    include: {
      _count: {
        select: {
          items: true,
          itemEntries: true,
        }
      },
      itemEntries: {
        select: {
          totalValue: true,
          quantity: true,
          landedCost: true,
          entryDate: true,
        },
        where: filters.dateFrom || filters.dateTo ? {
          entryDate: {
            ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
            ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
          }
        } : undefined,
      }
    }
  })

  const records = suppliers.map(supplier => {
    const totalValue = supplier.itemEntries.reduce((sum, entry) => sum + Number(entry.totalValue), 0)
    const totalQuantity = supplier.itemEntries.reduce((sum, entry) => sum + Number(entry.quantity), 0)
    const averageCost = supplier.itemEntries.length > 0 
      ? supplier.itemEntries.reduce((sum, entry) => sum + Number(entry.landedCost), 0) / supplier.itemEntries.length 
      : 0

    const lastEntryDate = supplier.itemEntries.length > 0 
      ? Math.max(...supplier.itemEntries.map(entry => entry.entryDate.getTime()))
      : 0

    return {
      supplierName: supplier.name,
      contactInfo: supplier.contactInfo || 'N/A',
      totalItems: supplier._count.items,
      totalEntries: supplier.itemEntries.length,
      totalValue,
      totalQuantity,
      averageCost,
      lastEntryDate: lastEntryDate > 0 ? new Date(lastEntryDate).toISOString().split('T')[0] : 'N/A',
      performanceScore: supplier.itemEntries.length > 0 ? Math.min(100, Math.round((supplier.itemEntries.length / 30) * 100)) : 0,
    }
  })

  return {
    title: 'Supplier Performance Report',
    subtitle: 'Supplier delivery and cost performance analysis',
    generatedAt: new Date(),
    filters,
    summary: {
      totalRecords: records.length,
      totalValue: records.reduce((sum, r) => sum + (r.totalValue as number), 0),
      averageValue: records.length > 0 ? records.reduce((sum, r) => sum + (r.totalValue as number), 0) / records.length : 0,
      additionalMetrics: {
        totalEntries: records.reduce((sum, r) => sum + (r.totalEntries as number), 0),
        averagePerformance: records.length > 0 ? records.reduce((sum, r) => sum + (r.performanceScore as number), 0) / records.length : 0,
      }
    },
    records
  }
}

async function generateInventoryTurnoverReport(filters: OperationalReportFilters): Promise<OperationalReportData> {
  const whereClause: {
    warehouseId?: string
  } = {}

  if (filters.warehouseId !== 'all') {
    whereClause.warehouseId = filters.warehouseId
  }

  const inventory = await prisma.currentInventory.findMany({
    where: whereClause,
    include: {
      item: {
        select: {
          itemCode: true,
          description: true,
          standardCost: true,
        }
      },
      warehouse: {
        select: {
          name: true,
        }
      }
    }
  })

  // Get movement data for turnover calculation
  const movementData = await prisma.inventoryMovement.groupBy({
    by: ['itemId', 'warehouseId'],
    where: {
      ...whereClause,
      ...(filters.dateFrom || filters.dateTo ? {
        createdAt: {
          ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
          ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
        }
      } : {}),
      movementType: {
        in: ['WITHDRAWAL', 'TRANSFER_OUT']
      }
    },
    _sum: {
      quantity: true,
      totalValue: true,
    }
  })

  const records = inventory.map(inv => {
    const movements = movementData.find(m => m.itemId === inv.itemId && m.warehouseId === inv.warehouseId)
    const outboundQuantity = movements?._sum.quantity ? Math.abs(Number(movements._sum.quantity)) : 0
    const currentQuantity = Number(inv.quantity)
    
    // Simple turnover calculation: outbound / average inventory
    const averageInventory = (currentQuantity + outboundQuantity) / 2
    const turnoverRatio = averageInventory > 0 ? outboundQuantity / averageInventory : 0

    return {
      itemCode: inv.item.itemCode,
      description: inv.item.description,
      warehouse: inv.warehouse.name,
      currentQuantity,
      outboundQuantity,
      averageInventory,
      turnoverRatio: Math.round(turnoverRatio * 100) / 100,
      daysOnHand: turnoverRatio > 0 ? Math.round(365 / turnoverRatio) : 365,
      currentValue: Number(inv.totalValue),
      standardCost: Number(inv.item.standardCost),
    }
  })

  return {
    title: 'Inventory Turnover Report',
    subtitle: 'Inventory velocity and turnover analysis',
    generatedAt: new Date(),
    filters,
    summary: {
      totalRecords: records.length,
      totalValue: records.reduce((sum, r) => sum + (r.currentValue as number), 0),
      averageValue: records.length > 0 ? records.reduce((sum, r) => sum + (r.currentValue as number), 0) / records.length : 0,
      additionalMetrics: {
        averageTurnover: records.length > 0 ? records.reduce((sum, r) => sum + (r.turnoverRatio as number), 0) / records.length : 0,
        averageDaysOnHand: records.length > 0 ? records.reduce((sum, r) => sum + (r.daysOnHand as number), 0) / records.length : 0,
      }
    },
    records
  }
}

async function generateOperationalSummaryReport(filters: OperationalReportFilters): Promise<OperationalReportData> {
  const currentDate = new Date()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

  // Get summary data
  const [
    totalItems,
    totalValue,
    monthlyEntries,
    monthlyTransfers,
    monthlyWithdrawals,
    activeWarehouses,
    activeSuppliers,
  ] = await Promise.all([
    prisma.currentInventory.count(),
    prisma.currentInventory.aggregate({ _sum: { totalValue: true } }),
    prisma.itemEntry.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
    prisma.transfer.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
    prisma.withdrawal.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
    prisma.warehouse.count(),
    prisma.supplier.count(),
  ])

  const records = [{
    metric: 'Total Inventory Items',
    value: totalItems,
    category: 'Inventory',
    period: 'Current',
  }, {
    metric: 'Total Inventory Value',
    value: Number(totalValue._sum.totalValue || 0),
    category: 'Inventory',
    period: 'Current',
  }, {
    metric: 'Monthly Item Entries',
    value: monthlyEntries,
    category: 'Operations',
    period: 'This Month',
  }, {
    metric: 'Monthly Transfers',
    value: monthlyTransfers,
    category: 'Operations',
    period: 'This Month',
  }, {
    metric: 'Monthly Withdrawals',
    value: monthlyWithdrawals,
    category: 'Operations',
    period: 'This Month',
  }, {
    metric: 'Active Warehouses',
    value: activeWarehouses,
    category: 'Infrastructure',
    period: 'Current',
  }, {
    metric: 'Active Suppliers',
    value: activeSuppliers,
    category: 'Infrastructure',
    period: 'Current',
  }]

  return {
    title: 'Operational Summary Report',
    subtitle: 'Overall system performance and key metrics',
    generatedAt: new Date(),
    filters,
    summary: {
      totalRecords: records.length,
      totalValue: Number(totalValue._sum.totalValue || 0),
      averageValue: 0,
      additionalMetrics: {
        monthlyOperations: monthlyEntries + monthlyTransfers + monthlyWithdrawals,
        systemUtilization: Math.round(((monthlyEntries + monthlyTransfers + monthlyWithdrawals) / 100) * 100),
      }
    },
    records
  }
}