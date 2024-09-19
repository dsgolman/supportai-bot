// hooks/useTurnState.ts
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from "@/components/ui/use-toast"

interface QueueItem {
  userId: string;
  handRaisedAt: string;
}

export function useTurnState(groupId: string, userId: string) {
  const [isOnStage, setIsOnStage] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [handRaisedAt, setHandRaisedAt] = useState<string | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const supabase = createClient()
  const { toast } = useToast()

  const fetchTurnState = useCallback(async () => {
    if (!groupId || !userId) {
      console.log('GroupId or UserId is missing, skipping fetch')
      return
    }

    try {
      const { data, error } = await supabase
        .from('group_participants')
        .select('is_on_stage, hand_raised, hand_raised_at')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single()

      if (error) throw error

      setIsOnStage(data.is_on_stage)
      setIsHandRaised(data.hand_raised)
      setHandRaisedAt(data.hand_raised_at)
    } catch (error) {
      console.error('Error fetching turn state:', error)
      toast({
        title: "Error",
        description: "Failed to fetch turn state. Please try again.",
        variant: "destructive",
      })
    }
  }, [supabase, groupId, userId, toast])

  const fetchQueue = useCallback(async () => {
    if (!groupId) {
      console.log('GroupId is missing, skipping fetch')
      return
    }

    try {
      const { data, error } = await supabase
        .from('group_participants')
        .select('user_id, hand_raised_at')
        .eq('group_id', groupId)
        .eq('hand_raised', true)
        .order('hand_raised_at', { ascending: true })

      if (error) throw error

      setQueue(data.map(item => ({ userId: item.user_id, handRaisedAt: item.hand_raised_at })))
    } catch (error) {
      console.error('Error fetching queue:', error)
      toast({
        title: "Error",
        description: "Failed to fetch queue. Please try again.",
        variant: "destructive",
      })
    }
  }, [supabase, groupId, toast])

  useEffect(() => {
    if (groupId && userId) {
      fetchTurnState()
      fetchQueue()

      const turnStateChannel = supabase
        .channel('turn_state_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'group_participants',
          filter: `group_id=eq.${groupId}`
        }, () => {
          fetchTurnState()
          fetchQueue()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(turnStateChannel)
      }
    }
  }, [fetchTurnState, fetchQueue, supabase, groupId, userId])

  const raiseHand = useCallback(async () => {
    if (!groupId || !userId) {
      console.log('GroupId or UserId is missing, cannot raise hand')
      return
    }

    try {
      const { error } = await supabase
        .from('group_participants')
        .update({ 
          hand_raised: true, 
          hand_raised_at: new Date().toISOString() 
        })
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) throw error

      toast({
        title: "Success",
        description: "You have raised your hand.",
      })
    } catch (error) {
      console.error('Error raising hand:', error)
      toast({
        title: "Error",
        description: "Failed to raise hand. Please try again.",
        variant: "destructive",
      })
    }
  }, [supabase, groupId, userId, toast])

  const lowerHand = useCallback(async () => {
    if (!groupId || !userId) {
      console.log('GroupId or UserId is missing, cannot lower hand')
      return
    }

    try {
      const { error } = await supabase
        .from('group_participants')
        .update({ 
          hand_raised: false, 
          hand_raised_at: null 
        })
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) throw error

      toast({
        title: "Success",
        description: "You have lowered your hand.",
      })
    } catch (error) {
      console.error('Error lowering hand:', error)
      toast({
        title: "Error",
        description: "Failed to lower hand. Please try again.",
        variant: "destructive",
      })
    }
  }, [supabase, groupId, userId, toast])

  const endTurn = useCallback(async () => {
    if (!groupId || !userId) {
      console.log('GroupId or UserId is missing, cannot end turn')
      return
    }

    try {
      const { error } = await supabase
        .from('group_participants')
        .update({ 
          is_on_stage: false, 
          last_turn_ended_at: new Date().toISOString() 
        })
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) throw error

      toast({
        title: "Success",
        description: "You have ended your turn.",
      })
    } catch (error) {
      console.error('Error ending turn:', error)
      toast({
        title: "Error",
        description: "Failed to end turn. Please try again.",
        variant: "destructive",
      })
    }
  }, [supabase, groupId, userId, toast])

  return {
    isOnStage,
    isHandRaised,
    handRaisedAt,
    queue,
    raiseHand,
    lowerHand,
    endTurn,
    refreshTurnState: fetchTurnState,
  }
}