import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getItemEntryById } from "@/lib/actions/item-entry-actions"

import { Loader2 } from "lucide-react"
import { ItemEntryDetailView } from "@/components/items/item-entry-detail-view"

interface ItemEntryDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ItemEntryDetailPage({ params }: ItemEntryDetailPageProps) {
  const { id } = await params
  
  const result = await getItemEntryById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <ItemEntryDetailView initialEntry={result.data} />
    </Suspense>
  )
}