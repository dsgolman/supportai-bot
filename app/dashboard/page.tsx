"use client"

import Link from "next/link"
import React, { useEffect, useState } from 'react';
import { createClient } from "@/utils/supabase/client";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mic, Send, User } from 'lucide-react'

const DashboardPage: React.FC = () => {
  const [fullName, setFullName] = useState<string | null>(null);
  const [isFirstSession, setIsFirstSession] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const user = session.user;
        // Fetch the user's full name and session count
        const { data } = await supabase
          .from('profiles')
          .select('full_name, sessions_count')
          .eq('id', user.id)
          .single();

        if (data) {
          setFullName(data.full_name);
          setIsFirstSession(data.sessions_count === 0);
        }
      } else {
        // Redirect to login if not authenticated
        router.push('/login');
      }
    };

    fetchUserData();
  }, [router]);

  const handleNavigate = () => {
    router.push('/support?assistant=Daily%20Onboarding%20Bot');
  };

  const handleSendMessage = () => {
    // Implement sending message to bot
    console.log('Sending message:', message);
    setMessage('');
  };

  const handleVoiceInput = () => {
    // Implement voice input functionality
    console.log('Starting voice input');
  };

  if (fullName === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Please wait while we fetch your data.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to your Dashboard, {fullName}</h1>
      
      {isFirstSession && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Start Your First Session</CardTitle>
            <CardDescription>Speak with our AI assistant to get started with your daily routine.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleNavigate}>
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center space-x-4">
            <Link
                className="text-lg px-8 py-4 bg-blue-600"
                href="/support"
              >
              Get Support
            </Link>
            <Link href="/account">
              <User className="mr-2 h-4 w-4" /> Profile
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;