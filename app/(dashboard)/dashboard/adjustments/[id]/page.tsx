import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getAdjustmentById } from "@/lib/actions/adjustments-actions"
import { AdjustmentDetailView } from "@/components/adjustments/adjustment-detail-view"
import { Loader2 } from "lucide-react"

interface AdjustmentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AdjustmentDetailPage({ params }: AdjustmentDetailPageProps) {
  const { id } = await params
  
  const result = await getAdjustmentById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <AdjustmentDetailView initialAdjustment={result.data} />
    </Suspense>
  )
}