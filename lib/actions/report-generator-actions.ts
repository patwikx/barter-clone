"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { 
  ReportFilters, 
  ReportData, 
  InventoryReportRecord, 
  MovementReportRecord,
  ItemEntryReportRecord,
  TransferReportRecord,
  WithdrawalReportRecord,
  CostAnalysisReportRecord,
  MonthlyAverageReportRecord,
  ReportSummary
} from "@/types/report-types"

export async function generateReport(filters: ReportFilters): Promise<{
  success: boolean
  data?: ReportData
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    let reportData: ReportData

    switch (filters.reportType) {
      case 'INVENTORY_SUMMARY':
        reportData = await generateInventorySummaryReport(filters)
        break
      case 'INVENTORY_VALUATION':
        reportData = await generateInventoryValuationReport(filters)
        break
      case 'STOCK_MOVEMENT':
        reportData = await generateStockMovementReport(filters)
        break
      case 'LOW_STOCK_REPORT':
        reportData = await generateLowStockReport(filters)
        break
      case 'ITEM_ENTRY_REPORT':
        reportData = await generateItemEntryReport(filters)
        break
      case 'TRANSFER_REPORT':
        reportData = await generateTransferReport(filters)
        break
      case 'WITHDRAWAL_REPORT':
        reportData = await generateWithdrawalReport(filters)
        break
      case 'COST_ANALYSIS':
        reportData = await generateCostAnalysisReport(filters)
        break
      case 'MONTHLY_WEIGHTED_AVERAGE':
        reportData = await generateMonthlyWeightedAverageReport(filters)
        break
      case 'SUPPLIER_PERFORMANCE':
        reportData = await generateSupplierPerformanceReport(filters)
        break
      default:
        return { success: false, error: "Invalid report type" }
    }

    return { success: true, data: reportData }

  } catch (error) {
    console.error('Error generating report:', error)
    return { success: false, error: 'Failed to generate report' }
  }
}

async function generateInventorySummaryReport(filters: ReportFilters): Promise<ReportData> {
  const whereClause: {
    warehouseId?: string
    item?: { supplierId?: string }
    quantity?: { gt?: number }
  } = {}

  if (filters.warehouseId !== 'all') {
    whereClause.warehouseId = filters.warehouseId
  }

  if (filters.supplierId !== 'all') {
    whereClause.item = { supplierId: filters.supplierId }
  }

  if (!filters.includeZeroStock) {
    whereClause.quantity = { gt: 0 }
  }

  const inventory = await prisma.currentInventory.findMany({
    where: whereClause,
    include: {
      item: {
        include: {
          supplier: { select: { name: true } }
        }
      },
      warehouse: { select: { name: true, location: true } }
    },
    orderBy: [
      { warehouse: { name: 'asc' } },
      { item: { itemCode: 'asc' } }
    ]
  })

  const records: InventoryReportRecord[] = inventory.map(inv => {
    const quantity = Number(inv.quantity)
    const reorderLevel = inv.item.reorderLevel ? Number(inv.item.reorderLevel) : undefined
    
    let stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK'
    if (quantity === 0) {
      stockStatus = 'OUT_OF_STOCK'
    } else if (reorderLevel && quantity <= reorderLevel) {
      stockStatus = 'LOW_STOCK'
    }

    return {
      itemCode: inv.item.itemCode,
      description: inv.item.description,
      warehouse: inv.warehouse.name,
      supplier: inv.item.supplier.name,
      unitOfMeasure: inv.item.unitOfMeasure,
      quantity,
      unitCost: Number(inv.avgUnitCost),
      totalValue: Number(inv.totalValue),
      reorderLevel,
      standardCost: Number(inv.item.standardCost),
      stockStatus
    }
  })

  const summary: ReportSummary = {
    totalRecords: records.length,
    totalQuantity: records.reduce((sum, r) => sum + r.quantity, 0),
    totalValue: records.reduce((sum, r) => sum + r.totalValue, 0),
    averageValue: records.length > 0 ? records.reduce((sum, r) => sum + r.totalValue, 0) / records.length : 0,
    additionalMetrics: {
      lowStockCount: records.filter(r => r.stockStatus === 'LOW_STOCK').length,
      outOfStockCount: records.filter(r => r.stockStatus === 'OUT_OF_STOCK').length,
      averageCost: records.length > 0 ? records.reduce((sum, r) => sum + r.unitCost, 0) / records.length : 0
    }
  }

  return {
    title: 'Inventory Summary Report',
    subtitle: 'Current stock levels and values by warehouse',
    generatedAt: new Date(),
    filters,
    summary,
    records
  }
}

async function generateInventoryValuationReport(filters: ReportFilters): Promise<ReportData> {
  const whereClause: {
    warehouseId?: string
    item?: { supplierId?: string }
  } = {}

  if (filters.warehouseId !== 'all') {
    whereClause.warehouseId = filters.warehouseId
  }

  if (filters.supplierId !== 'all') {
    whereClause.item = { supplierId: filters.supplierId }
  }

  const inventory = await prisma.currentInventory.findMany({
    where: whereClause,
    include: {
      item: {
        include: {
          supplier: { select: { name: true } }
        }
      },
      warehouse: { select: { name: true } }
    },
    orderBy: [{ totalValue: 'desc' }]
  })

  const records: InventoryReportRecord[] = inventory.map(inv => {
    const quantity = Number(inv.quantity)
    const reorderLevel = inv.item.reorderLevel ? Number(inv.item.reorderLevel) : undefined
    
    let stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK'
    if (quantity === 0) {
      stockStatus = 'OUT_OF_STOCK'
    } else if (reorderLevel && quantity <= reorderLevel) {
      stockStatus = 'LOW_STOCK'
    }

    return {
      itemCode: inv.item.itemCode,
      description: inv.item.description,
      warehouse: inv.warehouse.name,
      supplier: inv.item.supplier.name,
      unitOfMeasure: inv.item.unitOfMeasure,
      quantity,
      unitCost: Number(inv.avgUnitCost),
      totalValue: Number(inv.totalValue),
      reorderLevel,
      standardCost: Number(inv.item.standardCost),
      stockStatus
    }
  })

  const summary: ReportSummary = {
    totalRecords: records.length,
    totalQuantity: records.reduce((sum, r) => sum + r.quantity, 0),
    totalValue: records.reduce((sum, r) => sum + r.totalValue, 0),
    averageValue: records.length > 0 ? records.reduce((sum, r) => sum + r.totalValue, 0) / records.length : 0,
    additionalMetrics: {
      averageCost: records.length > 0 ? records.reduce((sum, r) => sum + r.unitCost, 0) / records.length : 0
    }
  }

  return {
    title: 'Inventory Valuation Report',
    subtitle: 'Detailed inventory valuation by costing method',
    generatedAt: new Date(),
    filters,
    summary,
    records
  }
}

async function generateLowStockReport(filters: ReportFilters): Promise<ReportData> {
  const whereClause: {
    warehouseId?: string
    item?: { supplierId?: string; reorderLevel: { not: null } }
  } = {
    item: { reorderLevel: { not: null } }
  }

  if (filters.warehouseId !== 'all') {
    whereClause.warehouseId = filters.warehouseId
  }

  if (filters.supplierId !== 'all') {
    whereClause.item = {
      reorderLevel: { not: null },
      supplierId: filters.supplierId
    }
  }

  const inventory = await prisma.currentInventory.findMany({
    where: whereClause,
    include: {
      item: {
        include: {
          supplier: { select: { name: true } }
        }
      },
      warehouse: { select: { name: true } }
    }
  })

  const lowStockItems = inventory.filter(inv => 
    inv.item.reorderLevel && Number(inv.quantity) <= Number(inv.item.reorderLevel)
  )

  const records: InventoryReportRecord[] = lowStockItems.map(inv => ({
    itemCode: inv.item.itemCode,
    description: inv.item.description,
    warehouse: inv.warehouse.name,
    supplier: inv.item.supplier.name,
    unitOfMeasure: inv.item.unitOfMeasure,
    quantity: Number(inv.quantity),
    unitCost: Number(inv.avgUnitCost),
    totalValue: Number(inv.totalValue),
    reorderLevel: Number(inv.item.reorderLevel),
    standardCost: Number(inv.item.standardCost),
    stockStatus: Number(inv.quantity) === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
  }))

  const summary: ReportSummary = {
    totalRecords: records.length,
    totalQuantity: records.reduce((sum, r) => sum + r.quantity, 0),
    totalValue: records.reduce((sum, r) => sum + r.totalValue, 0),
    averageValue: records.length > 0 ? records.reduce((sum, r) => sum + r.totalValue, 0) / records.length : 0,
    additionalMetrics: {
      lowStockCount: records.filter(r => r.stockStatus === 'LOW_STOCK').length,
      outOfStockCount: records.filter(r => r.stockStatus === 'OUT_OF_STOCK').length
    }
  }

  return {
    title: 'Low Stock Alert Report',
    subtitle: 'Items requiring immediate attention',
    generatedAt: new Date(),
    filters,
    summary,
    records
  }
}

async function generateStockMovementReport(filters: ReportFilters): Promise<ReportData> {
  const whereClause: {
    warehouseId?: string
    createdAt?: { gte?: Date; lte?: Date }
  } = {}

  if (filters.warehouseId !== 'all') {
    whereClause.warehouseId = filters.warehouseId
  }

  if (filters.dateFrom || filters.dateTo) {
    whereClause.createdAt = {}
    if (filters.dateFrom) {
      whereClause.createdAt.gte = new Date(filters.dateFrom)
    }
    if (filters.dateTo) {
      whereClause.createdAt.lte = new Date(filters.dateTo)
    }
  }

  const movements = await prisma.inventoryMovement.findMany({
    where: whereClause,
    include: {
      item: { select: { itemCode: true, description: true, unitOfMeasure: true } },
      warehouse: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 1000
  })

  const records: MovementReportRecord[] = movements.map(movement => ({
    itemCode: movement.item.itemCode,
    description: movement.item.description,
    warehouse: movement.warehouse.name,
    quantity: Number(movement.quantity),
    unitCost: Number(movement.unitCost || 0),
    totalValue: Number(movement.totalValue || 0),
    movementType: movement.movementType,
    movementDate: movement.createdAt.toISOString().split('T')[0],
    referenceId: movement.referenceId,
    balanceQuantity: Number(movement.balanceQuantity),
    balanceValue: Number(movement.balanceValue)
  }))

  const summary: ReportSummary = {
    totalRecords: records.length,
    totalQuantity: Math.abs(records.reduce((sum, r) => sum + r.quantity, 0)),
    totalValue: Math.abs(records.reduce((sum, r) => sum + r.totalValue, 0)),
    averageValue: records.length > 0 ? Math.abs(records.reduce((sum, r) => sum + r.totalValue, 0)) / records.length : 0
  }

  return {
    title: 'Stock Movement Report',
    subtitle: 'Complete inventory movement audit trail',
    generatedAt: new Date(),
    filters,
    summary,
    records
  }
}
async function generateItemEntryReport(filters: ReportFilters): Promise<ReportData> {
  const whereClause: {
    warehouseId?: string
    supplierId?: string
    entryDate?: { gte?: Date; lte?: Date }
  } = {}

  if (filters.warehouseId !== 'all') {
    whereClause.warehouseId = filters.warehouseId
  }

  if (filters.supplierId !== 'all') {
    whereClause.supplierId = filters.supplierId
  }

  if (filters.dateFrom || filters.dateTo) {
    whereClause.entryDate = {}
    if (filters.dateFrom) {
      whereClause.entryDate.gte = new Date(filters.dateFrom)
    }
    if (filters.dateTo) {
      whereClause.entryDate.lte = new Date(filters.dateTo)
    }
  }

  const entries = await prisma.itemEntry.findMany({
    where: whereClause,
    include: {
      item: { select: { itemCode: true, description: true, unitOfMeasure: true } },
      warehouse: { select: { name: true } },
      supplier: { select: { name: true } },
      createdBy: { select: { username: true } }
    },
    orderBy: { entryDate: 'desc' }
  })

  const records: ItemEntryReportRecord[] = entries.map(entry => ({
    itemCode: entry.item.itemCode,
    description: entry.item.description,
    warehouse: entry.warehouse.name,
    supplier: entry.supplier.name,
    quantity: Number(entry.quantity),
    unitCost: Number(entry.landedCost),
    totalValue: Number(entry.totalValue),
    landedCost: Number(entry.landedCost),
    entryDate: entry.entryDate.toISOString().split('T')[0],
    purchaseReference: entry.purchaseReference,
    createdBy: entry.createdBy.username
  }))

  const summary: ReportSummary = {
    totalRecords: records.length,
    totalQuantity: records.reduce((sum, r) => sum + r.quantity, 0),
    totalValue: records.reduce((sum, r) => sum + r.totalValue, 0),
    averageValue: records.length > 0 ? records.reduce((sum, r) => sum + r.totalValue, 0) / records.length : 0,
    additionalMetrics: {
      averageCost: records.length > 0 ? records.reduce((sum, r) => sum + r.landedCost, 0) / records.length : 0
    }
  }

  return {
    title: 'Item Entry Report',
    subtitle: 'All item entries with landed costs',
    generatedAt: new Date(),
    filters,
    summary,
    records
  }
}


async function generateTransferReport(filters: ReportFilters): Promise<ReportData> {
  const whereClause: {
    OR?: Array<{ fromWarehouseId?: string; toWarehouseId?: string }>
    transferDate?: { gte?: Date; lte?: Date }
  } = {}

  if (filters.warehouseId !== 'all') {
    whereClause.OR = [
      { fromWarehouseId: filters.warehouseId },
      { toWarehouseId: filters.warehouseId }
    ]
  }

  if (filters.dateFrom || filters.dateTo) {
    whereClause.transferDate = {}
    if (filters.dateFrom) {
      whereClause.transferDate.gte = new Date(filters.dateFrom)
    }
    if (filters.dateTo) {
      whereClause.transferDate.lte = new Date(filters.dateTo)
    }
  }

  const transfers = await prisma.transfer.findMany({
    where: whereClause,
    include: {
      fromWarehouse: { select: { name: true } },
      toWarehouse: { select: { name: true } },
      createdBy: { select: { username: true } },
      transferItems: {
        include: {
          item: { select: { itemCode: true, description: true } }
        }
      }
    },
    orderBy: { transferDate: 'desc' }
  })

  const records: TransferReportRecord[] = []
  transfers.forEach(transfer => {
    transfer.transferItems.forEach(item => {
      records.push({
        transferNumber: transfer.transferNumber,
        itemCode: item.item.itemCode,
        description: item.item.description,
        fromWarehouse: transfer.fromWarehouse.name,
        toWarehouse: transfer.toWarehouse.name,
        quantity: Number(item.quantity),
        transferDate: transfer.transferDate.toISOString().split('T')[0],
        status: transfer.status,
        createdBy: transfer.createdBy.username
      })
    })
  })

  const summary: ReportSummary = {
    totalRecords: records.length,
    totalQuantity: records.reduce((sum, r) => sum + r.quantity, 0),
    totalValue: 0,
    averageValue: 0
  }

  return {
    title: 'Transfer Report',
    subtitle: 'Inter-warehouse transfers tracking',
    generatedAt: new Date(),
    filters,
    summary,
    records
  }
}

async function generateWithdrawalReport(filters: ReportFilters): Promise<ReportData> {
  const whereClause: {
    warehouseId?: string
    withdrawalDate?: { gte?: Date; lte?: Date }
  } = {}

  if (filters.warehouseId !== 'all') {
    whereClause.warehouseId = filters.warehouseId
  }

  if (filters.dateFrom || filters.dateTo) {
    whereClause.withdrawalDate = {}
    if (filters.dateFrom) {
      whereClause.withdrawalDate.gte = new Date(filters.dateFrom)
    }
    if (filters.dateTo) {
      whereClause.withdrawalDate.lte = new Date(filters.dateTo)
    }
  }

  const withdrawals = await prisma.withdrawal.findMany({
    where: whereClause,
    include: {
      warehouse: { select: { name: true } },
      createdBy: { select: { username: true } },
      withdrawalItems: {
        include: {
          item: { select: { itemCode: true, description: true } }
        }
      }
    },
    orderBy: { withdrawalDate: 'desc' }
  })

  const records: WithdrawalReportRecord[] = []
  withdrawals.forEach(withdrawal => {
    withdrawal.withdrawalItems.forEach(item => {
      records.push({
        withdrawalNumber: withdrawal.withdrawalNumber,
        itemCode: item.item.itemCode,
        description: item.item.description,
        warehouse: withdrawal.warehouse.name,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        totalValue: Number(item.totalValue),
        withdrawalDate: withdrawal.withdrawalDate.toISOString().split('T')[0],
        purpose: withdrawal.purpose,
        createdBy: withdrawal.createdBy.username
      })
    })
  })

  const summary: ReportSummary = {
    totalRecords: records.length,
    totalQuantity: records.reduce((sum, r) => sum + r.quantity, 0),
    totalValue: records.reduce((sum, r) => sum + r.totalValue, 0),
    averageValue: records.length > 0 ? records.reduce((sum, r) => sum + r.totalValue, 0) / records.length : 0
  }

  return {
    title: 'Withdrawal Report',
    subtitle: 'Material withdrawals and issuances',
    generatedAt: new Date(),
    filters,
    summary,
    records
  }
}


async function generateCostAnalysisReport(filters: ReportFilters): Promise<ReportData> {
  const whereClause: {
    warehouseId?: string
    analyzedDate?: { gte?: Date; lte?: Date }
  } = {}

  if (filters.warehouseId !== 'all') {
    whereClause.warehouseId = filters.warehouseId
  }

  if (filters.dateFrom || filters.dateTo) {
    whereClause.analyzedDate = {}
    if (filters.dateFrom) {
      whereClause.analyzedDate.gte = new Date(filters.dateFrom)
    }
    if (filters.dateTo) {
      whereClause.analyzedDate.lte = new Date(filters.dateTo)
    }
  }

  const variances = await prisma.costVariance.findMany({
    where: whereClause,
    include: {
      item: { select: { itemCode: true, description: true } },
      warehouse: { select: { name: true } }
    },
    orderBy: { analyzedDate: 'desc' }
  })

  const records: CostAnalysisReportRecord[] = variances.map(variance => ({
    itemCode: variance.item.itemCode,
    description: variance.item.description,
    warehouse: variance.warehouse.name,
    quantity: Number(variance.quantity),
    unitCost: Number(variance.actualCost),
    totalValue: Number(variance.totalVariance),
    varianceType: variance.varianceType,
    standardCost: Number(variance.standardCost),
    actualCost: Number(variance.actualCost),
    varianceAmount: Number(variance.varianceAmount),
    variancePercent: Number(variance.variancePercent),
    analyzedDate: variance.analyzedDate.toISOString().split('T')[0]
  }))

  const summary: ReportSummary = {
    totalRecords: records.length,
    totalQuantity: records.reduce((sum, r) => sum + r.quantity, 0),
    totalValue: records.reduce((sum, r) => sum + Math.abs(r.totalValue), 0),
    averageValue: records.length > 0 ? records.reduce((sum, r) => sum + Math.abs(r.totalValue), 0) / records.length : 0,
    additionalMetrics: {
      varianceTotal: records.reduce((sum, r) => sum + Math.abs(r.varianceAmount), 0)
    }
  }

  return {
    title: 'Cost Variance Analysis Report',
    subtitle: 'Standard vs actual cost analysis',
    generatedAt: new Date(),
    filters,
    summary,
    records
  }
}

async function generateMonthlyWeightedAverageReport(filters: ReportFilters): Promise<ReportData> {
  const whereClause: {
    warehouseId?: string
    year?: number
    month?: number
  } = {}

  if (filters.warehouseId !== 'all') {
    whereClause.warehouseId = filters.warehouseId
  }

  // If date filters are provided, extract year and month
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom)
    whereClause.year = fromDate.getFullYear()
    whereClause.month = fromDate.getMonth() + 1
  }

  const monthlyAverages = await prisma.monthlyWeightedAverage.findMany({
    where: whereClause,
    include: {
      item: { select: { itemCode: true, description: true } },
      warehouse: { select: { name: true } }
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }]
  })

  const records: MonthlyAverageReportRecord[] = monthlyAverages.map(avg => ({
    itemCode: avg.item.itemCode,
    description: avg.item.description,
    warehouse: avg.warehouse.name,
    year: avg.year,
    month: avg.month,
    weightedAvgCost: Number(avg.weightedAvgCost),
    openingQuantity: Number(avg.openingQuantity),
    openingValue: Number(avg.openingValue),
    closingQuantity: Number(avg.closingQuantity),
    closingValue: Number(avg.closingValue),
    entryQuantity: Number(avg.purchaseQuantity),
    entryValue: Number(avg.purchaseValue),
    withdrawalQuantity: Number(avg.withdrawalQuantity),
    withdrawalValue: Number(avg.withdrawalValue)
  }))

  const summary: ReportSummary = {
    totalRecords: records.length,
    totalQuantity: records.reduce((sum, r) => sum + r.closingQuantity, 0),
    totalValue: records.reduce((sum, r) => sum + r.closingValue, 0),
    averageValue: records.length > 0 ? records.reduce((sum, r) => sum + r.closingValue, 0) / records.length : 0,
    additionalMetrics: {
      averageCost: records.length > 0 ? records.reduce((sum, r) => sum + r.weightedAvgCost, 0) / records.length : 0
    }
  }

  return {
    title: 'Monthly Weighted Average Report',
    subtitle: 'Monthly cost calculations and movements',
    generatedAt: new Date(),
    filters,
    summary,
    records
  }
}

async function generateSupplierPerformanceReport(filters: ReportFilters): Promise<ReportData> {
  const whereClause: {
    supplierId?: string
    entryDate?: { gte?: Date; lte?: Date }
  } = {}

  if (filters.supplierId !== 'all') {
    whereClause.supplierId = filters.supplierId
  }

  if (filters.dateFrom || filters.dateTo) {
    whereClause.entryDate = {}
    if (filters.dateFrom) {
      whereClause.entryDate.gte = new Date(filters.dateFrom)
    }
    if (filters.dateTo) {
      whereClause.entryDate.lte = new Date(filters.dateTo)
    }
  }

  const entries = await prisma.itemEntry.findMany({
    where: whereClause,
    include: {
      item: { select: { itemCode: true, description: true } },
      warehouse: { select: { name: true } },
      supplier: { select: { name: true } }
    },
    orderBy: { entryDate: 'desc' }
  })

  const records: ItemEntryReportRecord[] = entries.map(entry => ({
    itemCode: entry.item.itemCode,
    description: entry.item.description,
    warehouse: entry.warehouse.name,
    supplier: entry.supplier.name,
    quantity: Number(entry.quantity),
    unitCost: Number(entry.landedCost),
    totalValue: Number(entry.totalValue),
    landedCost: Number(entry.landedCost),
    entryDate: entry.entryDate.toISOString().split('T')[0],
    purchaseReference: entry.purchaseReference,
    createdBy: 'System' // We'll need to join with user if needed
  }))

  const summary: ReportSummary = {
    totalRecords: records.length,
    totalQuantity: records.reduce((sum, r) => sum + r.quantity, 0),
    totalValue: records.reduce((sum, r) => sum + r.totalValue, 0),
    averageValue: records.length > 0 ? records.reduce((sum, r) => sum + r.totalValue, 0) / records.length : 0,
    additionalMetrics: {
      averageCost: records.length > 0 ? records.reduce((sum, r) => sum + r.landedCost, 0) / records.length : 0
    }
  }

  return {
    title: 'Supplier Performance Report',
    subtitle: 'Supplier delivery and cost performance analysis',
    generatedAt: new Date(),
    filters,
    summary,
    records
  }
}
