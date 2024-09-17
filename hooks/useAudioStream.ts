import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import AgoraRTC from 'agora-rtc-sdk-ng'

export function useAudioStream(groupId: string, userId: string) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [audioTrack, setAudioTrack] = useState<any>(null)
  const [client, setClient] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const initAgoraClient = async () => {
      const { data: credentials, error } = await supabase
        .from('agora_credentials')
        .select('app_id, channel_name, token')
        .eq('group_id', groupId)
        .single()

      if (error) {
        console.error('Error fetching Agora credentials:', error)
        return
      }

      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      await agoraClient.join(credentials.app_id, credentials.channel_name, credentials.token, userId)
      setClient(agoraClient)

      return () => {
        agoraClient.leave()
      }
    }

    initAgoraClient()
  }, [groupId, userId, supabase])

  const startAudioStream = useCallback(async () => {
    if (!client) return

    try {
      const microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack()
      await client.publish(microphoneTrack)
      setAudioTrack(microphoneTrack)
      setIsAudioEnabled(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }, [client])

  const stopAudioStream = useCallback(() => {
    if (audioTrack) {
      client.unpublish(audioTrack)
      audioTrack.stop()
      audioTrack.close()
      setAudioTrack(null)
      setIsAudioEnabled(false)
    }
  }, [audioTrack, client])

  const toggleAudio = useCallback(() => {
    if (isAudioEnabled) {
      stopAudioStream()
    } else {
      startAudioStream()
    }
  }, [isAudioEnabled, startAudioStream, stopAudioStream])

  useEffect(() => {
    return () => {
      if (audioTrack) {
        audioTrack.stop()
        audioTrack.close()
      }
    }
  }, [audioTrack])

  return {
    isAudioEnabled,
    toggleAudio,
    startAudioStream,
    stopAudioStream
  }
}