// hooks/useTurnState.ts
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from "@/components/ui/use-toast"

export function useTurnState(groupId: string, userId: string) {
  const [isUserTurn, setIsUserTurn] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [handRaisedAt, setHandRaisedAt] = useState<string | null>(null)
  const [isFacilitator, setIsFacilitator] = useState(false)
  const [isOnStage, setIsOnStage] = useState(false)
  const [queue, setQueue] = useState<Array<{userId: string, handRaisedAt: string}>>([])
  const supabase = createClient()

  const fetchTurnState = useCallback(async () => {
    const { data, error } = await supabase
      .from('group_members')
      .select('is_facilitator, is_on_stage, hand_raised, hand_raised_at')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching turn state:', error)
      toast({
        title: "Error",
        description: "Failed to fetch turn state. Please try again.",
        variant: "destructive",
      })
      return
    }

    setIsFacilitator(data.is_facilitator)
    setIsOnStage(data.is_on_stage)
    setIsHandRaised(data.hand_raised)
    setHandRaisedAt(data.hand_raised_at)
    setIsUserTurn(data.is_on_stage)
  }, [groupId, userId, supabase])

  const fetchQueue = useCallback(async () => {
    const { data, error } = await supabase
      .from('group_members')
      .select('user_id, hand_raised_at')
      .eq('group_id', groupId)
      .eq('hand_raised', true)
      .order('hand_raised_at', { ascending: true })

    if (error) {
      console.error('Error fetching queue:', error)
      toast({
        title: "Error",
        description: "Failed to fetch speaker queue. Please try again.",
        variant: "destructive",
      })
      return
    }

    setQueue(data.map(member => ({ userId: member.user_id, handRaisedAt: member.hand_raised_at })))
  }, [groupId, supabase])

  useEffect(() => {
    fetchTurnState()
    fetchQueue()

    const turnStateChannel = supabase
      .channel(`turn_state:${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` }, 
        () => {
          fetchTurnState()
          fetchQueue()
        }
      )
      .subscribe()

    return () => {
      turnStateChannel.unsubscribe()
    }
  }, [groupId, userId, fetchTurnState, fetchQueue, supabase])

  const raiseHand = useCallback(async () => {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('group_members')
      .update({ hand_raised: true, hand_raised_at: now })
      .eq('group_id', groupId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error raising hand:', error)
      toast({
        title: "Error",
        description: "Failed to raise hand. Please try again.",
        variant: "destructive",
      })
    } else {
      setIsHandRaised(true)
      setHandRaisedAt(now)
      toast({
        title: "Success",
        description: "You have raised your hand.",
      })
    }
  }, [groupId, userId, supabase])

  const lowerHand = useCallback(async () => {
    const { error } = await supabase
      .from('group_members')
      .update({ hand_raised: false, hand_raised_at: null })
      .eq('group_id', groupId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error lowering hand:', error)
      toast({
        title: "Error",
        description: "Failed to lower hand. Please try again.",
        variant: "destructive",
      })
    } else {
      setIsHandRaised(false)
      setHandRaisedAt(null)
      toast({
        title: "Success",
        description: "You have lowered your hand.",
      })
    }
  }, [groupId, userId, supabase])

  const endTurn = useCallback(async () => {
    const { error } = await supabase
      .from('group_members')
      .update({ is_on_stage: false, hand_raised: false, hand_raised_at: null })
      .eq('group_id', groupId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error ending turn:', error)
      toast({
        title: "Error",
        description: "Failed to end your turn. Please try again.",
        variant: "destructive",
      })
    } else {
      setIsOnStage(false)
      setIsHandRaised(false)
      setHandRaisedAt(null)
      setIsUserTurn(false)
      toast({
        title: "Success",
        description: "You have ended your turn.",
      })
    }
  }, [groupId, userId, supabase])

  return {
    isUserTurn,
    isHandRaised,
    handRaisedAt,
    isFacilitator,
    isOnStage,
    queue,
    raiseHand,
    lowerHand,
    endTurn,
    refreshTurnState: fetchTurnState
  }
}