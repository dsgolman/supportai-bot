import React, { useCallback, useEffect, useState } from "react";
import { TransportState, VoiceEvent } from "realtime-ai";
import { useVoiceClient, useVoiceClientEvent } from "realtime-ai-react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";

interface SessionProps {
  state: string;
  onLeave: () => void;
  openMic?: boolean;
  startAudioOff: boolean;
}

export function Session({ state, onLeave, startAudioOff = false }: SessionProps) {
  const voiceClient = useVoiceClient();
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
    <Card className="flex flex-col h-screen">
      <CardHeader>
        <CardTitle>Audio Session</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        {/* Your audio session UI goes here */}
        <div className="text-center">
          <p>The session is currently {state}.</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onLeave}>Leave Session</Button>
      </CardFooter>
    </Card>
  );
}

export default Session;
