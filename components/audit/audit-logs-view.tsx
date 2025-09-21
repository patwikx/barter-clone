"use client"

import React, { useState, useTransition } from "react"
import {
  Shield,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  User,
  FileText,
  Eye,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAuditLogs, type AuditLogWithDetails, type AuditLogFilters } from "@/lib/actions/audit-actions"
import { AuditAction } from "@prisma/client"
import { toast } from "sonner"

interface AuditLogsViewProps {
  initialAuditLogs: AuditLogWithDetails[]
}

const getActionIcon = (action: AuditAction) => {
  switch (action) {
    case AuditAction.CREATE:
      return Plus
    case AuditAction.UPDATE:
      return Edit
    case AuditAction.DELETE:
      return Trash2
    case AuditAction.APPROVE:
      return CheckCircle
    case AuditAction.REJECT:
      return XCircle
    case AuditAction.LOGIN:
      return User
    case AuditAction.LOGOUT:
      return User
    case AuditAction.EXPORT:
      return Download
    case AuditAction.IMPORT:
      return FileText
    default:
      return FileText
  }
}

const getActionColor = (action: AuditAction) => {
  switch (action) {
    case AuditAction.CREATE:
      return "bg-green-100 text-green-800"
    case AuditAction.UPDATE:
      return "bg-blue-100 text-blue-800"
    case AuditAction.DELETE:
      return "bg-red-100 text-red-800"
    case AuditAction.APPROVE:
      return "bg-emerald-100 text-emerald-800"
    case AuditAction.REJECT:
      return "bg-orange-100 text-orange-800"
    case AuditAction.LOGIN:
      return "bg-purple-100 text-purple-800"
    case AuditAction.LOGOUT:
      return "bg-gray-100 text-gray-800"
    case AuditAction.EXPORT:
      return "bg-indigo-100 text-indigo-800"
    case AuditAction.IMPORT:
      return "bg-cyan-100 text-cyan-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function AuditLogsView({ initialAuditLogs }: AuditLogsViewProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLogWithDetails[]>(initialAuditLogs)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAction, setSelectedAction] = useState("all")
  const [selectedTable, setSelectedTable] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const filters: Partial<AuditLogFilters> = {
        search: searchQuery,
        action: selectedAction,
        tableName: selectedTable,
        dateFrom,
        dateTo
      }

      const result = await getAuditLogs(filters)
      
      if (result.success) {
        setAuditLogs(result.data || [])
        toast.success("Audit logs refreshed")
      } else {
        toast.error(result.error || "Failed to refresh audit logs")
      }
    })
  }

  const handleFilterChange = () => {
    handleRefresh()
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedAction("all")
    setSelectedTable("all")
    setDateFrom("")
    setDateTo("")
    
    startTransition(async () => {
      const result = await getAuditLogs()
      if (result.success) {
        setAuditLogs(result.data || [])
      }
    })
  }

  const uniqueTables = Array.from(new Set(auditLogs.map(log => log.tableName)))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Complete audit trail of all system activities</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isPending}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {Object.values(AuditAction).map((action) => {
                    const Icon = getActionIcon(action)
                    return (
                      <SelectItem key={action} value={action}>
                        <div className="flex items-center">
                          <Icon className="w-4 h-4 mr-2" />
                          {action}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Table</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="All Tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  {uniqueTables.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={handleFilterChange} disabled={isPending} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Audit Trail ({auditLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Shield className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
              <p className="text-gray-500 text-center">
                No audit logs match your current filters or no audit data available.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => {
                  const ActionIcon = getActionIcon(log.action)
                  const userName = log.user 
                    ? [log.user.firstName, log.user.lastName].filter(Boolean).join(' ') || log.user.username
                    : log.userEmail || 'System'

                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">
                              {log.timestamp.toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          <ActionIcon className="w-3 h-3 mr-1" />
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{log.tableName}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          {log.referenceNumber && (
                            <div className="font-medium text-sm">{log.referenceNumber}</div>
                          )}
                          {log.transactionType && (
                            <div className="text-xs text-gray-500">{log.transactionType}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">{userName}</div>
                          {log.userEmail && (
                            <div className="text-xs text-gray-500">{log.userEmail}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {log.notes || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}