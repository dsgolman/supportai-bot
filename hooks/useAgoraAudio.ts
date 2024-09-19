import { useState, useEffect, useCallback } from 'react'
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, ILocalAudioTrack } from 'agora-rtc-sdk-ng'
import { useToast } from "@/components/ui/use-toast"

export function useAgoraAudio(groupId: string, userId: string, isOnStage: boolean) {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isJoined, setIsJoined] = useState(false)
  const [isTestingAudio, setIsTestingAudio] = useState(false)
  const [testAudioBlob, setTestAudioBlob] = useState<Blob | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const initAgoraClient = async () => {
      try {
        const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
        setClient(agoraClient)

        agoraClient.on('user-published', async (user, mediaType) => {
          await agoraClient.subscribe(user, mediaType)
          if (mediaType === 'audio') {
            user.audioTrack?.play()
            console.log('Remote user audio track:', user.audioTrack)
            
            setInterval(() => {
              const audioLevel = user.audioTrack?.getVolumeLevel()
              console.log(`Remote user ${user.uid} audio level:`, audioLevel)
            }, 1000)
          }
          setRemoteUsers(prevUsers => [...prevUsers, user])
        })

        agoraClient.on('user-unpublished', (user) => {
          setRemoteUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid))
        })

        agoraClient.on('user-left', (user) => {
          setRemoteUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid))
        })

      } catch (err) {
        console.error('Failed to create Agora client:', err)
        setError('Failed to initialize Agora client. Please refresh the page and try again.')
        toast({
          title: "Error",
          description: "Failed to initialize Agora client. Please refresh the page and try again.",
          variant: "destructive",
        })
      }
    }

    void initAgoraClient()

    return () => {
      if (localAudioTrack) {
        localAudioTrack.stop()
        localAudioTrack.close()
      }
      client?.removeAllListeners()
      void client?.leave()
    }
  }, [toast])

  const joinChannel = useCallback(async () => {
    if (!client) {
      setError('Agora client not initialized. Please refresh the page and try again.')
      toast({
        title: "Error",
        description: "Agora client not initialized. Please refresh the page and try again.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/agora-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupId, userId }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const { token, app_id, channel_name, uid } = data

      if (!app_id || !channel_name || !token || !uid) {
        throw new Error('Invalid Agora credentials received from server')
      }

      await client.join(app_id, channel_name, token, uid)
      console.log('Joined to channel')

      setIsJoined(true)
      setError(null)

      toast({
        title: "Success",
        description: "Successfully joined audio channel.",
      })
    } catch (err: unknown) {
      console.error('Error joining Agora channel:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to join audio channel. Please check your internet connection and try again.'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [client, groupId, userId, toast])

  const leaveChannel = useCallback(async () => {
    if (!client) {
      console.log('No active Agora session to leave')
      return
    }

    try {
      if (localAudioTrack) {
        localAudioTrack.stop()
        localAudioTrack.close()
        setLocalAudioTrack(null)
      }
      await client.leave()
      setIsJoined(false)
      setIsAudioEnabled(false)
      setRemoteUsers([])
      setError(null)

      toast({
        title: "Success",
        description: "Successfully left audio channel.",
      })
    } catch (err) {
      console.error('Error leaving Agora channel:', err)
      setError('Failed to leave audio channel properly. Please refresh the page.')
      toast({
        title: "Error",
        description: "Failed to leave audio channel properly. Please refresh the page.",
        variant: "destructive",
      })
    }
  }, [client, localAudioTrack, toast])

  const publishAudio = useCallback(async () => {
    if (!client || !isJoined) {
      console.warn('Cannot publish audio: client not initialized or not joined to channel')
      return
    }

    try {
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
      await client.publish(audioTrack)
      setLocalAudioTrack(audioTrack)
      setIsAudioEnabled(true)
      console.log('Local audio track published:', audioTrack)

      setInterval(() => {
        const audioLevel = audioTrack.getVolumeLevel()
        console.log('Local audio level:', audioLevel)
      }, 1000)

      toast({
        title: "Success",
        description: "Successfully published audio to channel.",
      })
    } catch (err) {
      console.error('Error publishing audio:', err)
      toast({
        title: "Error",
        description: "Failed to publish audio. Please check your microphone permissions and try again.",
        variant: "destructive",
      })
    }
  }, [client, isJoined, toast])

  const unpublishAudio = useCallback(async () => {
    if (!client || !localAudioTrack) {
      console.warn('Cannot unpublish audio: no active audio track')
      return
    }

    try {
      await client.unpublish(localAudioTrack)
      localAudioTrack.stop()
      localAudioTrack.close()
      setLocalAudioTrack(null)
      setIsAudioEnabled(false)
      console.log('Local audio track unpublished')

      toast({
        title: "Success",
        description: "Successfully unpublished audio from channel.",
      })
    } catch (err) {
      console.error('Error unpublishing audio:', err)
      toast({
        title: "Error",
        description: "Failed to unpublish audio. Please try again.",
        variant: "destructive",
      })
    }
  }, [client, localAudioTrack, toast])

  const toggleAudio = useCallback(async () => {
    if (localAudioTrack && isOnStage) {
      try {
        const newEnabledState = !isAudioEnabled
        await localAudioTrack.setEnabled(newEnabledState)
        setIsAudioEnabled(newEnabledState)
        console.log(`Local audio track ${newEnabledState ? 'enabled' : 'disabled'}`)
        toast({
          title: newEnabledState ? "Microphone Enabled" : "Microphone Disabled",
          description: newEnabledState ? "Your microphone is now on." : "Your microphone is now off.",
        })
      } catch (err) {
        console.error('Error toggling audio:', err)
        toast({
          title: "Error",
          description: "Failed to toggle audio. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      console.warn('Attempted to toggle audio, but no local audio track exists or user is not on stage')
      toast({
        title: "Notice",
        description: "Cannot toggle audio. No active microphone found or you are not on stage.",
      })
    }
  }, [localAudioTrack, isAudioEnabled, isOnStage, toast])

  const testAudio = useCallback(async () => {
    if (!localAudioTrack) {
      toast({
        title: "Error",
        description: "No microphone access. Please join the chat and go on stage first.",
        variant: "destructive",
      })
      return
    }

    setIsTestingAudio(true)
    const mediaRecorder = new MediaRecorder(new MediaStream([localAudioTrack.getMediaStreamTrack()]))
    const audioChunks: Blob[] = []

    mediaRecorder.addEventListener('dataavailable', (event) => {
      audioChunks.push(event.data)
    })

    mediaRecorder.addEventListener('stop', () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
      setTestAudioBlob(audioBlob)
      setIsTestingAudio(false)
    })

    mediaRecorder.start()
    
    setTimeout(() => {
      mediaRecorder.stop()
    }, 5000) // Record for 5 seconds
  }, [localAudioTrack, toast])

  const playTestAudio = useCallback(() => {
    if (testAudioBlob) {
      const audio = new Audio(URL.createObjectURL(testAudioBlob))
      void audio.play()
    }
  }, [testAudioBlob])

  useEffect(() => {
    if (isOnStage && isJoined && !localAudioTrack) {
      void publishAudio()
    } else if (!isOnStage && localAudioTrack) {
      void unpublishAudio()
    }
  }, [isOnStage, isJoined, localAudioTrack, publishAudio, unpublishAudio])

  return {
    joinChannel,
    leaveChannel,
    toggleAudio,
    isAudioEnabled,
    remoteUsers,
    error,
    isJoined,
    testAudio,
    playTestAudio,
    isTestingAudio,
    testAudioBlob
  }
}