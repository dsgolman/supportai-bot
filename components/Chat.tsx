"use client";

import { VoiceProvider } from "@humeai/voice-react";
import Messages from "./Messages";
import StartCall from "./StartCall";
import { ComponentRef, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { access } from "fs";

interface Coach {
  id: string;
  name: string;
  config_id: string;
  description: string;
  specialty: string;
  avatar_url: string;
}

interface ChatProps {
  accessToken: string;
  configId: string;
  coach: Coach | null;
  sessionName: string;
}

export default function Chat({ accessToken, configId, coach, sessionName }: ChatProps) {
  const timeout = useRef<number | null>(null);
  const ref = useRef<ComponentRef<typeof Messages> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {coach && (
            <Card className="mb-8 bg-white/90 backdrop-blur-sm shadow-xl">
              <CardHeader className="flex flex-row items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={coach.avatar_url} alt={coach.name} />
                  <AvatarFallback>{coach.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl text-purple-700">{coach.name}</CardTitle>
                  <Badge variant="secondary" className="mt-2 bg-purple-200 text-purple-700">{coach.specialty}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{coach.description}</p>
              </CardContent>
            </Card>
          )}
          {!coach && (
            <Card className="mb-8 bg-white/90 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-purple-700">{sessionName}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Your custom Serenity Session</p>
              </CardContent>
            </Card>
          )}
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
            <CardContent className="p-0">
              <div className="relative grow flex flex-col mx-auto w-full overflow-hidden h-[calc(100vh-24rem)]">
                <VoiceProvider
                  auth={{ type: "accessToken", value: accessToken }}
                  configId={configId}
                  onMessage={() => {
                    if (timeout.current) {
                      window.clearTimeout(timeout.current);
                    }

                    timeout.current = window.setTimeout(() => {
                      if (ref.current) {
                        const scrollHeight = ref.current.scrollHeight;

                        ref.current.scrollTo({
                          top: scrollHeight,
                          behavior: "smooth",
                        });
                      }
                    }, 200);
                  }}
                >
                  <Messages ref={ref} />
                  <StartCall />
                </VoiceProvider>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}