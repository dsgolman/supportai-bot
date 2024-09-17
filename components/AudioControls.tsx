import React from 'react'
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react"

interface AudioControlsProps {
  isUserAudioEnabled: boolean
  toggleUserAudio: () => void
  isAIAudioEnabled: boolean
  toggleAIAudio: () => void
  startSpeaking: () => void
  stopSpeaking: () => void
  isOnStage: boolean
  isFacilitator: boolean
}

export default function AudioControls({
  isUserAudioEnabled,
  toggleUserAudio,
  isAIAudioEnabled,
  toggleAIAudio,
  startSpeaking,
  stopSpeaking,
  isOnStage,
  isFacilitator
}: AudioControlsProps) {
  return (
    <div className="flex space-x-2">
      <Button
        onClick={toggleUserAudio}
        variant={isUserAudioEnabled ? "default" : "secondary"}
        size="icon"
        aria-label={isUserAudioEnabled ? "Mute" : "Unmute"}
      >
        {isUserAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </Button>
      {(isOnStage || isFacilitator) && (
        <Button
          onClick={isUserAudioEnabled ? stopSpeaking : startSpeaking}
          variant="outline"
        >
          {isUserAudioEnabled ? "Stop Speaking" : "Start Speaking"}
        </Button>
      )}
      <Button
        onClick={toggleAIAudio}
        variant={isAIAudioEnabled ? "default" : "secondary"}
        size="icon"
        aria-label={isAIAudioEnabled ? "Mute AI" : "Unmute AI"}
      >
        {isAIAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </Button>
    </div>
  )
}