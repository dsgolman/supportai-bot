'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Heart, Sun, Users, Tag, Loader2, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from "framer-motion";

interface Group {
  id: string;
  name: string;
  topic: string;
  description: string;
  category: string;
  tags: string[];
  current_participants: number;
  config_id: string;
}

interface GroupCardProps {
  group: Group;
  onClick: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ 
  group, 
  onClick
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 border border-purple-200 rounded-lg overflow-hidden h-full">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {group.category.toLowerCase().includes('mental') ? 
                <Heart className="w-8 h-8 text-purple-500 mr-2" /> : 
                <Sun className="w-8 h-8 text-amber-500 mr-2" />
              }
              <CardTitle className="text-xl text-purple-800">{group.name}</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-600">
              {group.category}
            </Badge>
          </div>
          <p className="text-sm font-medium text-purple-700 mb-2">{group.topic}</p>
          <p className="text-sm text-gray-600 mb-4 flex-grow">{group.description}</p>
          <div className="flex items-center space-x-2 text-amber-600 mb-4">
            <Users className="w-4 h-4" />
            <span className="text-sm">
              {group.current_participants} / 5 participants
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {group.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center space-x-2 text-purple-600 mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              Always available
            </span>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-300 w-full mt-auto" 
            onClick={onClick}
            disabled={group.current_participants >= 5}
          >
            {group.current_participants >= 5 ? 'Circle Full' : 'Join Circle'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function SupportRoomsContent() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          topic,
          description,
          category,
          tags,
          config_id,
          current_participants:group_members(count)
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      const groupsWithParticipants = data.map(group => ({
        ...group,
        current_participants: group.current_participants[0].count
      }));

      setGroups(groupsWithParticipants);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to fetch serenity circles. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchGroups();
    const interval = setInterval(fetchGroups, 60000); // Fetch every minute

    const groupsSubscription = supabase
      .channel('groups')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, fetchGroups)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(groupsSubscription);
    };
  }, [supabase, fetchGroups]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();

    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener.data.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleJoinGroup = useCallback((group: Group) => {
    if (group.current_participants >= 5) {
      toast({
        title: "Circle Full",
        description: "This circle is currently full. Please try again later or join another circle.",
        variant: "destructive",
      });
      return;
    }

    const startTime = new Date().getTime();
    router.push(`/group/${group.id}?startTime=${startTime}&configId=${group.config_id}`);
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-purple-50 to-amber-50">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 to-amber-50 text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold text-purple-800">Serenity Circles</h1>
          <div className="flex items-center space-x-6">
            <Bell className="text-purple-600 hover:text-amber-500 cursor-pointer w-6 h-6 transition-colors duration-300" />
            <Avatar className="h-12 w-12 ring-2 ring-purple-300">
              <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg?height=48&width=48"} alt="User" />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main>
          <h2 className="text-2xl font-semibold mb-6 text-purple-700">Available Circles</h2>
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onClick={() => handleJoinGroup(group)}
                />
              ))}
              {groups.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-purple-600 col-span-full text-center text-lg"
                >
                  No circles are currently available. Check back soon!
                </motion.p>
              )}
            </div>
          </AnimatePresence>
        </main>

        <footer className="mt-16 text-center">
          <Button 
            onClick={() => router.push('/pricing')} 
            className="bg-amber-500 hover:bg-amber-600 text-white text-lg py-3 px-6 rounded-md transition-colors duration-300"
          >
            Start Your Own Circle
          </Button>
        </footer>
      </div>
    </div>
  );
}