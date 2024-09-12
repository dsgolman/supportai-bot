// components/PeerCalls.tsx

"use client";

import { useRouter } from 'next/navigation';
import { NavigationMenu, NavigationMenuList, NavigationMenuLink } from "@/components/ui/navigation-menu";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PRESET_ASSISTANTS } from "@/rtvi.config"; // Adjust the import path as necessary
import { useAssistant } from "@/components/assistantContext";

export function PeerCalls() {
  const { setAssistant } = useAssistant();
  const router = useRouter();

  const handleStartCall = (index: number) => {
    // setAssistant(PRESET_ASSISTANTS[index]);
    router.push(`/support?assistant=${PRESET_ASSISTANTS[index].name}`); // Navigate to the pre-call page
  };

  const chatAssistants = PRESET_ASSISTANTS.filter(assistant => !assistant.supportsGroupChat && !assistant.onboarding);

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">AI Peer Support Calls</h1>
        <p className="max-w-[600px] mx-auto text-muted-foreground">
          Connect with an AI assistant for personalized support. Choose a category and start a call to receive the help you need.
        </p>
      </div>
      <div className="mt-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {chatAssistants.map((assistant, i) => (
            <Card key={assistant.name}>
              <CardHeader>
                <CardTitle>{assistant.name}</CardTitle>
                <CardDescription>{assistant.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => handleStartCall(i)}
                >
                  Start Call
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
