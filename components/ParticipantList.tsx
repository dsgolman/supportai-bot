'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import MessageList from '@/components/MessageList'
import AudioControls from '@/components/AudioControls'
import ParticipantList from '@/components/ParticipantList'
import { useTurnState } from '@/hooks/useTurnState'
import { useWebSocketAudio } from '@/hooks/useWebSocketAudio'

interface ImmersiveGroupChatProps {
  groupId: string
  userId: string
  username: string
}

export default function ImmersiveGroupChat({ groupId, userId, username }: ImmersiveGroupChatProps) {
  const [messages, setMessages] = useState([])
  const [chatStatus, setChatStatus] = useState('connecting')
  const [chatMetadata, setChatMetadata] = useState(null)
  const { 
    isUserTurn, 
    isHandRaised, 
    isFacilitator, 
    isOnStage,
    queue, 
    raiseHand, 
    lowerHand, 
    endTurn,
    refreshTurnState
  } = useTurnState(groupId, userId)
  const { 
    isAudioEnabled, 
    toggleAudio, 
    startAudioStream, 
    stopAudioStream,
    sendAudioChunk
  } = useWebSocketAudio(groupId, userId)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const initializeChat = useCallback(async () => {
    if (!userId) return

    try {
      const resumeChatGroupId = chatMetadata?.chat_group_id

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          groupId,
          resume_chat_group_id: resumeChatGroupId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to initialize chat')
      }

      const data = await response.json()
      console.log('Chat initialization response:', data)

      setChatStatus('connected')
      setChatMetadata(data.chatGroupId ? { chat_group_id: data.chatGroupId } : null)
      
      refreshTurnState()
    } catch (error) {
      console.error('Error initializing chat:', error)
      toast({
        title: "Error",
        description: "Failed to initialize chat. Please try again.",
        variant: "destructive",
      })
    }
  }, [userId, groupId, chatMetadata, setChatStatus, setChatMetadata, toast, refreshTurnState])

  useEffect(() => {
    initializeChat()
  }, [initializeChat])

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        return
      }

      setMessages(data)
    }

    fetchMessages()

    const messagesChannel = supabase
      .channel(`messages:${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` }, 
        payload => {
          setMessages(currentMessages => [...currentMessages, payload.new])
        }
      )
      .subscribe()

    return () => {
      messagesChannel.unsubscribe()
    }
  }, [groupId, supabase])

  const handleStartSpeaking = useCallback(async () => {
    if (isOnStage) {
      await startAudioStream()
    } else {
      toast({
        title: "Error",
        description: "You need to be on stage to speak.",
        variant: "destructive",
      })
    }
  }, [isOnStage, startAudioStream, toast])

  const handleStopSpeaking = useCallback(async () => {
    await stopAudioStream()
    if (isUserTurn) {
      endTurn()
    }
  }, [isUserTurn, endTurn, stopAudioStream])

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-grow overflow-y-auto">
        <MessageList messages={messages} currentUserId={userId} />
      </div>
      <div className="p-4 bg-gray-100">
        <AudioControls
          isAudioEnabled={isAudioEnabled}
          toggleAudio={toggleAudio}
          startSpeaking={handleStartSpeaking}
          stopSpeaking={handleStopSpeaking}
          isOnStage={isOnStage}
          isFacilitator={isFacilitator}
        />
        <div className="mt-4 flex justify-between">
          {!isOnStage && !isFacilitator && (
            <Button 
              onClick={isHandRaised ? lowerHand : raiseHand}
              variant={isHandRaised ? "secondary" : "outline"}
            >
              {isHandRaised ? 'Lower Hand' : 'Raise Hand'}
            </Button>
          )}
          {isOnStage && !isFacilitator && (
            <Button onClick={endTurn} variant="secondary">
              Leave Stage
            </Button>
          )}
        </div>
      </div>
      <ParticipantList groupId={groupId} currentUserId={userId} />
    </div>
  )
}