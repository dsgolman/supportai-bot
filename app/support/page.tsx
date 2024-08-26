// app/support/page.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { DailyVoiceClient } from "realtime-ai-daily";
import { VoiceClientAudio, VoiceClientProvider } from "realtime-ai-react";
import { LLMHelper } from "realtime-ai";

import { AssistantProvider, useAssistant } from "@/components/assistantContext";
import { PRESET_ASSISTANTS } from "@/rtvi.config";
import { PreCall } from "@/components/PreCall";
import {
  BOT_READY_TIMEOUT,
  defaultConfig,
  defaultServices,
} from "@/rtvi.config";
import { SupportGroups } from "@/components/SupportGroups";
import { PeerCalls } from "@/components/PeerCalls";

type AssistantData = {
  name: string;
  prompt: string;
  voice: string;
};

function SupportPageContent() {
  const { assistant } = useAssistant();
  const [voiceClient, setVoiceClient] = useState<DailyVoiceClient | null>(null);
  const voiceClientRef = useRef<DailyVoiceClient | null>(null);

  const updateConfigWithAssistantData = (config: any[], assistantData: any) => {
    // Clone the config to avoid mutating the original
    const updatedConfig = JSON.parse(JSON.stringify(config));

    // Find the relevant configuration items and update them
    updatedConfig.forEach((item) => {
      if (item.service === "tts") {
        item.options.forEach((option: any) => {
          if (option.name === "voice") {
            option.value = assistantData.voice;
          }
        });
      }
      if (item.service === "llm") {
        item.options.forEach((option: any) => {
          if (option.name === "initial_messages") {
            option.value[0].content = assistantData.prompt;
          }
          if (option.name === "model") {
            // Optional: Update the model if needed
          }
        });
      }
    });

    return updatedConfig;
  };

  useEffect(() => {
    if (voiceClientRef.current || !assistant) {
      return;
    }

    // Get assistant data and update config
    const assistantData = assistant;

    const voiceClient = new DailyVoiceClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "/api",
      services: defaultServices,
      config: updateConfigWithAssistantData(defaultConfig, assistantData),
      timeout: BOT_READY_TIMEOUT,
    });

    const llmHelper = new LLMHelper({});
    voiceClient.registerHelper("llm", llmHelper);

    voiceClientRef.current = voiceClient;
    setVoiceClient(voiceClient); // Set the state to trigger re-render
  }, [assistant]);

  if (!voiceClient && assistant) {
    // You might want to return a loading indicator here
    return <div>Loading...</div>;
  }

  return (
    <div>
      {!assistant ? (
        <>
          {/**<SupportGroups /> */}
          <PeerCalls />
        </>
      ) : (
        <VoiceClientProvider voiceClient={voiceClient!}>
          <TooltipProvider>
            <main>
              <div id="app">
                <PreCall />
              </div>
            </main>
            <aside id="tray" />
          </TooltipProvider>
          <VoiceClientAudio />
        </VoiceClientProvider>
      )}
    </div>
  );
}

export default function SupportPage() {
  return (
    <AssistantProvider>
      <SupportPageContent />
    </AssistantProvider>
  );
}
