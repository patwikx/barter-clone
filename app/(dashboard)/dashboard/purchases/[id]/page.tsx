import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getPurchaseById } from "@/lib/actions/purchase-actions"
import { PurchaseDetailView } from "@/components/purchases/purchase-detail-view"
import { Loader2 } from "lucide-react"

interface PurchaseDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PurchaseDetailPage({ params }: PurchaseDetailPageProps) {
  const { id } = await params
  
  const result = await getPurchaseById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <PurchaseDetailView initialPurchase={result.data} />
    </Suspense>
  )
}