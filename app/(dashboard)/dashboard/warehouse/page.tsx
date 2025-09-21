import { Suspense } from "react"
import { getWarehouses } from "@/lib/actions/warehouse-actions"
import { WarehousesView } from "@/components/warehouse/warehouse-view"
import { Loader2 } from "lucide-react"

export default async function WarehousesPage() {
  const result = await getWarehouses()

  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Warehouses</h2>
          <p className="text-gray-600">{result.error}</p>
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
      <WarehousesView initialWarehouses={result.data || []} />
    </Suspense>
  )
}