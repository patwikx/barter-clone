"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export type ReportType = 
  | 'INVENTORY_SUMMARY'
  | 'INVENTORY_VALUATION'
  | 'STOCK_MOVEMENT'
  | 'LOW_STOCK_REPORT'
  | 'ITEM_ENTRY_REPORT'
  | 'TRANSFER_REPORT'
  | 'WITHDRAWAL_REPORT'
  | 'COST_ANALYSIS'

export interface ReportFilters {
  reportType: ReportType
  warehouseId: string
  supplierId: string
  dateFrom: string
  dateTo: string
  includeZeroStock: boolean
}

export interface ReportRecord {
  itemCode: string
  description: string
  warehouse: string
  supplier?: string
  quantity: number
  unitCost: number
  totalValue: number
  date?: string
  reference?: string
  status?: string
  notes?: string
}

export interface ReportData {
  title: string
  subtitle: string
  generatedAt: Date
  filters: ReportFilters
  summary: {
    totalRecords: number
    totalQuantity: number
    totalValue: number
    averageValue: number
  }
  records: ReportRecord[]
}

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
      default:
        return { success: false, error: "Invalid report type" }
    }

    return {
      success: true,
      data: reportData
    }

  } catch (error) {
    console.error('Error generating report:', error)
    return {
      success: false,
      error: 'Failed to generate report'
    }
  }
}

async function generateInventorySummaryReport(filters: ReportFilters): Promise<ReportData> {
  const whereClause: {
    warehouseId?: string
    item?: {
      supplierId?: string
    }
    quantity?: {
      gt?: number
    }
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
          supplier: {
            select: { name: true }
          }
        }
      },
      warehouse: {
        select: { name: true, location: true }
      }
    },
    orderBy: [
      { warehouse: { name: 'asc' } },
      { item: { itemCode: 'asc' } }
    ]
  })

  const records: ReportRecord[] = inventory.map(inv => ({
    itemCode: inv.item.itemCode,
    description: inv.item.description,
    warehouse: inv.warehouse.name,
    supplier: inv.item.supplier.name,
    quantity: Number(inv.quantity),
    unitCost: Number(inv.avgUnitCost),
    totalValue: Number(inv.totalValue)
  }))

  const summary = {
    totalRecords: records.length,
    totalQuantity: records.reduce((sum, r) => sum + r.quantity, 0),
    totalValue: records.reduce((sum, r) => sum + r.totalValue, 0),
    averageValue: records.length > 0 ? records.reduce((sum, r) => sum + r.totalValue, 0) / records.length : 0
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
  // Similar to inventory summary but with more detailed costing information
  const whereClause: {
    warehouseId?: string
    item?: {
      supplierId?: string
    }
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
          supplier: {
            select: { name: true }
          }
        }
      },
      warehouse: {
        select: { name: true, location: true }
      }
    },
    orderBy: [
      { totalValue: 'desc' }
    ]
  })

  const records: ReportRecord[] = inventory.map(inv => ({
    itemCode: inv.item.itemCode,
    description: inv.item.description,
    warehouse: inv.warehouse.name,
    supplier: inv.item.supplier.name,
    quantity: Number(inv.quantity),
    unitCost: Number(inv.avgUnitCost),
    totalValue: Number(inv.totalValue)
  }))

  const summary = {
    totalRecords: records.length,
    totalQuantity: records.reduce((sum, r) => sum + r.quantity, 0),
    totalValue: records.reduce((sum, r) => sum + r.totalValue, 0),
    averageValue: records.length > 0 ? records.reduce((sum, r) => sum + r.totalValue, 0) / records.length : 0
  }

  return {
    title: 'Inventory Valuation Report',
    subtitle: 'Detailed inventory valuation by cost method',
    generatedAt: new Date(),
    filters,
    summary,
    records
  }
}

async function generateStockMovementReport(filters: ReportFilters): Promise<ReportData> {
  const whereClause: {
    warehouseId?: string
    createdAt?: {
      gte?: Date
      lte?: Date
    }
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
      item: {
        select: {
          itemCode: true,
          description: true,
          unitOfMeasure: true
        }
      },
      warehouse: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 1000
  })

  const records: ReportRecord[] = movements.map(movement => ({
    itemCode: movement.item.itemCode,
    description: movement.item.description,
    warehouse: movement.warehouse.name,
    quantity: Number(movement.quantity),
    unitCost: Number(movement.unitCost || 0),
    totalValue: Number(movement.totalValue || 0),
    date: movement.createdAt.toLocaleDateString(),
    reference: movement.referenceId || '',
    status: movement.movementType,
    notes: movement.notes || ''
  }))

  const summary = {
    totalRecords: records.length,
    totalQuantity: Math.abs(records.reduce((sum, r) => sum + r.quantity, 0)),
    totalValue: Math.abs(records.reduce((sum, r) => sum + r.totalValue, 0)),
    averageValue: records.length > 0 ? Math.abs(records.reduce((sum, r) => sum + r.totalValue, 0)) / records.length : 0
  }

  return {
    title: 'Stock Movement Report',
    subtitle: 'All inventory movements within specified period',
    generatedAt: new Date(),
    filters,
    summary,
    records
  }
}

async function generateLowStockReport(filters: ReportFilters): Promise<ReportData> {
  const whereClause: {
    warehouseId?: string
    item?: {
      supplierId?: string
      reorderLevel: {
        not: null
      }
    }
  } = {
    item: {
      reorderLevel: {
        not: null
      }
    }
  }

  if (filters.warehouseId !== 'all') {
    whereClause.warehouseId = filters.warehouseId
  }

  if (filters.supplierId !== 'all') {
    // Fix: Properly construct the item filter object
    whereClause.item = {
      reorderLevel: {
        not: null
      },
      supplierId: filters.supplierId
    }
  }

  const inventory = await prisma.currentInventory.findMany({
    where: whereClause,
    include: {
      item: {
        include: {
          supplier: {
            select: { name: true }
          }
        }
      },
      warehouse: {
        select: { name: true }
      }
    }
  })

  // Filter for low stock items
  const lowStockItems = inventory.filter(inv => 
    inv.item.reorderLevel && Number(inv.quantity) <= Number(inv.item.reorderLevel)
  )

  const records: ReportRecord[] = lowStockItems.map(inv => ({
    itemCode: inv.item.itemCode,
    description: inv.item.description,
    warehouse: inv.warehouse.name,
    supplier: inv.item.supplier.name,
    quantity: Number(inv.quantity),
    unitCost: Number(inv.avgUnitCost),
    totalValue: Number(inv.totalValue)
  }))

  const summary = {
    totalRecords: records.length,
    totalQuantity: records.reduce((sum, r) => sum + r.quantity, 0),
    totalValue: records.reduce((sum, r) => sum + r.totalValue, 0),
    averageValue: records.length > 0 ? records.reduce((sum, r) => sum + r.totalValue, 0) / records.length : 0
  }

  return {
    title: 'Low Stock Report',
    subtitle: 'Items below reorder levels requiring attention',
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
    entryDate?: {
      gte?: Date
      lte?: Date
    }
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
      item: {
        select: {
          itemCode: true,
          description: true,
          unitOfMeasure: true
        }
      },
      warehouse: {
        select: { name: true }
      },
      supplier: {
        select: { name: true }
      }
    },
    orderBy: { entryDate: 'desc' }
  })

  const records: ReportRecord[] = entries.map(entry => ({
    itemCode: entry.item.itemCode,
    description: entry.item.description,
    warehouse: entry.warehouse.name,
    supplier: entry.supplier.name,
    quantity: Number(entry.quantity),
    unitCost: Number(entry.landedCost),
    totalValue: Number(entry.totalValue),
    date: entry.entryDate.toLocaleDateString(),
    reference: entry.purchaseReference || '',
    notes: entry.notes || ''
  }))

  const summary = {
    totalRecords: records.length,
    totalQuantity: records.reduce((sum, r) => sum + r.quantity, 0),
    totalValue: records.reduce((sum, r) => sum + r.totalValue, 0),
    averageValue: records.length > 0 ? records.reduce((sum, r) => sum + r.totalValue, 0) / records.length : 0
  }

  return {
    title: 'Item Entry Report',
    subtitle: 'All item entries within specified period',
    generatedAt: new Date(),
    filters,
    summary,
    records
  }
}

async function generateTransferReport(filters: ReportFilters): Promise<ReportData> {
  const whereClause: {
    OR?: Array<{
      fromWarehouseId?: string
      toWarehouseId?: string
    }>
    transferDate?: {
      gte?: Date
      lte?: Date
    }
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
      transferItems: {
        include: {
          item: {
            select: {
              itemCode: true,
              description: true,
              unitOfMeasure: true
            }
          }
        }
      }
    },
    orderBy: { transferDate: 'desc' }
  })

  const records: ReportRecord[] = []
  
  transfers.forEach(transfer => {
    transfer.transferItems.forEach(item => {
      records.push({
        itemCode: item.item.itemCode,
        description: item.item.description,
        warehouse: `${transfer.fromWarehouse.name} → ${transfer.toWarehouse.name}`,
        quantity: Number(item.quantity),
        unitCost: 0, // Transfers don't have unit cost
        totalValue: 0, // Transfers don't change total value
        date: transfer.transferDate.toLocaleDateString(),
        reference: transfer.transferNumber,
        status: transfer.status,
        notes: transfer.notes || ''
      })
    })
  })

  const summary = {
    totalRecords: records.length,
    totalQuantity: records.reduce((sum, r) => sum + r.quantity, 0),
    totalValue: 0,
    averageValue: 0
  }

  return {
    title: 'Transfer Report',
    subtitle: 'Inter-warehouse transfers within specified period',
    generatedAt: new Date(),
    filters,
    summary,
    records
  }
}

async function generateWithdrawalReport(filters: ReportFilters): Promise<ReportData> {
  const whereClause: {
    warehouseId?: string
    withdrawalDate?: {
      gte?: Date
      lte?: Date
    }
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
      withdrawalItems: {
        include: {
          item: {
            select: {
              itemCode: true,
              description: true,
              unitOfMeasure: true
            }
          }
        }
      }
    },
    orderBy: { withdrawalDate: 'desc' }
  })

  const records: ReportRecord[] = []
  
  withdrawals.forEach(withdrawal => {
    withdrawal.withdrawalItems.forEach(item => {
      records.push({
        itemCode: item.item.itemCode,
        description: item.item.description,
        warehouse: withdrawal.warehouse.name,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        totalValue: Number(item.totalValue),
        date: withdrawal.withdrawalDate.toLocaleDateString(),
        reference: withdrawal.withdrawalNumber,
        status: withdrawal.status,
        notes: withdrawal.purpose || ''
      })
    })
  })

  const summary = {
    totalRecords: records.length,
    totalQuantity: records.reduce((sum, r) => sum + r.quantity, 0),
    totalValue: records.reduce((sum, r) => sum + r.totalValue, 0),
    averageValue: records.length > 0 ? records.reduce((sum, r) => sum + r.totalValue, 0) / records.length : 0
  }

  return {
    title: 'Withdrawal Report',
    subtitle: 'Material withdrawals and issuances within specified period',
    generatedAt: new Date(),
    filters,
    summary,
    records
  }
}

async function generateCostAnalysisReport(filters: ReportFilters): Promise<ReportData> {
  const whereClause: {
    warehouseId?: string
    analyzedDate?: {
      gte?: Date
      lte?: Date
    }
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
      item: {
        select: {
          itemCode: true,
          description: true
        }
      },
      warehouse: {
        select: { name: true }
      }
    },
    orderBy: { analyzedDate: 'desc' }
  })

  const records: ReportRecord[] = variances.map(variance => ({
    itemCode: variance.item.itemCode,
    description: variance.item.description,
    warehouse: variance.warehouse.name,
    quantity: Number(variance.quantity),
    unitCost: Number(variance.actualCost),
    totalValue: Number(variance.totalVariance),
    date: variance.analyzedDate.toLocaleDateString(),
    reference: variance.referenceNumber || '',
    status: variance.varianceType,
    notes: `Variance: ${Number(variance.variancePercent).toFixed(2)}%`
  }))

  const summary = {
    totalRecords: records.length,
    totalQuantity: records.reduce((sum, r) => sum + r.quantity, 0),
    totalValue: records.reduce((sum, r) => sum + Math.abs(r.totalValue), 0),
    averageValue: records.length > 0 ? records.reduce((sum, r) => sum + Math.abs(r.totalValue), 0) / records.length : 0
  }

  return {
    title: 'Cost Analysis Report',
    subtitle: 'Cost variances and analysis within specified period',
    generatedAt: new Date(),
    filters,
    summary,
    records
  }
}