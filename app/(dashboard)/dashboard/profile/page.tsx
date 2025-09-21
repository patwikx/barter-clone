import { Suspense } from "react"
import { auth } from "@/auth"
import { getUserById } from "@/lib/actions/user-actions"
import { ProfileView } from "@/components/profile/profile-view"
import { Loader2 } from "lucide-react"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/")
  }

  const userResult = await getUserById(session.user.id)

  if (!userResult.success || !userResult.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600">
            {userResult.error || 'Failed to load user profile'}
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
      <ProfileView initialUser={userResult.user} />
    </Suspense>
  )
}