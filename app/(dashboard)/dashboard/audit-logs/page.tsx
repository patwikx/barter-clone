import { Suspense } from "react"
import { getAuditLogs } from "@/lib/actions/audit-actions"
import { AuditLogsView } from "@/components/audit/audit-logs-view"
import { Loader2 } from "lucide-react"

export default async function AuditLogsPage() {
  const auditResult = await getAuditLogs()

  const auditLogs = auditResult.success 
    ? auditResult.data || []
    : []

  if (!auditResult.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Audit Logs</h2>
          <p className="text-gray-600">
            {auditResult.error || 'Failed to load audit logs'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <AuditLogsView initialAuditLogs={auditLogs} />
    </Suspense>
  )
}