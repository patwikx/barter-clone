import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getWithdrawalById } from "@/lib/actions/withdrawal-actions"
import { WithdrawalDetailView } from "@/components/withdrawals/withdrawal-detail-view"
import { Loader2 } from "lucide-react"

interface WithdrawalDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function WithdrawalDetailPage({ params }: WithdrawalDetailPageProps) {
  const { id } = await params
  
  const result = await getWithdrawalById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <Suspense fallback={
      <div className="w-full bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <WithdrawalDetailView initialWithdrawal={result.data} />
    </Suspense>
  )
}