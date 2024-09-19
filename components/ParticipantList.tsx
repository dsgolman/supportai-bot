import React from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Hand, Mic, MicOff } from "lucide-react"

interface Participant {
  id: string
  display_name: string
  isOnStage: boolean
  handRaised: boolean
  isSpeaking: boolean
  avatarUrl?: string
}

interface ParticipantListProps {
  participants: Participant[]
}

export default function ParticipantList({ participants = [] }: ParticipantListProps) {
  const onStageParticipants = participants.filter(p => p.isOnStage)
  const offStageParticipants = participants.filter(p => !p.isOnStage)

  return (
    <div className="w-full max-w-sm border rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Participants ({participants.length})</h2>
      </div>
      <ScrollArea className="h-[400px]">
        {onStageParticipants.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">On Stage</h3>
            {onStageParticipants.map(participant => (
              <ParticipantItem key={participant.id} participant={participant} />
            ))}
          </div>
        )}
        {offStageParticipants.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Off Stage</h3>
            {offStageParticipants.map(participant => (
              <ParticipantItem key={participant.id} participant={participant} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function ParticipantItem({ participant }: { participant: Participant }) {
  return (
    <div className="flex items-center space-x-4 mb-4">
      <Avatar>
        <AvatarImage src={participant.avatarUrl} alt={participant.display_name} />
        <AvatarFallback>{participant.display_name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {participant.display_name}
        </p>
        <div className="flex items-center space-x-2">
          {participant.isOnStage && (
            <Badge variant="secondary" className="text-xs">
              On Stage
            </Badge>
          )}
          {participant.handRaised && (
            <Hand className="h-4 w-4 text-blue-500" />
          )}
          {participant.isSpeaking ? (
            <Mic className="h-4 w-4 text-green-500" />
          ) : (
            <MicOff className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  )
}