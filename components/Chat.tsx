"use client";

import { useState, useEffect, useRef } from "react";
import { VoiceProvider, useVoice } from "@humeai/voice-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Mic, MicOff, Phone } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import MicFFT from "./MicFFT";

interface Coach {
  id: string;
  name: string;
  config_id: string;
  description: string;
  specialty: string;
  avatar_url: string;
}

interface ChatProps {
  configId: string;
  coach: Coach | null;
  sessionName: string;
}

function Messages() {
  const { messages } = useVoice();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {messages.map((msg, index) => {
          if (msg.type === "user_message" || msg.type === "assistant_message") {
            return (
              <motion.div
                key={msg.type + index}
                className={cn(
                  "w-[80%]",
                  "bg-card",
                  "border border-border rounded",
                  msg.type === "user_message" ? "ml-auto" : ""
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0 }}
              >
                <div className={cn("text-xs capitalize font-medium leading-none opacity-50 pt-4 px-3")}>
                  {msg.message.role}
                </div>
                <div className="pb-3 px-3">{msg.message.content}</div>
              </motion.div>
            );
          }
          return null;
        })}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
}

function MessageInput() {
  const [input, setInput] = useState("");
  const { sendMessage } = useVoice();

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="flex items-center space-x-2 mb-4">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        onKeyPress={(e) => e.key === "Enter" && handleSend()}
        className="flex-grow"
      />
      <Button onClick={handleSend} disabled={!input.trim()}>
        <Send className="h-4 w-4 mr-2" />
        Send
      </Button>
    </div>
  );
}

function Controls() {
  const { disconnect, status, isMuted, unmute, mute, micFft } = useVoice();

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 w-full p-4 flex items-center justify-center",
        "bg-gradient-to-t from-card via-card/90 to-card/0"
      )}
    >
      <AnimatePresence>
        {status.value === "connected" && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            className="p-4 bg-card border border-border rounded-lg shadow-sm flex items-center gap-4"
          >
            <Toggle
              pressed={!isMuted}
              onPressedChange={() => {
                if (isMuted) {
                  unmute();
                } else {
                  mute();
                }
              }}
            >
              {isMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </Toggle>

            <div className="relative grid h-8 w-48 shrink grow-0">
              <MicFFT fft={micFft} className="fill-current" />
            </div>

            <Button
              className="flex items-center gap-1"
              onClick={() => {
                disconnect();
              }}
              variant="destructive"
            >
              <Phone className="size-4 opacity-50" strokeWidth={2} stroke="currentColor" />
              <span>End Call</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Chat({ configId, coach, sessionName }: ChatProps) {
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
    <VoiceProvider
      auth={{ type: "accessToken", value: "" }}
      configId={configId}
    >
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 p-8 pb-24">
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
              <CardContent className="p-6">
                <div className="h-[calc(100vh-24rem)] flex flex-col">
                  <div className="flex-grow overflow-y-auto mb-4 messages-container">
                    <Messages />
                  </div>
                  <div className="mt-auto">
                    <MessageInput />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      <Controls />
    </VoiceProvider>
  );
}