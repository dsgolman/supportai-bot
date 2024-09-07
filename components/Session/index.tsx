import React, { useCallback, useEffect, useState } from "react";
import { TransportState, VoiceEvent } from "realtime-ai";
import { useVoiceClient, useVoiceClientEvent } from "realtime-ai-react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import TranscriptOverlay from "./TranscriptOverlay";
import { Mic, MicOff, LogOut } from "lucide-react";

interface SessionProps {
  state: string;
  onLeave: () => void;
  openMic?: boolean;
  startAudioOff: boolean;
}

export function Session({ state, onLeave, startAudioOff = false }: SessionProps) {
  const voiceClient = useVoiceClient()!;
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isMicEnabled, setIsMicEnabled] = useState<boolean>(!startAudioOff);

  useEffect(() => {
    if (!hasStarted || startAudioOff) return;
    voiceClient.enableMic(true);
  }, [voiceClient, startAudioOff, hasStarted]);

  useVoiceClientEvent(
    VoiceEvent.BotStoppedSpeaking,
    useCallback(() => {
      if (hasStarted) return;
      setHasStarted(true);
    }, [hasStarted])
  );

  useEffect(() => {
    setHasStarted(false);
  }, []);

  useEffect(() => {
    if (state === "error") {
      onLeave();
    }
  }, [state, onLeave]);

  const toggleMic = () => {
    const newMicState = !isMicEnabled;
    voiceClient.enableMic(newMicState);
    setIsMicEnabled(newMicState);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-sm border-none shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold text-center text-primary">Audio Session</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative h-40 rounded-lg overflow-hidden bg-black/5">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* <VoiceVisualizer 
              participantType="bot" 
              barColor="rgba(var(--primary), 0.7)"
            /> */}
          </div>
        </div>
        <TranscriptOverlay className="bg-white/80 rounded-lg p-4 max-h-100 overflow-y-auto" />
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-2">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMic}
          className={`rounded-full transition-colors ${
            isMicEnabled ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'
          }`}
        >
          {isMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>
        <Button
          variant="destructive"
          onClick={onLeave}
          className="rounded-full px-6 py-2 flex items-center space-x-2"
        >
          <LogOut className="h-5 w-5" />
          <span>Leave Session</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default Session;