import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

interface GroupParticipant {
  id: string;
  group_id: string;
  user_id: string;
  display_name: string;
  is_facilitator: boolean;
  is_active: boolean;
  is_on_stage: boolean;
  hand_raised: boolean;
  hand_raised_at: string | null;
  last_turn_ended_at: string | null;
}

export function useUserState(groupId: string) {
  const [user, setUser] = useState<User | null>(null)
  const [participant, setParticipant] = useState<GroupParticipant | null>(null)
  const [isNameModalOpen, setIsNameModalOpen] = useState(false)
  const supabase = createClient()
  const isInitialMount = useRef(true)
  const isFetchingUserData = useRef(false)
  const { toast } = useToast()
  const router = useRouter()

  const fetchUserData = useCallback(async () => {
    if (isFetchingUserData.current) return
    isFetchingUserData.current = true

    try {
      console.log("Checking user and fetching profile...")
      const { data: { user }, error: sessionError } = await supabase.auth.getUser()
      if (sessionError) throw sessionError

      if (user) {
        console.log("Session found, fetching group participant data")
        const { data: participantData, error: participantError } = await supabase
          .from('group_participants')
          .select('*')
          .eq('user_id', user.id)
          .eq('group_id', groupId)
          .single()

        if (participantError) {
          if (participantError.code === 'PGRST116') {
            console.log("User not in group, opening NameDialog")
            setUser(user)
            setIsNameModalOpen(true)
          } else {
            throw participantError
          }
        } else if (participantData) {
          setUser(user)
          setParticipant(participantData)
        }
      } else {
        console.log("No session found, redirecting to login")
        void router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch user data. Please try again.",
        variant: "destructive",
      })
    } finally {
      isFetchingUserData.current = false
    }
  }, [supabase, groupId, toast, router])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      void fetchUserData()
    }
  }, [fetchUserData])

  const handleNameSubmit = useCallback(async (displayName: string) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        throw new Error('No authenticated user')
      }

      const { data, error: participantError } = await supabase
        .from('group_participants')
        .upsert({ 
          user_id: currentUser.id, 
          group_id: groupId, 
          display_name: displayName,
          is_active: true,
        })
        .select()
        .single()

      if (participantError) throw participantError

      setUser(currentUser)
      setParticipant(data)
      setIsNameModalOpen(false)

      toast({
        title: "Success",
        description: "You have successfully joined the group.",
      })
    } catch (error) {
      console.error('Error updating user data:', error)
      toast({
        title: "Error",
        description: "Failed to update user data. Please try again.",
        variant: "destructive",
      })
    }
  }, [supabase, groupId, toast])

  return {
    user,
    participant,
    isNameModalOpen,
    setIsNameModalOpen,
    handleNameSubmit,
    fetchUserData,
  }
}