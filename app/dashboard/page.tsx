"use client"

import React, { useEffect, useState } from 'react';
import { createClient } from "@/utils/supabase/client";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
// import { Progress } from "@/components/ui/progress"
import { Mic, User, Calendar, BarChart, BookOpen, MessageCircle, ArrowRight, Award, Target } from 'lucide-react'
import CrisisSupport from "@/components/CrisisSupport";

const DashboardPage: React.FC = () => {
  const [fullName, setFullName] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(true);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const user = session.user;
        const { data } = await supabase
          .from('profiles')
          .select('full_name, sessions_count, progress')
          .eq('id', user.id)
          .single();

        if (data) {
          setFullName(data.full_name);
          setIsNewUser(data.sessions_count === 0);
          setProgress(data.progress || 0);
        }
      } else {
        router.push('/login');
      }
    };

    fetchUserData();
  }, [router]);

  const handleStartCoaching = () => {
    router.push('/coaching/session');
  };

  // if (fullName === null) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen bg-gradient-calm">
  //       <Card className="w-[350px] shadow-soft">
  //         <CardHeader>
  //           <CardTitle className="text-gradient-primary">Loading...</CardTitle>
  //           <CardDescription>Please wait while we fetch your data.</CardDescription>
  //         </CardHeader>
  //       </Card>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gradient-calm p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gradient-primary text-center">Welcome to Your Mental Health Journey, {fullName}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isNewUser && (
            <Card className="col-span-full bg-gradient-positive shadow-soft">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Begin Your Coaching Journey</CardTitle>
                <CardDescription>Start your first session with our AI Mental Health Coach.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleStartCoaching} className="w-full btn-primary">
                  <Mic className="mr-2 h-5 w-5" /> Start Coaching Session
                </Button>
              </CardContent>
            </Card>
          )}
          
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-primary">Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              {/* <Progress value={progress} className="w-full" /> */}
              <p className="text-sm text-muted-foreground">Keep up the great work! Your journey to better mental health is progressing well.</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-primary">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center text-muted-foreground">
                  <Target className="mr-2 h-5 w-5 text-accent" />
                  <span>Set your weekly goal</span>
                </li>
                <li className="flex items-center text-muted-foreground">
                  <Calendar className="mr-2 h-5 w-5 text-accent" />
                  <span>Schedule next coaching session</span>
                </li>
                <li className="flex items-center text-muted-foreground">
                  <Award className="mr-2 h-5 w-5 text-accent" />
                  <span>Complete daily mindfulness exercise</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-primary">Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center text-muted-foreground">
                  <Calendar className="mr-2 h-5 w-5 text-primary" />
                  <span>AI Coaching Session - Tomorrow, 2 PM</span>
                </li>
                <li className="flex items-center text-muted-foreground">
                  <Calendar className="mr-2 h-5 w-5 text-primary" />
                  <span>Group Support Circle - Friday, 6 PM</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="col-span-full shadow-soft">
            <CardHeader>
              <CardTitle className="text-primary">Personalized Resources</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Button variant="outline" className="w-full justify-start text-accent hover:bg-accent/10">
                <BookOpen className="mr-2 h-5 w-5" /> Stress Management Techniques
              </Button>
              <Button variant="outline" className="w-full justify-start text-primary hover:bg-primary/10">
                <Mic className="mr-2 h-5 w-5" /> Guided Meditation: Finding Inner Peace
              </Button>
              <Button variant="outline" className="w-full justify-start text-accent hover:bg-accent/10">
                <BarChart className="mr-2 h-5 w-5" /> Mood Tracking Workshop
              </Button>
            </CardContent>
          </Card>

          <Card className="col-span-full shadow-soft">
            <CardHeader>
              <CardTitle className="text-gradient-primary">24/7 Support</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <CrisisSupport />
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <Button className="w-full btn-primary">
                Connect with a Human Coach <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;