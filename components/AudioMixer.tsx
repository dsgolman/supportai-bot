import React, { useEffect, useRef } from 'react'

interface AudioMixerProps {
  localAudioTrack: any
  remoteAudioTracks: any[]
  aiAudioStream: MediaStream
  audioContext: AudioContext
  gainNode: GainNode
}

export default function AudioMixer({
  localAudioTrack,
  remoteAudioTracks,
  aiAudioStream,
  audioContext,
  gainNode,
}: AudioMixerProps) {
  const mixerRef = useRef<any>(null)

  useEffect(() => {
    if (!audioContext || !gainNode) return

    const mixer = audioContext.createGain()
    mixer.connect(gainNode)

    // Connect local audio track
    if (localAudioTrack) {
      const localSource = audioContext.createMediaStreamSource(new MediaStream([localAudioTrack.getMediaStreamTrack()]))
      localSource.connect(mixer)
    }

    // Connect remote audio tracks
    remoteAudioTracks.forEach(track => {
      const remoteSource = audioContext.createMediaStreamSource(new MediaStream([track.getMediaStreamTrack()]))
      remoteSource.connect(mixer)
    })

    // Connect AI audio stream
    const aiSource = audioContext.createMediaStreamSource(aiAudioStream)
    aiSource.connect(mixer)

    mixerRef.current = mixer

    return () => {
      mixer.disconnect()
    }
  }, [localAudioTrack, remoteAudioTracks, aiAudioStream, audioContext, gainNode])

  return null
}