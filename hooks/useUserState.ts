// hooks/useUserState.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from "@/components/ui/use-toast"

export function useUserState(groupId: string) {
  const [user, setUser] = useState<any>(null)
  const [isNameModalOpen, setIsNameModalOpen] = useState(false)
  const [isFacilitator, setIsFacilitator] = useState(false)
  const supabase = createClient()
  const isInitialMount = useRef(true)
  const isFetchingUserData = useRef(false)
  const { toast } = useToast()

  const fetchUserData = useCallback(async () => {
    if (isFetchingUserData.current) return
    isFetchingUserData.current = true

    try {
      console.log("Checking user and fetching profile...")
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        console.log("Session found, fetching group member data")
        const { data: groupMemberData, error: groupMemberError } = await supabase
          .from('group_members')
          .select('*, profiles:user_id(full_name, username)')
          .eq('user_id', session.user.id)
          .eq('group_id', groupId)
          .single()

        if (groupMemberError) {
          console.log("User not in group, opening NameDialog")
          setIsNameModalOpen(true)
        } else if (groupMemberData) {
          setUser({ ...session.user, ...groupMemberData, ...groupMemberData.profiles })
          setIsFacilitator(groupMemberData.role === 'facilitator')
        }
      } else {
        console.log("No session found, opening NameDialog")
        setIsNameModalOpen(true)
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
  }, [supabase, groupId, toast])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      fetchUserData()
    }
  }, [fetchUserData])

  useEffect(() => {
    console.log('isNameModalOpen changed in useUserState:', isNameModalOpen)
  }, [isNameModalOpen])

  const handleNameSubmit = useCallback(async (userId: string, firstName: string, lastInitial: string) => {
    try {
      const fullName = `${firstName} ${lastInitial}.`
      
      // Update or insert the user's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: userId, full_name: fullName, username: fullName.toLowerCase().replace(' ', '') })

      if (profileError) throw profileError

      // Insert the user into the group_members table
      const { data, error: groupMemberError } = await supabase
        .from('group_members')
        .insert({ user_id: userId, group_id: groupId, role: 'member' })
        .select('*')
        .single()

      if (groupMemberError) throw groupMemberError

      setUser({ id: userId, ...data, full_name: fullName })
      setIsFacilitator(data.role === 'facilitator')
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
    isNameModalOpen,
    isFacilitator,
    setIsNameModalOpen,
    handleNameSubmit,
    fetchUserData,
  }
}