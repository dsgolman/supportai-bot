"use client";

import { useCallback, useEffect, useState } from "react";
import { Ear, Loader2 } from "lucide-react";
import { VoiceEvent, VoiceMessage } from "realtime-ai";
import { useVoiceClient, useVoiceClientEvent, useVoiceClientTransportState } from "realtime-ai-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Configure } from "./Configure";
import Session from "./Session";
import { useAssistant } from "@/components/assistantContext";
import { Alert } from "./ui/alert";

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

  const [appState, setAppState] = useState<
    "idle" | "ready" | "connecting" | "connected"
  >("idle");

  const [error, setError] = useState<string | null>(null);
  const [startAudioOff, setStartAudioOff] = useState<boolean>(false);

  const { assistant } = useAssistant();

  const handleError = useCallback((message: VoiceMessage) => {
    const errorData = message.data as { error: string; fatal: boolean };
    if (errorData.fatal) {
      setError(errorData.error);
    }
  }, []);

  useVoiceClientEvent(VoiceEvent.Error, handleError);

  useEffect(() => {
    if (!voiceClient || appState !== "idle") return;
    voiceClient.initDevices();
  }, [appState, voiceClient]);

  useEffect(() => {
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
        setAppState("connected");
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
      voiceClient.disconnect();
    }
  }

  async function leave() {
    if (!voiceClient) return;
    await voiceClient.disconnect();
  }

  if (error) {
    return (
      <Card id="error-card" className="animate-appear max-w-lg">
        <CardContent>
          <Alert intent="danger" title="An error occurred" id="error-alert">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (appState === "connected") {
    return (
      <div className="flex h-screen items-center justify-center" id="session-container">
        <Session
          state={transportState}
          onLeave={() => leave()}
          startAudioOff={startAudioOff}
        />
      </div>
    );
  }

  const isReady = appState === "ready";

  return (
    <Card id="precall-card" className="animate-appear max-w-lg">
      <CardHeader id="card-header">
        <CardTitle id="card-title">{assistant?.name || "Configuration"}</CardTitle>
        {assistant?.description && (
          <CardDescription id="card-description">{assistant.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent id="card-content">
        <div className="flex flex-row gap-2 bg-primary-50 px-4 py-2 md:p-2 text-sm items-center justify-center rounded-md font-medium text-pretty" id="status-info">
          <Ear className="size-7 md:size-5 text-primary-400" />
          Works best in a quiet environment with a good internet.
        </div>
        <Configure
          startAudioOff={startAudioOff}
          handleStartAudioOff={() => setStartAudioOff(!startAudioOff)}
          state={appState}
        />
      </CardContent>
      <CardFooter id="card-footer">
        <Button
          key="start"
          onClick={() => start()}
          disabled={!isReady}
          id="start-button"
        >
          {!isReady && <Loader2 className="animate-spin" />}
          {status_text[transportState as keyof typeof status_text]}
        </Button>
      </CardFooter>
    </Card>
  );
}
