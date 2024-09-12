"use client";

import { VoiceProvider } from "@humeai/voice-react";
import Messages from "./Messages";
import Controls from "./Controls";
import StartCall from "./StartCall";
import { ComponentRef, useRef, useEffect, useState } from "react";
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Coach {
  id: string;
  name: string;
  config_id: string;
  description: string;
  specialty: string;
  avatar_url: string;
}

export default function ClientComponent({
  accessToken
}: {
  accessToken: string;
}) {
  const timeout = useRef<number | null>(null);
  const ref = useRef<ComponentRef<typeof Messages> | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isCoachSelectionOpen, setIsCoachSelectionOpen] = useState(false);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchCoaches = async () => {
      const { data, error } = await supabase
        .from('coaches')
        .select('*');

      if (error) {
        console.error('Error fetching coaches:', error);
      } else {
        setCoaches(data);
      }
    };

    fetchCoaches();
  }, [supabase]);

  const handleCoachSelect = (selectedCoach: Coach) => {
    setCoach(selectedCoach);
    setIsCoachSelectionOpen(false);
    // Here you would typically update the session with the new coach
    // This might involve calling an API or updating the database
    console.log(`Selected coach: ${selectedCoach.name}`);
  };

  const handleStartCall = () => {
    setIsCallStarted(true);
  };

  if (!isCallStarted) {
    return (
      <div className="relative grow flex flex-col mx-auto w-full overflow-hidden p-4">
        <h1 className="text-2xl font-bold mb-4">Select a Coach to Start Your Session</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:bg-gray-100" onClick={() => handleCoachSelect(c)}>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={c.avatar_url} alt={c.name} />
                  <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{c.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1">{c.specialty}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{c.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {coach && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Selected Coach</h2>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={coach.avatar_url} alt={coach.name} />
                  <AvatarFallback>{coach.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{coach.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1">{coach.specialty}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{coach.description}</p>
                <Button onClick={handleStartCall} className="w-full">Start Session with {coach.name}</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative grow flex flex-col mx-auto w-full overflow-hidden">
      {coach && (
        <Card className="mb-4">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={coach.avatar_url} alt={coach.name} />
              <AvatarFallback>{coach.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{coach.name}</CardTitle>
              <Badge variant="secondary" className="mt-1">{coach.specialty}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{coach.description}</p>
          </CardContent>
        </Card>
      )}
      <div className="h-[calc(100vh-16rem)] overflow-y-auto">
        <VoiceProvider
          auth={{ type: "accessToken", value: accessToken }}
          configId={coach?.config_id}
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
          <Controls />
          <StartCall />
        </VoiceProvider>
      </div>
    </div>
  );
}