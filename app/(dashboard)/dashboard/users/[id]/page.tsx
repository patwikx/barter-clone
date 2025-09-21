import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getUserById } from "@/lib/actions/user-actions"
import { UserDetailView } from "@/components/users/user-detail-view"
import { Loader2 } from "lucide-react"

interface UserDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params
  
  const result = await getUserById(id)

  if (!result.success || !result.user) {
    notFound()
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <UserDetailView initialUser={result.user} />
    </Suspense>
  )
}