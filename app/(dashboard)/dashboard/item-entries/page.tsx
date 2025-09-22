import { Suspense } from "react"
import { getItemEntries } from "@/lib/actions/item-entry-actions"
import { getWarehouses, getSuppliers } from "@/lib/actions/inventory-actions"

import { Loader2 } from "lucide-react"
import { ItemEntriesView } from "@/components/items/items-entries-view"

export default async function ItemEntriesPage() {
  const [entriesResult, warehousesResult, suppliersResult] = await Promise.allSettled([
    getItemEntries(),
    getWarehouses(),
    getSuppliers()
  ])

  const entries = entriesResult.status === 'fulfilled' && entriesResult.value.success 
    ? entriesResult.value.data || []
    : []

  const stats = entriesResult.status === 'fulfilled' && entriesResult.value.success 
    ? entriesResult.value.stats
    : undefined

  const warehouses = warehousesResult.status === 'fulfilled' && warehousesResult.value.success 
    ? warehousesResult.value.data || []
    : []

  const suppliers = suppliersResult.status === 'fulfilled' && suppliersResult.value.success 
    ? suppliersResult.value.data || []
    : []

  if (entriesResult.status === 'rejected' || !entriesResult.value.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Item Entries</h2>
          <p className="text-gray-600">
            {entriesResult.status === 'fulfilled' ? entriesResult.value.error : 'Failed to load item entry data'}
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
      <ItemEntriesView
        initialEntries={entries}
        initialStats={stats}
        warehouses={warehouses}
        suppliers={suppliers}
      />
    </Suspense>
  )
}