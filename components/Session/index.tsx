import React, { useCallback, useEffect, useState } from "react";
import { TransportState, VoiceEvent } from "realtime-ai";
import { useVoiceClient, useVoiceClientEvent, VoiceVisualizer } from "realtime-ai-react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import TranscriptOverlay from "./TranscriptOverlay"

interface SessionProps {
  state: string;
  onLeave: () => void;
  openMic?: boolean;
  startAudioOff: boolean;
}

export function Session({ state, onLeave, startAudioOff = false }: SessionProps) {
  const voiceClient = useVoiceClient()!;
  const [hasStarted, setHasStarted] = useState<boolean>(false);

 useEffect(() => {
    // If we joined unmuted, enable the mic once in ready state
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
    console.log("here");
    // Reset started state on mount
    setHasStarted(false);
  }, []);

  useEffect(() => {
      // Leave the meeting if there is an error
      if (state === "error") {
        onLeave();
      }
    }, [state, onLeave]);

  return (
    <Card className="flex flex-col" id="session-component">
      <CardHeader>
        <CardTitle>Audio Session</CardTitle>
      </CardHeader>
      <CardContent>
        <VoiceVisualizer participantType="bot" barColor="#000000" />
        <TranscriptOverlay />
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onLeave}>Leave Session</Button>
      </CardFooter>
    </Card>
  );
}

export default Session;
