// hooks/useChatState.ts
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from "@/components/ui/use-toast"
import { Message, Participant, TurnState, ChatMetadata } from '@/types'

export function useChatState(groupId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [turnState, setTurnState] = useState<TurnState>({ current_user_id: null, queue: [], turn_start_time: null })
  const [chatStatus, setChatStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [chatMetadata, setChatMetadata] = useState<ChatMetadata | null>(null)
  const supabase = createClient()
  
  const channelsRef = useRef<any[]>([])

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchMessages()
      await fetchParticipants()
      subscribeToMessages()
      subscribeToTurnChanges()
      subscribeToParticipants()
    }

    fetchInitialData()

    return () => {
      channelsRef.current.forEach(channel => {
        if (channel && channel.unsubscribe) {
          channel.unsubscribe()
        }
      })
    }
  }, [groupId])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })

      if (error) {
        throw error
      }

      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast({
        title: "Error",
        description: "Failed to fetch messages. Please try again later.",
        variant: "destructive",
      })
    }
  }

  const fetchParticipants = async () => {
    try {
      const { data: groupMembers, error: groupMembersError } = await supabase
        .from('group_members')
        .select('user_id, is_facilitator')
        .eq('group_id', groupId)

      if (groupMembersError) {
        throw groupMembersError
      }

      const humanUserIds = groupMembers
        .filter(member => !member.is_facilitator && member.user_id !== null)
        .map(member => member.user_id)

      let profiles: any[] = []
      if (humanUserIds.length > 0) {
        const { data: profileData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', humanUserIds)

        if (profilesError) {
          throw profilesError
        }
        profiles = profileData
      }

      const participantsData = groupMembers.map(member => {
        if (member.is_facilitator) {
          return {
            id: `ai-${member.user_id}`,
            username: 'AI Assistant',
            is_facilitator: true,
            is_speaking: turnState.current_user_id === `ai-${member.user_id}`,
          }
        } else {
          const profile = profiles.find(p => p.id === member.user_id)
          return {
            id: member.user_id!,
            username: profile?.username || 'Anonymous',
            is_facilitator: false,
            is_speaking: turnState.current_user_id === member.user_id,
          }
        }
      })

      setParticipants(participantsData)
    } catch (error) {
      console.error('Error fetching participants:', error)
      toast({
        title: "Error",
        description: "Failed to fetch participants. Please try again later.",
        variant: "destructive",
      })
    }
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`realtime-messages-${groupId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `group_id=eq.${groupId}` 
        }, 
        (payload) => {
          console.log('New message received:', payload.new)
          const newMessage = payload.new as Message
          setMessages((prevMessages) => {
            if (!prevMessages.some(msg => msg.id === newMessage.id)) {
              return [...prevMessages, newMessage]
            }
            return prevMessages
          })
        }
      )
      .subscribe()

    channelsRef.current.push(channel)
  }

  const subscribeToTurnChanges = () => {
    const turnChannel = supabase
      .channel(`turn-changes-${groupId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_turns',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          console.log('Turn state changed:', payload.new)
          const newTurnState = payload.new as TurnState
          setTurnState(newTurnState)
        }
      )
      .subscribe()

    channelsRef.current.push(turnChannel)
  }

  const subscribeToParticipants = () => {
    const participantsChannel = supabase
      .channel(`participants-${groupId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`
        },
        () => {
          fetchParticipants()
        }
      )
      .subscribe()

    channelsRef.current.push(participantsChannel)
  }

  return {
    messages,
    participants,
    turnState,
    chatStatus,
    chatMetadata,
    setMessages,
    setParticipants,
    setTurnState,
    setChatStatus,
    setChatMetadata,
  }
}