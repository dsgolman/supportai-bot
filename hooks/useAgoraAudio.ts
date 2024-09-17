// hooks/useAgoraAudio.ts
import { useState, useEffect, useCallback } from 'react'
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, ILocalAudioTrack } from 'agora-rtc-sdk-ng'
import { createClient } from '@/utils/supabase/client'

export function useAgoraAudio(groupId: string) {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const initAgoraClient = async () => {
      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      setClient(agoraClient)
    }

    initAgoraClient()
  }, [])

  const joinChannel = useCallback(async () => {
    if (!client) {
      setError('Agora client not initialized')
      return
    }

    try {
      const { data, error } = await supabase.rpc('get_agora_token', { group_id: groupId })
      if (error) throw error

      const { appId, channel, token, uid } = data

      await client.join(appId, channel, token, uid)
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
      await client.publish(audioTrack)
      setLocalAudioTrack(audioTrack)
      setIsAudioEnabled(true)
      setError(null)
    } catch (err) {
      console.error('Error joining Agora channel:', err)
      setError('Failed to join audio channel')
    }
  }, [client, groupId, supabase])

  const leaveChannel = useCallback(async () => {
    if (!client || !localAudioTrack) return

    localAudioTrack.stop()
    localAudioTrack.close()
    await client.leave()
    setLocalAudioTrack(null)
    setIsAudioEnabled(false)
    setError(null)
  }, [client, localAudioTrack])

  const toggleAudio = useCallback(() => {
    if (localAudioTrack) {
      if (isAudioEnabled) {
        localAudioTrack.setEnabled(false)
      } else {
        localAudioTrack.setEnabled(true)
      }
      setIsAudioEnabled(!isAudioEnabled)
    }
  }, [localAudioTrack, isAudioEnabled])

  useEffect(() => {
    return () => {
      if (localAudioTrack) {
        localAudioTrack.stop()
        localAudioTrack.close()
      }
      client?.leave()
    }
  }, [client, localAudioTrack])

  return {
    joinChannel,
    leaveChannel,
    toggleAudio,
    isAudioEnabled,
    error
  }
}