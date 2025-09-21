"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { AuditAction, Prisma } from "@prisma/client"

export interface AuditLogWithDetails {
  id: string
  tableName: string
  recordId: string
  action: AuditAction
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  changedFields: string[]
  userEmail: string | null
  sessionId: string | null
  ipAddress: string | null
  userAgent: string | null
  transactionType: string | null
  referenceNumber: string | null
  notes: string | null
  timestamp: Date
  user: {
    id: string
    username: string
    firstName: string | null
    lastName: string | null
  } | null
}

export interface AuditLogFilters {
  search: string
  action: string
  tableName: string
  userId: string
  dateFrom: string
  dateTo: string
}

// Include type for audit log queries
const auditLogInclude = {
  user: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true
    }
  }
} satisfies Prisma.AuditLogInclude

// Where clause type for audit log queries
interface AuditLogWhereInput {
  OR?: Array<{
    tableName?: {
      contains: string
      mode: 'insensitive'
    }
    referenceNumber?: {
      contains: string
      mode: 'insensitive'
    }
    notes?: {
      contains: string
      mode: 'insensitive'
    }
    transactionType?: {
      contains: string
      mode: 'insensitive'
    }
  }>
  action?: AuditAction
  tableName?: string
  userId?: string
  timestamp?: {
    gte?: Date
    lte?: Date
  }
}

// Raw type from database
type RawAuditLogWithDetails = Prisma.AuditLogGetPayload<{
  include: typeof auditLogInclude
}>

// Transform function
function transformAuditLog(log: RawAuditLogWithDetails): AuditLogWithDetails {
  return {
    id: log.id,
    tableName: log.tableName,
    recordId: log.recordId,
    action: log.action,
    oldValues: log.oldValues as Record<string, unknown> | null,
    newValues: log.newValues as Record<string, unknown> | null,
    changedFields: log.changedFields,
    userEmail: log.userEmail,
    sessionId: log.sessionId,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    transactionType: log.transactionType,
    referenceNumber: log.referenceNumber,
    notes: log.notes,
    timestamp: log.timestamp,
    user: log.user
  }
}

// Get all audit logs with filters
export async function getAuditLogs(
  filters: Partial<AuditLogFilters> = {}
): Promise<{
  success: boolean
  data?: AuditLogWithDetails[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const { search = "", action = "all", tableName = "all", userId = "all", dateFrom = "", dateTo = "" } = filters

    // Build where clause
    const where: AuditLogWhereInput = {}

    // Search filter
    if (search && search.trim() !== "") {
      where.OR = [
        {
          tableName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          referenceNumber: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          notes: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          transactionType: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Action filter
    if (action && action !== 'all') {
      where.action = action as AuditAction
    }

    // Table filter
    if (tableName && tableName !== 'all') {
      where.tableName = tableName
    }

    // User filter
    if (userId && userId !== 'all') {
      where.userId = userId
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
      where.timestamp = dateFilter
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: auditLogInclude,
      orderBy: {
        timestamp: 'desc'
      },
      take: 1000 // Limit to prevent performance issues
    })

    const transformedLogs = auditLogs.map(transformAuditLog)

    return {
      success: true,
      data: transformedLogs
    }

  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return {
      success: false,
      error: 'Failed to fetch audit logs'
    }
  }
}

// Create audit log entry
export async function createAuditLog(data: {
  tableName: string
  recordId: string
  action: AuditAction
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  changedFields?: string[]
  transactionType?: string
  referenceNumber?: string
  notes?: string
}): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.auditLog.create({
      data: {
        tableName: data.tableName,
        recordId: data.recordId,
        action: data.action,
        oldValues: data.oldValues ? data.oldValues as Prisma.InputJsonValue : Prisma.JsonNull,
        newValues: data.newValues ? data.newValues as Prisma.InputJsonValue : Prisma.JsonNull,
        changedFields: data.changedFields || [],
        userId: session.user.id,
        userEmail: session.user.email,
        transactionType: data.transactionType,
        referenceNumber: data.referenceNumber,
        notes: data.notes,
        timestamp: new Date()
      }
    })

    return { success: true }

  } catch (error) {
    console.error('Error creating audit log:', error)
    return {
      success: false,
      error: 'Failed to create audit log'
    }
  }
}