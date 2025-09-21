"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { CostLayerType, VarianceType, Prisma } from "@prisma/client"

export interface CostAccountingData {
  summary: {
    totalCostLayers: number
    totalInventoryValue: number
    totalVariances: number
    monthlyAverages: number
  }
  costLayers: Array<{
    id: string
    quantity: number
    remainingQty: number
    unitCost: number
    totalCost: number
    layerDate: Date
    layerType: CostLayerType
    sourceRef: string | null
    item: {
      id: string
      itemCode: string
      description: string
      unitOfMeasure: string
    }
    warehouse: {
      id: string
      name: string
    }
  }>
  costVariances: Array<{
    id: string
    varianceType: VarianceType
    standardCost: number
    actualCost: number
    varianceAmount: number
    variancePercent: number
    quantity: number
    totalVariance: number
    referenceType: string
    referenceId: string
    referenceNumber: string | null
    analyzedDate: Date
    item: {
      id: string
      itemCode: string
      description: string
    }
    warehouse: {
      id: string
      name: string
    }
  }>
  monthlyAverages: Array<{
    id: string
    year: number
    month: number
    weightedAvgCost: number
    totalQuantity: number
    totalValue: number
    item: {
      id: string
      itemCode: string
      description: string
    }
    warehouse: {
      id: string
      name: string
    }
  }>
  warehouses: Array<{
    id: string
    name: string
  }>
}

export interface CostAccountingFilters {
  costingMethod?: string
  warehouseId?: string
  dateFrom?: string
  dateTo?: string
}

// Include types for cost queries
const costLayerInclude = {
  item: {
    select: {
      id: true,
      itemCode: true,
      description: true,
      unitOfMeasure: true
    }
  },
  warehouse: {
    select: {
      id: true,
      name: true
    }
  }
} satisfies Prisma.CostLayerInclude

const costVarianceInclude = {
  item: {
    select: {
      id: true,
      itemCode: true,
      description: true
    }
  },
  warehouse: {
    select: {
      id: true,
      name: true
    }
  }
} satisfies Prisma.CostVarianceInclude

const monthlyAverageInclude = {
  item: {
    select: {
      id: true,
      itemCode: true,
      description: true
    }
  },
  warehouse: {
    select: {
      id: true,
      name: true
    }
  }
} satisfies Prisma.MonthlyWeightedAverageInclude

// Raw types from database
type RawCostLayer = Prisma.CostLayerGetPayload<{
  include: typeof costLayerInclude
}>

type RawCostVariance = Prisma.CostVarianceGetPayload<{
  include: typeof costVarianceInclude
}>

type RawMonthlyAverage = Prisma.MonthlyWeightedAverageGetPayload<{
  include: typeof monthlyAverageInclude
}>

// Transform functions
function transformCostLayer(layer: RawCostLayer) {
  return {
    id: layer.id,
    quantity: Number(layer.quantity),
    remainingQty: Number(layer.remainingQty),
    unitCost: Number(layer.unitCost),
    totalCost: Number(layer.totalCost),
    layerDate: layer.layerDate,
    layerType: layer.layerType,
    sourceRef: layer.sourceRef,
    item: layer.item,
    warehouse: layer.warehouse
  }
}

function transformCostVariance(variance: RawCostVariance) {
  return {
    id: variance.id,
    varianceType: variance.varianceType,
    standardCost: Number(variance.standardCost),
    actualCost: Number(variance.actualCost),
    varianceAmount: Number(variance.varianceAmount),
    variancePercent: Number(variance.variancePercent),
    quantity: Number(variance.quantity),
    totalVariance: Number(variance.totalVariance),
    referenceType: variance.referenceType,
    referenceId: variance.referenceId,
    referenceNumber: variance.referenceNumber,
    analyzedDate: variance.analyzedDate,
    item: variance.item,
    warehouse: variance.warehouse
  }
}

function transformMonthlyAverage(average: RawMonthlyAverage) {
  return {
    id: average.id,
    year: average.year,
    month: average.month,
    weightedAvgCost: Number(average.weightedAvgCost),
    totalQuantity: Number(average.totalQuantity),
    totalValue: Number(average.totalValue),
    item: average.item,
    warehouse: average.warehouse
  }
}

export async function getCostAccountingData(
  filters: CostAccountingFilters = {}
): Promise<{
  success: boolean
  data?: CostAccountingData
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { costingMethod = "all", warehouseId = "all", dateFrom = "", dateTo = "" } = filters

    // Build where clauses
    const costLayerWhere: Prisma.CostLayerWhereInput = {}
    const varianceWhere: Prisma.CostVarianceWhereInput = {}
    const monthlyWhere: Prisma.MonthlyWeightedAverageWhereInput = {}

    // Warehouse filter
    if (warehouseId && warehouseId !== 'all') {
      costLayerWhere.warehouseId = warehouseId
      varianceWhere.warehouseId = warehouseId
      monthlyWhere.warehouseId = warehouseId
    }

    // Date filters
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom)
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo)
    }
    if (Object.keys(dateFilter).length > 0) {
      costLayerWhere.layerDate = dateFilter
      varianceWhere.analyzedDate = dateFilter
    }

    // Fetch data in parallel
    const [
      costLayers,
      costVariances,
      monthlyAverages,
      warehouses,
      totalInventoryValue
    ] = await Promise.all([
      prisma.costLayer.findMany({
        where: costLayerWhere,
        include: costLayerInclude,
        orderBy: { layerDate: 'desc' },
        take: 100
      }),
      prisma.costVariance.findMany({
        where: varianceWhere,
        include: costVarianceInclude,
        orderBy: { analyzedDate: 'desc' },
        take: 50
      }),
      prisma.monthlyWeightedAverage.findMany({
        where: monthlyWhere,
        include: monthlyAverageInclude,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 50
      }),
      prisma.warehouse.findMany({
        select: {
          id: true,
          name: true
        },
        orderBy: { name: 'asc' }
      }),
      prisma.currentInventory.aggregate({
        _sum: { totalValue: true }
      })
    ])

    const data: CostAccountingData = {
      summary: {
        totalCostLayers: costLayers.length,
        totalInventoryValue: Number(totalInventoryValue._sum.totalValue || 0),
        totalVariances: costVariances.length,
        monthlyAverages: monthlyAverages.length
      },
      costLayers: costLayers.map(transformCostLayer),
      costVariances: costVariances.map(transformCostVariance),
      monthlyAverages: monthlyAverages.map(transformMonthlyAverage),
      warehouses
    }

    return {
      success: true,
      data
    }

  } catch (error) {
    console.error('Error fetching cost accounting data:', error)
    return {
      success: false,
      error: 'Failed to fetch cost accounting data'
    }
  }
}

// Calculate monthly weighted averages
export async function calculateMonthlyWeightedAverages(
  year: number,
  month: number
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    // Get all items with movements in the specified month
    const itemsWithMovements = await prisma.inventoryMovement.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        itemId: true,
        warehouseId: true
      },
      distinct: ['itemId', 'warehouseId']
    })

    // Calculate weighted averages for each item-warehouse combination
    for (const { itemId, warehouseId } of itemsWithMovements) {
      const movements = await prisma.inventoryMovement.findMany({
        where: {
          itemId,
          warehouseId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'asc' }
      })

      if (movements.length === 0) continue

      // Calculate weighted average
      let totalQuantity = 0
      let totalValue = 0
      let openingQuantity = 0
      let openingValue = 0
      let closingQuantity = 0
      let closingValue = 0

      // Get opening balance
      const openingMovement = movements[0]
      if (openingMovement) {
        openingQuantity = Number(openingMovement.balanceQuantity) - Number(openingMovement.quantity)
        openingValue = Number(openingMovement.balanceValue) - Number(openingMovement.totalValue || 0)
      }

      // Calculate totals
      for (const movement of movements) {
        totalQuantity += Number(movement.quantity)
        totalValue += Number(movement.totalValue || 0)
      }

      // Get closing balance
      const closingMovement = movements[movements.length - 1]
      if (closingMovement) {
        closingQuantity = Number(closingMovement.balanceQuantity)
        closingValue = Number(closingMovement.balanceValue)
      }

      const weightedAvgCost = closingQuantity > 0 ? closingValue / closingQuantity : 0

      // Upsert monthly weighted average
      await prisma.monthlyWeightedAverage.upsert({
        where: {
          itemId_warehouseId_year_month: {
            itemId,
            warehouseId,
            year,
            month
          }
        },
        update: {
          weightedAvgCost,
          totalQuantity: Math.abs(totalQuantity),
          totalValue: Math.abs(totalValue),
          openingQuantity,
          openingValue,
          closingQuantity,
          closingValue
        },
        create: {
          itemId,
          warehouseId,
          year,
          month,
          weightedAvgCost,
          totalQuantity: Math.abs(totalQuantity),
          totalValue: Math.abs(totalValue),
          openingQuantity,
          openingValue,
          closingQuantity,
          closingValue
        }
      })
    }

    return { success: true }

  } catch (error) {
    console.error('Error calculating monthly weighted averages:', error)
    return {
      success: false,
      error: 'Failed to calculate monthly weighted averages'
    }
  }
}