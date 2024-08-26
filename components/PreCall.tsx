"use client";

import { useCallback, useEffect, useState } from "react";
import { Ear, Loader2 } from "lucide-react";
import { VoiceEvent, VoiceMessage } from "realtime-ai";
import { useVoiceClient, useVoiceClientEvent, useVoiceClientTransportState } from "realtime-ai-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";
import { Configure } from "./Configure";
import { useAssistant } from "@/components/assistantContext";

const status_text = {
  idle: "Initializing...",
  initializing: "Initializing...",
  initialized: "Start",
  authenticating: "Requesting bot...",
  connecting: "Connecting...",
};

export function PreCall() {

  const voiceClient = useVoiceClient();
  const transportState = useVoiceClientTransportState();

  const [appState, setAppState] = useState<"idle" | "ready">("idle");
  const [error, setError] = useState<string | null>(null);
  const [startAudioOff, setStartAudioOff] = useState<boolean>(false);

  const { assistant } = useAssistant();

  if (!assistant) {
    return null; // Or render a fallback UI
  }
  
  useVoiceClientEvent(
    VoiceEvent.Error,
    useCallback((message: VoiceMessage) => {
      const errorData = message.data as { error: string; fatal: boolean };
      if (!errorData.fatal) return;
      setError(errorData.error);
    }, [])
  );

  useEffect(() => {
    console.log("VoiceClient:", voiceClient);
    console.log("TransportState:", transportState);
    console.log("AppState:", appState);

    if (!voiceClient || appState !== "idle") return;
    voiceClient.initDevices();
  }, [appState, voiceClient]);

  useEffect(() => {
    console.log("Updating appState based on transportState:", transportState);

    switch (transportState) {
      case "initialized":
        setAppState("ready");
        break;
      case "authenticating":
      case "connecting":
        setAppState("idle");
        break;
      case "connected":
      case "ready":
        setAppState("ready");
        break;
      default:
        setAppState("idle");
    }
  }, [transportState]);

  async function start() {
    if (!voiceClient) return;
    try {
      voiceClient.enableMic(false);
      await voiceClient.start();
    } catch (e) {
      setError((e as VoiceMessage).message || "Unknown error occurred");
      voiceClient.disconnect();
    }
  }

  if (error) {
    return (
      <Card shadow className="animate-appear max-w-lg">
        <CardContent>
          <Alert intent="danger" title="An error occurred">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isReady = appState === "ready";

  return (
    <Card shadow="true" className="animate-appear max-w-lg">
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row gap-2 bg-primary-50 px-4 py-2 md:p-2 text-sm items-center justify-center rounded-md font-medium text-pretty">
          <Ear className="size-7 md:size-5 text-primary-400" />
          Works best in a quiet environment with a good internet.
        </div>
        <Configure
          startAudioOff={startAudioOff}
          handleStartAudioOff={() => setStartAudioOff(!startAudioOff)}
          state={appState}
        />
      </CardContent>
      <CardFooter>
        <Button
          key="start"
          onClick={() => start()}
          disabled={!isReady}
        >
          {!isReady && <Loader2 className="animate-spin" />}
          {status_text[transportState as keyof typeof status_text]}
        </Button>
      </CardFooter>
    </Card>
  );
}
