// app/support/page.tsx
"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // Import useSearchParams
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { DailyVoiceClient } from "realtime-ai-daily";
import { VoiceClientAudio, VoiceClientProvider } from "realtime-ai-react";
import { LLMHelper } from "realtime-ai";
import { createClient } from "@/utils/supabase/client";
import { AssistantProvider, useAssistant } from "@/components/assistantContext";
import { PRESET_ASSISTANTS } from "@/rtvi.config";
import { PreCall } from "@/components/PreCall";
import { BOT_READY_TIMEOUT, defaultConfig, defaultServices } from "@/rtvi.config";
import { SupportGroups } from "@/components/SupportGroups";
import { PeerCalls } from "@/components/PeerCalls";
import CrisisSupport from "@/components/CrisisSupport";
// import withAuth from "@/utils/supabase/withAuth"; // Import the withAuth HOC

interface ConfigOption {
  name: string;
  value: any; 
}

interface ConfigItem {
  service: string;
  options: ConfigOption[];
}

type AssistantData = {
  name: string;
  prompt: string;
  voice: string;
};

function SupportPageContent() {
  const { assistant, setAssistant } = useAssistant(); // Add setAssistant to the context
  const [voiceClient, setVoiceClient] = useState<DailyVoiceClient | null>(null);
  const voiceClientRef = useRef<DailyVoiceClient | null>(null);
  const searchParams = useSearchParams(); // Use useSearchParams hook to access query parameters
  const supabase = createClient();
  const [userId, setUserId] = useState('');
  const router = useRouter();
  

  const updateConfigWithAssistantData = (config: ConfigItem[], assistantData: AssistantData): ConfigItem[] => {
    const updatedConfig = JSON.parse(JSON.stringify(config));

    updatedConfig.forEach((item: ConfigItem) => {
      if (item.service === "tts") {
        item.options.forEach((option: ConfigOption) => {
          if (option.name === "voice") {
            option.value = assistantData.voice;
          }
        });
      }
      if (item.service === "llm") {
        item.options.forEach((option: ConfigOption) => {
          if (option.name === "initial_messages") {
            option.value[0].content = assistantData.prompt;
          }
        });
      }
    });

    return updatedConfig;
  };

  const onComplete = () => {
    console.log("finished")
  }

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const user = session.user;
        // Fetch the user's full name and session count
        if (user) {
          setUserId(user.id);
        }
      } else {
        // Redirect to login if not authenticated
        router.push('/login');
      }
    };

    fetchUserData();
  }, [router]);


  useEffect(() => {
    if (assistant) {
      return;
    }

    const assistantQuery = searchParams.get("assistant"); // Get the "assistant" parameter

    if (assistantQuery) {
      const selectedAssistant = PRESET_ASSISTANTS.find(
        (a) => a.name.toLowerCase() === assistantQuery.toLowerCase()
      );

      if (selectedAssistant) {
        setAssistant(selectedAssistant);
      }
    }
  }, [searchParams, setAssistant, assistant]);

  useEffect(() => {
    if (voiceClientRef.current || !assistant) {
      return;
    }

    const assistantData = assistant;

    const voiceClient = new DailyVoiceClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "/api",
      services: defaultServices,
      config: updateConfigWithAssistantData(defaultConfig, assistantData),
      timeout: BOT_READY_TIMEOUT,
    });

    voiceClient.registerHelper(
      "llm",
      new LLMHelper({
        callbacks: {},
      })
    ) as LLMHelper;

    // voiceClient.helper<LLMHelper>("llm").llmContext();

    voiceClientRef.current = voiceClient;
    setVoiceClient(voiceClient); 
  }, [assistant]);

  if (!voiceClient && assistant) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {!assistant ? (
        <>
          <PeerCalls />
          <SupportGroups />
        </>
      ) : (
        <VoiceClientProvider voiceClient={voiceClientRef.current!}>
          <TooltipProvider>
            <main>
              <div id="app">
                <PreCall 
                  isGroupChat={assistant.supportsGroupChat}
                  userId={userId}
                  onComplete={onComplete}
                />
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
      <Suspense fallback={<div>Loading...</div>}>
        <SupportPageContent />
      </Suspense>
    </AssistantProvider>
  );
}