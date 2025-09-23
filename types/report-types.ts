// Enhanced Report Types with Proper Schema Alignment

export type ReportType = 
  | 'INVENTORY_SUMMARY'
  | 'INVENTORY_VALUATION'
  | 'STOCK_MOVEMENT'
  | 'LOW_STOCK_REPORT'
  | 'ITEM_ENTRY_REPORT'
  | 'TRANSFER_REPORT'
  | 'WITHDRAWAL_REPORT'
  | 'COST_ANALYSIS'
  | 'MONTHLY_WEIGHTED_AVERAGE'
  | 'SUPPLIER_PERFORMANCE'

export interface ReportFilters {
  reportType: ReportType
  warehouseId: string
  supplierId: string
  dateFrom: string
  dateTo: string
  includeZeroStock: boolean
  costingMethod?: 'FIFO' | 'LIFO' | 'WEIGHTED_AVERAGE' | 'MOVING_AVERAGE' | 'STANDARD_COST' | 'SPECIFIC_IDENTIFICATION'
}

export interface BaseReportRecord {
  itemCode: string
  description: string
  warehouse: string
  quantity: number
  unitCost: number
  totalValue: number
}

export interface InventoryReportRecord extends BaseReportRecord {
  supplier: string
  unitOfMeasure: string
  reorderLevel?: number
  standardCost: number
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
}

export interface MovementReportRecord extends BaseReportRecord {
  movementType: string
  movementDate: string
  referenceId: string | null
  balanceQuantity: number
  balanceValue: number
}

export interface ItemEntryReportRecord extends BaseReportRecord {
  supplier: string
  landedCost: number
  entryDate: string
  purchaseReference: string | null
  createdBy: string
}

export interface TransferReportRecord {
  transferNumber: string
  itemCode: string
  description: string
  fromWarehouse: string
  toWarehouse: string
  quantity: number
  transferDate: string
  status: string
  createdBy: string
}

export interface WithdrawalReportRecord extends BaseReportRecord {
  withdrawalNumber: string
  withdrawalDate: string
  purpose: string | null
  createdBy: string
}

export interface CostAnalysisReportRecord extends BaseReportRecord {
  varianceType: string
  standardCost: number
  actualCost: number
  varianceAmount: number
  variancePercent: number
  analyzedDate: string
}

export interface MonthlyAverageReportRecord {
  itemCode: string
  description: string
  warehouse: string
  year: number
  month: number
  weightedAvgCost: number
  openingQuantity: number
  openingValue: number
  closingQuantity: number
  closingValue: number
  entryQuantity: number
  entryValue: number
  withdrawalQuantity: number
  withdrawalValue: number
}

export interface OperationalReportRecord {
  metric: string
  value: number
  category: string
  period: string
}

export interface WarehouseEfficiencyRecord {
  warehouseName: string
  location: string
  totalItems: number
  totalValue: number
  totalQuantity: number
  totalMovements: number
  totalEntries: number
  totalTransfers: number
  totalWithdrawals: number
  efficiencyScore: number
}

export interface SupplierPerformanceRecord {
  supplierName: string
  contactInfo: string
  totalItems: number
  totalEntries: number
  totalValue: number
  totalQuantity: number
  averageCost: number
  lastEntryDate: string
  performanceScore: number
}

export interface InventoryTurnoverRecord {
  itemCode: string
  description: string
  warehouse: string
  currentQuantity: number
  outboundQuantity: number
  averageInventory: number
  turnoverRatio: number
  daysOnHand: number
  currentValue: number
  standardCost: number
}
export type ReportRecord = 
  | InventoryReportRecord
  | MovementReportRecord
  | ItemEntryReportRecord
  | TransferReportRecord
  | WithdrawalReportRecord
  | CostAnalysisReportRecord
  | MonthlyAverageReportRecord
  | OperationalReportRecord
  | WarehouseEfficiencyRecord
  | SupplierPerformanceRecord
  | InventoryTurnoverRecord

export interface ReportSummary {
  totalRecords: number
  totalQuantity: number
  totalValue: number
  averageValue: number
  additionalMetrics?: {
    lowStockCount?: number
    outOfStockCount?: number
    varianceTotal?: number
    averageCost?: number
    totalMovements?: number
    averageEfficiency?: number
    totalEntries?: number
    averagePerformance?: number
    averageTurnover?: number
    averageDaysOnHand?: number
    monthlyOperations?: number
    systemUtilization?: number
  }
}

export interface ReportData {
  title: string
  subtitle: string
  generatedAt: Date
  filters: ReportFilters
  summary: ReportSummary
  records: ReportRecord[]
  metadata?: {
    warehouseNames?: string[]
    supplierNames?: string[]
    dateRange?: string
    reportParameters?: Record<string, unknown>
  }
}