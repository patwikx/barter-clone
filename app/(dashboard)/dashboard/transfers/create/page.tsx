import { Suspense } from "react"
import { getWarehousesForTransfer } from "@/lib/actions/transfer-actions"
import { TransferCreateView } from "@/components/transfers/transfer-create-view"
import { Loader2 } from "lucide-react"

export default async function CreateTransferPage() {
  const warehousesResult = await getWarehousesForTransfer()

  const warehouses = warehousesResult.success 
    ? warehousesResult.data || []
    : []

  if (!warehousesResult.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600">
            {warehousesResult.error || 'Failed to load warehouses data'}
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
      <TransferCreateView warehouses={warehouses} />
    </Suspense>
  )
}