'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Clock, Heart, Sun, Users, Tag, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { createClient } from '@/utils/supabase/client';

interface Group {
  id: string;
  name: string;
  topic: string;
  description: string;
  start_time: string;
  duration_minutes: number;
  days_of_week: number[];
  is_active: boolean;
  next_session_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  max_participants: number;
  min_participants: number;
  category: string;
  tags: string[];
  active_participants: number;
  always_joinable: boolean;
}

interface GroupCardProps {
  group: Group;
  isActive: boolean;
  onClick: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ 
  group, 
  isActive,
  onClick
}) => {
  return (
    <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {group.category.toLowerCase().includes('mental') ? 
              <Heart className="w-6 h-6 text-red-500" /> : 
              <Sun className="w-6 h-6 text-yellow-500" />
            }
            <CardTitle className="text-xl ml-3">{group.name}</CardTitle>
          </div>
          <Badge variant={isActive ? "destructive" : "secondary"}>
            {isActive ? "In Progress" : group.category}
          </Badge>
        </div>
        <p className="text-sm font-medium text-gray-600 mb-2">{group.topic}</p>
        <p className="text-sm text-gray-600 mb-4">{group.description}</p>
        <div className="flex items-center space-x-2 text-gray-600 mb-4">
          <Users className="w-4 h-4" />
          <span className="text-sm">
            {group.active_participants} / {group.max_participants} participants
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {group.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {group.always_joinable 
                ? 'Always available' 
                : isActive 
                  ? 'In progress' 
                  : `Starts at ${new Date(group.next_session_date!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              }
            </span>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-amber-500 hover:bg-amber-600 text-white" 
            onClick={onClick}
          >
            Join Now
          </Button>
        </div>
      </CardContent>
    </Card>
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
          *,
          active_participants:group_members(count)
        `)
        .eq('is_active', true)
        .order('next_session_date', { ascending: true });

      if (error) throw error;

      const groupsWithParticipants = data.map(group => ({
        ...group,
        active_participants: group.active_participants[0].count
      }));

      setGroups(groupsWithParticipants);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to fetch wellness circles. Please try again later.",
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
    const now = new Date();
    let startTime: number;

    if (group.always_joinable) {
      // For AlwaysRunning groups, set startTime to now
      startTime = now.getTime();
    } else if (group.next_session_date) {
      // For scheduled groups, use the next_session_date
      startTime = new Date(group.next_session_date).getTime();
    } else {
      // Fallback to current time if no next_session_date is available
      startTime = now.getTime();
    }

    router.push(`/group/${group.id}?startTime=${startTime}`);
  }, [router]);

  const isGroupActive = useCallback((group: Group) => {
    if (group.always_joinable) return true;
    const now = new Date();
    const startTime = new Date(group.next_session_date!);
    const endTime = new Date(startTime.getTime() + group.duration_minutes * 60000);
    return now >= startTime && now < endTime;
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  const activeGroups = groups.filter(group => isGroupActive(group) || group.always_joinable);
  const upcomingGroups = groups.filter(group => !isGroupActive(group) && !group.always_joinable);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-amber-50 to-orange-100 text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold text-amber-700">Wellness Circles</h1>
          <div className="flex items-center space-x-6">
            <Bell className="text-gray-600 hover:text-amber-700 cursor-pointer w-6 h-6" />
            <Avatar className="h-12 w-12 ring-2 ring-amber-500">
              <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg?height=48&width=48"} alt="User" />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main>
          <h2 className="text-2xl font-semibold mb-6 text-amber-700">Currently Available</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {activeGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isActive={true}
                onClick={() => handleJoinGroup(group)}
              />
            ))}
            {activeGroups.length === 0 && (
              <p className="text-gray-600 col-span-full">No circles are currently available.</p>
            )}
          </div>

          <h2 className="text-2xl font-semibold mb-6 text-amber-700">Upcoming Circles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isActive={false}
                onClick={() => handleJoinGroup(group)}
              />
            ))}
            {upcomingGroups.length === 0 && (
              <p className="text-gray-600 col-span-full">No upcoming circles scheduled.</p>
            )}
          </div>
        </main>

        <footer className="mt-16 text-center">
          <Button 
            onClick={() => router.push('/pricing')} 
            className="bg-amber-500 hover:bg-amber-600 text-white text-lg py-3 px-6"
          >
            Start a Room
          </Button>
        </footer>
      </div>
    </div>
  );
}