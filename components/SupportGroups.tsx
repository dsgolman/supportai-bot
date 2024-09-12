'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Clock, Users, Heart, Sun, Smile } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from '@/utils/supabase/client';
import { PRESET_ASSISTANTS } from '@/rtvi.config';
import { motion, AnimatePresence } from 'framer-motion';

// Type definition for UpcomingRoomCard props
interface UpcomingRoomCardProps {
  title: string;
  host: string;
  time: string;
  isLive: boolean;
  onClick: () => void;
  icon: JSX.Element;
}

const UpcomingRoomCard: React.FC<UpcomingRoomCardProps> = ({ title, host, time, isLive, onClick, icon }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="bg-gradient-to-br from-amber-50 to-orange-100 text-gray-800 cursor-pointer rounded-xl overflow-hidden shadow-lg"
    onClick={onClick}
  >
    <CardContent className="p-6">
      {isLive && (
        <span className="bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full mb-3 inline-block animate-pulse">
          LIVE
        </span>
      )}
      <div className="flex items-center mb-4">
        {icon}
        <CardTitle className="text-2xl ml-3">{title}</CardTitle>
      </div>
      <p className="text-lg text-gray-600 mb-4">{host}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-gray-600">
          <Clock className="w-5 h-5" />
          <span className="text-lg">{time}</span>
        </div>
        <Button variant="secondary" size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
          Join
        </Button>
      </div>
    </CardContent>
  </motion.div>
);

type CategoryButtonProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: JSX.Element;
};

const CategoryButton: React.FC<CategoryButtonProps> = ({ label, isActive, onClick, icon }) => (
  <Button 
    variant={isActive ? "default" : "outline"} 
    className={`rounded-full text-lg ${isActive ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 hover:bg-amber-100'}`}
    onClick={onClick}
  >
    {icon}
    {label}
  </Button>
);

function SupportRoomsContent() {
  // const [userId, setUserId] = useState<string>('');
  const [nextSessionTimes, setNextSessionTimes] = useState<{ [key: string]: string }>({});
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const router = useRouter();
  const supabase = createClient();

  const groupChatAssistants = useMemo(() => PRESET_ASSISTANTS.filter(assistant => assistant.supportsGroupChat), []);

  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     const { data: { session } } = await supabase.auth.getSession();
  //     if (session?.user) {
  //       setUserId(session.user.id);
  //     } else {
  //       router.push('/login');
  //     }
  //   };

  //   fetchUserData();
  // }, [router, supabase.auth]);

  useEffect(() => {
    const updateNextSessionTimes = () => {
      const now = new Date();
      const times: { [key: string]: string } = {};
      groupChatAssistants.forEach((assistant, index) => {
        const sessionStart = new Date(now);
        sessionStart.setHours(sessionStart.getHours(), 0, 0, 0); // Start of the current hour
        sessionStart.setMinutes(index * 20); // 0, 20, or 40 minutes past the hour
        
        if (sessionStart <= now) {
          sessionStart.setHours(sessionStart.getHours() + 1);
        }
        
        times[assistant.id] = sessionStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      });
      setNextSessionTimes(times);
    };

    updateNextSessionTimes();
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      updateNextSessionTimes();
    }, 60000);

    return () => clearInterval(interval);
  }, [groupChatAssistants]);

  const handleJoinGroup = useCallback((id: string) => {
    router.push(`/group/${id}`);
  }, [router]);

  const isSessionLive = useCallback((assistantId: string) => {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const assistantIndex = groupChatAssistants.findIndex(a => a.id === assistantId);
    
    const startMinute = assistantIndex * 20;
    const endMinute = startMinute + 18;
    
    return (minutes > startMinute || (minutes === startMinute && seconds >= 0)) && 
           (minutes < endMinute || (minutes === endMinute && seconds === 0));
  }, [currentTime, groupChatAssistants]);

  const getSessionStatus = useCallback((assistantId: string) => {
    if (isSessionLive(assistantId)) {
      return 'LIVE';
    }
    const now = new Date();
    const startTime = new Date(nextSessionTimes[assistantId]);
    const minutesUntilStart = Math.floor((startTime.getTime() - now.getTime()) / 60000);
    
    if (minutesUntilStart <= 5) {
      return 'STARTING SOON';
    } else {
      return 'NEXT SESSION';
    }
  }, [isSessionLive, nextSessionTimes]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-amber-50 to-orange-100 text-gray-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold text-amber-700">Wellness Circles</h1>
          <div className="flex items-center space-x-6">
            <Bell className="text-gray-600 hover:text-amber-700 cursor-pointer w-6 h-6" />
            <Avatar className="h-12 w-12 ring-2 ring-amber-500">
              <AvatarImage src="/placeholder.svg?height=48&width=48" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex flex-col lg:flex-row gap-12">
          <section className="lg:w-2/3 space-y-12">
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-amber-700">Upcoming Circles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {groupChatAssistants.slice(0, 2).map((assistant) => (
                  <UpcomingRoomCard
                    key={assistant.id}
                    title={assistant.name}
                    host={assistant.description}
                    time={`${getSessionStatus(assistant.id)}: ${nextSessionTimes[assistant.id]}`}
                    isLive={isSessionLive(assistant.id)}
                    onClick={() => handleJoinGroup(assistant.id)}
                    icon={assistant.id === 'mental_health' ? <Heart className="w-6 h-6 text-red-500" /> : <Sun className="w-6 h-6 text-yellow-500" />}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-8">
              <CategoryButton 
                label="ALL" 
                isActive={activeCategory === 'ALL'} 
                onClick={() => setActiveCategory('ALL')}
                icon={<Users className="w-5 h-5" />}
              />
              <CategoryButton 
                label="MENTAL HEALTH" 
                isActive={activeCategory === 'MENTAL HEALTH'} 
                onClick={() => setActiveCategory('MENTAL HEALTH')}
                icon={<Heart className="w-5 h-5" />}
              />
              <CategoryButton 
                label="PHYSICAL HEALTH" 
                isActive={activeCategory === 'PHYSICAL HEALTH'} 
                onClick={() => setActiveCategory('PHYSICAL HEALTH')}
                icon={<Sun className="w-5 h-5" />}
              />
              <CategoryButton 
                label="GENERAL WELLBEING" 
                isActive={activeCategory === 'GENERAL WELLBEING'} 
                onClick={() => setActiveCategory('GENERAL WELLBEING')}
                icon={<Smile className="w-5 h-5" />}
              />
            </div>
          </section>
          
          <aside className="lg:w-1/3">
            <h2 className="text-2xl font-semibold mb-6 text-amber-700">Categories</h2>
            <ScrollArea className="h-96">
              <div className="space-y-6">
                {groupChatAssistants.slice(2).map((assistant) => (
                  <UpcomingRoomCard
                    key={assistant.id}
                    title={assistant.name}
                    host={assistant.description}
                    time={`${getSessionStatus(assistant.id)}: ${nextSessionTimes[assistant.id]}`}
                    isLive={isSessionLive(assistant.id)}
                    onClick={() => handleJoinGroup(assistant.id)}
                    icon={<Clock className="w-6 h-6 text-gray-500" />}
                  />
                ))}
              </div>
            </ScrollArea>
          </aside>
        </main>
      </div>
    </div>
  );
}

export default SupportRoomsContent;
