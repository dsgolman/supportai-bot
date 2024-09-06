// components/SupportGroups.tsx

"use client";

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PRESET_ASSISTANTS } from '@/rtvi.config'; // Adjust the import path as necessary
import { useAssistant } from '@/components/assistantContext';

export function SupportGroups() {
  const { setAssistant } = useAssistant();
  const router = useRouter();

  const handleJoinGroup = (index: number) => {
    setAssistant(groupChatAssistants[index]);
    router.push(`/group/${PRESET_ASSISTANTS[index].id}`); // Navigate to the group page
  };

  const groupChatAssistants = PRESET_ASSISTANTS.filter(assistant => assistant.supportsGroupChat);

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">AI-Facilitated Support Groups</h1>
        <p className="max-w-[600px] mx-auto text-muted-foreground">
          Find the support you need, led by our caring AI facilitators. Explore our selection of groups and join the one
          that fits your needs.
        </p>
      </div>
      <div className="mt-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {groupChatAssistants.map((assistant, i) => (
            <Card key={assistant.name}>
              <CardHeader>
                <CardTitle>{assistant.name}</CardTitle>
                <CardDescription>{assistant.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => handleJoinGroup(i)}
                >
                  Join Group
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}