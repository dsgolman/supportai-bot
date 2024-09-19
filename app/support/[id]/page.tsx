'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import ImmersiveGroupChat from '@/components/ImmersiveGroupChat'
import { NameDialog } from '@/components/NameDialog'
import { useUserState } from '@/hooks/useUserState'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface PageProps {
  params: { id: string }
}

interface GroupData {
  config_id: string
}

function GroupChatPage({ params }: PageProps): JSX.Element {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [groupData, setGroupData] = useState<GroupData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    user,
    isNameModalOpen,
    setIsNameModalOpen,
    handleNameSubmit,
    fetchUserData
  } = useUserState(params.id)

  const fetchGroupData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('config_id')
        .eq('id', params.id)
        .single()

      if (error) {
        throw error
      }

      setGroupData(data as GroupData)
    } catch (error) {
      console.error('Error fetching group data:', error)
      setError('Failed to load group data. Please try again.')
    }
  }, [supabase, params.id])

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
        } else {
          await Promise.all([fetchUserData(), fetchGroupData()])
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setError('Failed to authenticate. Please log in again.')
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    void checkSession()
  }, [router, supabase.auth, fetchUserData, fetchGroupData])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-32 w-32 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Alert className="max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!user || !groupData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Alert className="max-w-md">
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>User or group data is not available. Please try again later.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-foreground">Group Chat</h1>
        <ImmersiveGroupChat 
          groupId={params.id} 
          userId={user.id} 
          configId={groupData.config_id}
        />
        <NameDialog
          isOpen={isNameModalOpen}
          onOpenChange={setIsNameModalOpen}
          onSubmit={handleNameSubmit}
          groupId={params.id}
        />
      </main>
    </div>
  )
}

export default GroupChatPage