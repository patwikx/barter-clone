import { Suspense } from "react"
import { getItemsForEntry } from "@/lib/actions/item-entry-actions"
import { getWarehouses, getSuppliers } from "@/lib/actions/inventory-actions"

import { Loader2 } from "lucide-react"
import { ItemEntryCreateView } from "@/components/items/items-entry-create-view"

export default async function CreateItemEntryPage() {
  const [itemsResult, warehousesResult, suppliersResult] = await Promise.allSettled([
    getItemsForEntry(),
    getWarehouses(),
    getSuppliers()
  ])

  const items = itemsResult.status === 'fulfilled' && itemsResult.value.success 
    ? itemsResult.value.data || []
    : []

  const warehouses = warehousesResult.status === 'fulfilled' && warehousesResult.value.success 
    ? warehousesResult.value.data || []
    : []

  const suppliers = suppliersResult.status === 'fulfilled' && suppliersResult.value.success 
    ? suppliersResult.value.data || []
    : []

  if (itemsResult.status === 'rejected' || !itemsResult.value.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600">
            {itemsResult.status === 'fulfilled' ? itemsResult.value.error : 'Failed to load required data'}
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
      <ItemEntryCreateView 
        items={items}
        warehouses={warehouses}
        suppliers={suppliers}
      />
    </Suspense>
  )
}