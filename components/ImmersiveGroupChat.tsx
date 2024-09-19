import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAgoraAudio } from '@/hooks/useAgoraAudio'
import { useWebSocketAudio } from '@/hooks/useWebSocketAudio'
import { useUserState } from '@/hooks/useUserState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import AudioCapture from '@/components/AudioCapture'
import ParticipantList from '@/components/ParticipantList'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng'

interface ImmersiveGroupChatProps {
  groupId: string
  userId: string
  configId: string
}

interface Participant {
  id: string
  display_name: string
  isOnStage: boolean
  handRaised: boolean
  isSpeaking: boolean
}

const ImmersiveGroupChat: React.FC<ImmersiveGroupChatProps> = ({ groupId, userId, configId }) => {
  const { toast } = useToast()
  const [message, setMessage] = useState('')
  const [isTurnActive, setIsTurnActive] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)

  const {
    user,
    participant,
    isNameModalOpen,
    setIsNameModalOpen,
    handleNameSubmit,
    fetchUserData,
  } = useUserState(groupId)

  const {
    toggleAudio,
    isAudioEnabled,
    remoteUsers,
    error: agoraError,
    isJoined,
  } = useAgoraAudio(groupId, userId, participant?.is_on_stage || false)

  const {
    initializeChat,
    sendUserInput,
    closeChat,
    chatStatus,
    chatGroupId,
    error: websocketError,
    isAIAudioEnabled,
    toggleAIAudio,
    aiAudioStream,
    isChatStarted,
    startChat,
    assistantMessage,
    audioOutput,
  } = useWebSocketAudio(groupId, userId)

  const mappedParticipants = useMemo(() => {
    const localParticipant: Participant = {
      id: userId,
      display_name: user?.display_name || `User ${userId}`,
      isOnStage: participant?.is_on_stage || false,
      handRaised: isHandRaised,
      isSpeaking: isAudioEnabled,
    };

    const remoteParticipants = remoteUsers.map((user: IAgoraRTCRemoteUser) => ({
      id: user.uid.toString(),
      display_name: `User ${user.uid}`,
      isOnStage: true,
      handRaised: false, // We'll need to implement a way to track this for remote users
      isSpeaking: user.hasAudio,
    }));

    return [localParticipant, ...remoteParticipants];
  }, [remoteUsers, userId, user, participant, isHandRaised, isAudioEnabled]);

  useEffect(() => {
    if (agoraError) {
      toast({
        title: "Agora Error",
        description: agoraError,
        variant: "destructive",
      })
    }
    if (websocketError) {
      toast({
        title: "WebSocket Error",
        description: websocketError,
        variant: "destructive",
      })
    }
  }, [agoraError, websocketError, toast])

  useEffect(() => {
    // Initialize chat when component mounts
    initializeChat();
  }, [initializeChat]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      await sendUserInput(message)
      setMessage('')
    }
  }, [message, sendUserInput])

  const handleEndTurn = useCallback(() => {
    setIsTurnActive(false)
    // Additional logic for ending the turn
  }, [])

  const handleRaiseHand = useCallback(() => {
    setIsHandRaised(prev => !prev)
    // TODO: Implement logic to notify other participants about the hand raise
  }, [])

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-primary text-primary-foreground p-4">
        <h1 className="text-2xl font-bold">Immersive Group Chat</h1>
        <p className="text-sm">Group ID: {groupId} | Config ID: {configId}</p>
      </header>
      <main className="flex-grow flex">
        <div className="w-3/4 p-4 flex flex-col">
          <div className="flex-grow bg-secondary p-4 rounded-lg mb-4 overflow-y-auto">
            {assistantMessage && (
              <div className="bg-primary/10 p-2 rounded mb-2">
                <p className="font-semibold">Assistant:</p>
                <p>{assistantMessage}</p>
              </div>
            )}
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow"
            />
            <Button type="submit">Send</Button>
          </form>
        </div>
        <div className="w-1/4 bg-secondary p-4">
          <ParticipantList participants={mappedParticipants} />
          <div className="mt-4 space-y-2">
            {isJoined && (
              <>
                <Button onClick={toggleAudio} className="w-full">
                  {isAudioEnabled ? 'Mute' : 'Unmute'}
                </Button>
                <Button onClick={toggleAIAudio} className="w-full">
                  {isAIAudioEnabled ? 'Disable AI Audio' : 'Enable AI Audio'}
                </Button>
                <Button onClick={handleRaiseHand} className="w-full">
                  {isHandRaised ? 'Lower Hand' : 'Raise Hand'}
                </Button>
              </>
            )}
          </div>
          <AudioCapture
            groupId={groupId}
            userId={userId}
            isOnStage={participant?.is_on_stage || false}
            isTurnActive={isTurnActive}
            onEndTurn={handleEndTurn}
          />
        </div>
      </main>
      {(agoraError || websocketError) && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            {agoraError || websocketError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default ImmersiveGroupChat