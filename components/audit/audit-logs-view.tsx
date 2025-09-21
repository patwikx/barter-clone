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
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
            <p className="text-gray-600">Complete audit trail of all system activities</p>
          </div>
          <div className="flex items-center gap-3">
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div 
            className="px-8 py-6 border-b border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition-colors"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Filter className="w-6 h-6 mr-3 text-blue-600" />
                Filters
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {isFilterExpanded ? 'Collapse' : 'Expand'}
                </span>
                {isFilterExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>
          {isFilterExpanded && (
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Search</Label>
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
                  <Label className="text-sm font-medium text-gray-700">Action</Label>
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
                  <Label className="text-sm font-medium text-gray-700">Table</Label>
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
                  <Label className="text-sm font-medium text-gray-700">Date From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Date To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">&nbsp;</Label>
                  <Button onClick={handleFilterChange} disabled={isPending} className="w-full">
                    <Filter className="w-4 h-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Shield className="w-6 h-6 mr-3 text-blue-600" />
              Audit Trail ({formatNumber(auditLogs.length)})
            </h3>
          </div>
          <div className="overflow-x-auto">
            {auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-gray-50 rounded-full mb-4">
                  <Shield className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No audit logs found</h3>
                <p className="text-gray-500 text-center mb-8 max-w-sm">
                  No audit logs match your current filters or no audit data available.
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log) => {
                    const ActionIcon = getActionIcon(log.action)
                    const userName = log.user 
                      ? [log.user.firstName, log.user.lastName].filter(Boolean).join(' ') || log.user.username
                      : log.userEmail || 'System'

                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div className="flex flex-col">
                              <div className="text-sm font-semibold text-gray-900">
                                {log.timestamp.toLocaleDateString('en-PH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {log.timestamp.toLocaleTimeString('en-PH', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                            <ActionIcon className="w-3 h-3 mr-1" />
                            {log.action}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="font-mono text-sm font-medium text-gray-900">{log.tableName}</span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            {log.referenceNumber && (
                              <div className="text-sm font-semibold text-gray-900">{log.referenceNumber}</div>
                            )}
                            {log.transactionType && (
                              <div className="text-xs text-gray-500">{log.transactionType}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-semibold text-gray-900">{userName}</div>
                            {log.userEmail && (
                              <div className="text-xs text-gray-500">{log.userEmail}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {log.notes || "-"}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-center">
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}