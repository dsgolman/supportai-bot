// components/ImmersiveGroupChat.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { useUserState } from '@/hooks/useUserState'
import { useTurnState } from '@/hooks/useTurnState'
import { useAgoraAudio } from '@/hooks/useAgoraAudio'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mic, MicOff, Hand } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { NameDialog } from '@/components/NameDialog'
import { useToast } from "@/components/ui/use-toast"

interface Participant {
  id: string
  name: string
  avatar_url: string
}

interface ImmersiveGroupChatProps {
  groupId: string
}

export default function ImmersiveGroupChat({ groupId }: ImmersiveGroupChatProps) {
  const {
    user,
    isNameModalOpen,
    isFacilitator,
    setIsNameModalOpen,
    handleNameSubmit,
    fetchUserData
  } = useUserState(groupId)

  const [participants, setParticipants] = useState<Participant[]>([])
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  const {
    isUserTurn,
    isHandRaised,
    handRaisedAt,
    isOnStage,
    queue,
    raiseHand,
    lowerHand,
    endTurn,
    refreshTurnState
  } = useTurnState(groupId, user?.id || '')

  const {
    joinChannel,
    leaveChannel,
    toggleAudio,
    isAudioEnabled,
    error: agoraError
  } = useAgoraAudio(groupId)

  useEffect(() => {
    if (agoraError) {
      setError(`Agora error: ${agoraError}`)
    } else {
      setError(null)
    }
  }, [agoraError])

  const fetchParticipants = useCallback(async () => {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        user_id,
        profiles:user_id (full_name, username, avatar_url)
      `)
      .eq('group_id', groupId)

    if (error) {
      console.error('Error fetching participants:', error)
      return
    }

    const formattedParticipants = data.map(member => ({
      id: member.user_id,
      name: member.profiles?.full_name || member.profiles?.username || 'Unknown User',
      avatar_url: member.profiles?.avatar_url || `/placeholder.svg?height=40&width=40`
    }))

    setParticipants(formattedParticipants)
  }, [groupId, supabase])

  useEffect(() => {
    fetchParticipants()
    const intervalId = setInterval(fetchParticipants, 5000) // Refresh participants every 5 seconds
    return () => clearInterval(intervalId)
  }, [fetchParticipants])

  const handleJoinChat = async () => {
    try {
      await joinChannel()
      refreshTurnState()
      toast({
        title: "Joined Chat",
        description: "You have successfully joined the chat.",
      })
    } catch (err) {
      console.error('Error joining chat:', err)
      setError('Failed to join chat. Please try again.')
    }
  }

  const handleLeaveChat = async () => {
    try {
      await leaveChannel()
      endTurn()
      toast({
        title: "Left Chat",
        description: "You have left the chat.",
      })
    } catch (err) {
      console.error('Error leaving chat:', err)
      setError('Failed to leave chat. Please try again.')
    }
  }

  const handleRaiseHand = async () => {
    if (isHandRaised) {
      await lowerHand()
      toast({
        title: "Hand Lowered",
        description: "You have lowered your hand.",
      })
    } else {
      await raiseHand()
      toast({
        title: "Hand Raised",
        description: "You have raised your hand.",
      })
    }
  }

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Immersive Group Chat</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <div className="flex flex-wrap gap-4 mb-4">
            {participants.map((participant) => (
              <div key={participant.id} className="flex flex-col items-center">
                <Avatar>
                  <AvatarImage src={participant.avatar_url} alt={participant.name} />
                  <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm mt-1">{participant.name}</span>
                {queue.find(q => q.userId === participant.id) && (
                  <Hand className="w-4 h-4 text-blue-500 mt-1" />
                )}
                {isOnStage && participant.id === user?.id && (
                  <Mic className="w-4 h-4 text-green-500 mt-1" />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            <Button onClick={isAudioEnabled ? handleLeaveChat : handleJoinChat}>
              {isAudioEnabled ? 'Leave Chat' : 'Join Chat'}
            </Button>
            <Button onClick={toggleAudio} disabled={!isAudioEnabled}>
              {isAudioEnabled ? <Mic /> : <MicOff />}
              {isAudioEnabled ? 'Mute' : 'Unmute'}
            </Button>
            <Button onClick={handleRaiseHand}>
              {isHandRaised ? 'Lower Hand' : 'Raise Hand'}
            </Button>
            {isOnStage && (
              <Button onClick={endTurn}>End Turn</Button>
            )}
          </div>
          {isFacilitator && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Speaker Queue</h3>
              <ul>
                {queue.map((item) => (
                  <li key={item.userId} className="mb-1">
                    {participants.find(p => p.id === item.userId)?.name || 'Unknown User'} - Raised at: {new Date(item.handRaisedAt).toLocaleTimeString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <NameDialog
        isOpen={isNameModalOpen}
        onOpenChange={setIsNameModalOpen}
        onSubmit={handleNameSubmit}
        groupId={groupId}
      />
    </>
  )
}