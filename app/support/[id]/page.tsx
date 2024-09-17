// app/groups/[id]/page.tsx
'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import ImmersiveGroupChat from '@/components/ImmersiveGroupChat'
import { NameDialog } from '@/components/NameDialog'
import { useUserState } from '@/hooks/useUserState'
import { useToast } from "@/components/ui/use-toast"

interface GroupChatPageProps {
  params: { id: string }
}

export default function GroupChatPage({ params }: GroupChatPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const {
    user,
    isNameModalOpen,
    isFacilitator,
    setIsNameModalOpen,
    handleNameSubmit,
    fetchUserData
  } = useUserState(params.id)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else if (!user) {
        // If there's a session but no user, we need to open the name dialog
        console.log('No user data, opening name dialog')
        setIsNameModalOpen(true)
      }
    }
    checkSession()
  }, [router, supabase.auth, user, setIsNameModalOpen])

  useEffect(() => {
    console.log('isNameModalOpen changed:', isNameModalOpen)
  }, [isNameModalOpen])

  if (!user && !isNameModalOpen) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Group Chat</h1>
      {user && (
        <ImmersiveGroupChat
          groupId={params.id}
          userId={user.id}
          username={user.full_name}
        />
      )}
      <NameDialog
        isOpen={isNameModalOpen}
        onOpenChange={setIsNameModalOpen}
        onSubmit={handleNameSubmit}
        groupId={params.id}
      />
    </div>
  )
}