// components/SupportGroups.tsx
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SUPPORT_SESSIONS } from '@/rtvi.config';

export function SupportGroups() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const router = useRouter();

  const handleJoinGroup = (groupId: string) => {
    router.push(`/group/${groupId}`);
  };

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
        <NavigationMenu className="mb-8">
          <NavigationMenuList>
            {SUPPORT_SESSIONS.map((session) => (
              <NavigationMenuLink asChild key={session.id}>
                <Link
                  href="#"
                  onClick={() => setSelectedGroup(session.id)}
                  className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                  prefetch={false}
                >
                  {session.name}
                </Link>
              </NavigationMenuLink>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {SUPPORT_SESSIONS.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle>{session.name}</CardTitle>
                <CardDescription>{session.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => handleJoinGroup(session.id)}
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
