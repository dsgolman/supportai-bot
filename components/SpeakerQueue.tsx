import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Hand, Mic, FastForward } from 'lucide-react'

interface Participant {
  id: string;
  full_name: string;
  avatar: string;
}

interface SpeakerQueueProps {
  queue: Participant[];
  currentSpeaker: Participant | null;
  onPassTurn: () => void;
  userId: string;
  isSpeakerActive: boolean;
}

export default function SpeakerQueue({ queue, currentSpeaker, onPassTurn, userId, isSpeakerActive }: SpeakerQueueProps) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Speaker Queue</CardTitle>
      </CardHeader>
      <CardContent>
        {currentSpeaker && (
          <div className="flex items-center justify-between mb-4 p-2 bg-amber-100 rounded-md">
            <div className="flex items-center">
              <Mic className="w-5 h-5 mr-2 text-amber-600" />
              <span className="font-semibold">{currentSpeaker.full_name}</span>
            </div>
            {currentSpeaker.id === userId && (
              <Button onClick={onPassTurn} variant="outline" size="sm">
                <FastForward className="w-4 h-4 mr-2" />
                Pass Turn
              </Button>
            )}
          </div>
        )}
        <ScrollArea className="h-40">
          {queue.map((participant, index) => (
            <div key={participant.id} className="flex items-center mb-2">
              <Hand className="w-4 h-4 mr-2 text-yellow-500" />
              <span>{index + 1}. {participant.full_name}</span>
            </div>
          ))}
        </ScrollArea>
        {queue.length === 0 && !currentSpeaker && (
          <p className="text-center text-gray-500">No one in the queue</p>
        )}
      </CardContent>
    </Card>
  )
}