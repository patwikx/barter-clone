import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getTransferById } from "@/lib/actions/transfer-actions"
import { TransferDetailView } from "@/components/transfers/transfer-detail-view"
import { Loader2 } from "lucide-react"

interface TransferDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TransferDetailPage({ params }: TransferDetailPageProps) {
  const { id } = await params
  
  const result = await getTransferById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <TransferDetailView initialTransfer={result.data} />
    </Suspense>
  )
}