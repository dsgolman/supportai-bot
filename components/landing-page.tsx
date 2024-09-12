import Link from "next/link"
import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sun, Mic, Headphones, Heart, Calendar, Users, Check, PhoneCall, MessageSquare, AlertTriangle, Bot, Clipboard, Target, Sparkles, Clock, Shield } from "lucide-react"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 text-gray-800">
      <main className="pt-16">
        <section id="home" className="min-h-screen flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center items-center space-x-8 mb-8">
              <Sun className="w-24 h-24 text-amber-500 animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-amber-800">
              Find Solace in Our Wellness Circles
            </h1>
            <p className="text-xl mb-12 text-gray-700 max-w-2xl mx-auto">
              Join our supportive community for mental, emotional, and physical well-being. Experience the warmth of connection in our virtual circles.
            </p>
            <div className="space-x-4">
              <Link
                className="text-lg px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white transition-colors rounded-full inline-block mb-4"
                href="/support"
              >
                Explore Wellness Circles
              </Link>
              <Link
                className="text-lg px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white transition-colors rounded-full inline-block mb-4"
                href="/session"
              >
                Join Audio Room
              </Link>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center text-amber-800">Experience Solace in Our Circles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Users className="w-12 h-12 text-amber-500" />}
                title="Supportive Community"
                description="Connect with others in a safe, nurturing environment. Share experiences and find strength in unity."
              />
              <FeatureCard
                icon={<Sun className="w-12 h-12 text-orange-500" />}
                title="Radiant Well-being"
                description="Bask in the warmth of positive energy. Our circles are designed to uplift and rejuvenate your spirit."
              />
              <FeatureCard
                icon={<Heart className="w-12 h-12 text-red-400" />}
                title="Emotional Healing"
                description="Find comfort and understanding. Our circles provide a space for emotional growth and healing."
              />
              <FeatureCard
                icon={<Target className="w-12 h-12 text-green-500" />}
                title="Holistic Approach"
                description="Address mental, emotional, and physical aspects of well-being in our comprehensive wellness circles."
              />
              <FeatureCard
                icon={<Mic className="w-12 h-12 text-blue-500" />}
                title="Voice Connections"
                description="Engage in audio rooms for a more personal and immersive experience. Let your voice be heard and understood."
              />
              <FeatureCard
                icon={<Clock className="w-12 h-12 text-purple-500" />}
                title="Always Available"
                description="Find solace any time. Our circles run 24/7, ensuring support is always within reach when you need it most."
              />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 bg-amber-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center text-amber-800">Your Journey to Inner Peace</h2>
            <div className="max-w-3xl mx-auto">
              <ol className="relative border-l border-amber-200">
                <TimelineItem 
                  title="Join a Circle"
                  description="Choose a wellness circle that resonates with your current needs and interests."
                />
                <TimelineItem 
                  title="Connect and Share"
                  description="Engage with others in a safe, moderated environment. Share your experiences and listen to others."
                />
                <TimelineItem 
                  title="Find Your Voice"
                  description="Participate in audio rooms for a more personal connection. Speak your truth and be heard."
                />
                <TimelineItem 
                  title="Reflect and Grow"
                  description="Take time to absorb the wisdom and support from your circle. Apply insights to your daily life."
                />
                <TimelineItem 
                  title="Return and Flourish"
                  description="Come back to your circle regularly. Watch as you grow, heal, and find lasting solace."
                />
              </ol>
            </div>
          </div>
        </section>

        <section id="cta" className="py-20 bg-gradient-to-r from-amber-100 to-orange-200">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8 text-amber-800">Embrace the Warmth of Our Wellness Circles</h2>
            <p className="text-xl mb-12 text-gray-700 max-w-2xl mx-auto">
              Step into a world of support, understanding, and growth. Our circles are here to provide the solace you seek, whenever you need it.
            </p>
            <Link
              className="text-lg px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white transition-colors rounded-full inline-block"
              href="/support"
            >
              Join Your First Circle Now
            </Link>
          </div>
        </section>

        <section id="crisis-support" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center text-red-600">Immediate Support</h2>
            <div className="max-w-4xl mx-auto bg-red-50 rounded-lg shadow-md p-6">
              <p className="text-lg mb-6 text-center text-gray-800">
                While our wellness circles offer valuable support, if you're experiencing a crisis or need immediate help, please use these free resources:
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <PhoneCall className="w-8 h-8 text-red-500 mr-4" />
                      <h3 className="text-xl font-semibold text-gray-800">Crisis Hotline</h3>
                    </div>
                    <p className="mb-4 text-gray-600">Call for immediate support from trained professionals.</p>
                    <p className="text-2xl font-bold text-red-600">1-800-273-8255</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <MessageSquare className="w-8 h-8 text-blue-500 mr-4" />
                      <h3 className="text-xl font-semibold text-gray-800">Crisis Text Line</h3>
                    </div>
                    <p className="mb-4 text-gray-600">Text with a crisis counselor 24/7.</p>
                    <p className="text-2xl font-bold text-blue-600">Text HOME to 741741</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <Users className="w-8 h-8 text-amber-500 mr-4" />
                      <h3 className="text-xl font-semibold text-gray-800">Wellness Circle</h3>
                    </div>
                    <p className="mb-4 text-gray-600">Join a supportive circle for immediate community support.</p>
                    <Link 
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-md py-2 px-4 inline-block text-center"
                      href="/support-rooms"
                    >
                      Join Now
                    </Link>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-8 p-4 bg-yellow-100 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2 flex-shrink-0 mt-1" />
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> If you're experiencing severe mental health issues or having thoughts of self-harm, please contact a qualified healthcare professional or emergency services immediately. Our wellness circles are not a substitute for professional medical advice, diagnosis, or treatment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-6 text-center">
        <div className="mb-4 flex justify-center">{icon}</div>
        <h3 className="text-xl font-semibold mb-2 text-amber-800">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}

type TimelineItemProps = {
  title: string;
  description: string;
};

function TimelineItem({ title, description }: TimelineItemProps) {
  return (
    <li className="mb-10 ml-6">
      <span className="absolute flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full -left-3 ring-8 ring-white">
        <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
      </span>
      <h3 className="flex items-center mb-1 text-lg font-semibold text-amber-800">{title}</h3>
      <p className="mb-4 text-base font-normal text-gray-600">{description}</p>
    </li>
  );
}

export default LandingPage;