import Link from "next/link"
import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Mic, Headphones, Heart, Calendar, Users, Check, PhoneCall, MessageSquare, AlertTriangle, Bot, Clipboard, Target, Sparkles, Clock, Shield } from "lucide-react"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 text-gray-800">
      <main className="pt-16">
        <section id="home" className="min-h-screen flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center items-center space-x-8 mb-8">
              <Brain className="w-16 h-16 text-purple-600" />
              <Heart className="w-16 h-16 text-green-500" />
              <Shield className="w-16 h-16 text-blue-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-purple-800">
              Revolutionary Free AI Mental Health Coach
            </h1>
            <p className="text-xl mb-12 text-gray-600 max-w-2xl mx-auto">
              24/7 access to personalized mental health support, completely free. Your path to better mental well-being starts here.
            </p>
            <Link
              className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white transition-colors rounded-full"
              href="/support?assistant=Mental%20Health%20Coach"
            >
              Start Your Free Journey Now
            </Link>
            <Link
              className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white transition-colors rounded-full"
              href="/voice-room#mental-health"
            >
              Join Audio Room
            </Link>
          </div>
        </section>

        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center text-purple-800">Revolutionary Mental Health Support</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Clock className="w-12 h-12 text-purple-500" />}
                title="24/7 Availability"
                description="Access your AI mental health coach anytime, anywhere. Support is always just a click away."
              />
              <FeatureCard
                icon={<Bot className="w-12 h-12 text-blue-500" />}
                title="AI-Powered Coaching"
                description="Benefit from cutting-edge AI technology that provides personalized mental health guidance."
              />
              <FeatureCard
                icon={<Shield className="w-12 h-12 text-green-500" />}
                title="Completely Free"
                description="No subscriptions, no hidden fees. Our service is entirely free, forever."
              />
              <FeatureCard
                icon={<Target className="w-12 h-12 text-purple-500" />}
                title="Personalized Strategies"
                description="Receive tailored coping mechanisms and mental health strategies based on your unique needs."
              />
              <FeatureCard
                icon={<Sparkles className="w-12 h-12 text-blue-500" />}
                title="Continuous Learning"
                description="Our AI coach evolves with you, constantly improving to provide better support."
              />
              <FeatureCard
                icon={<Users className="w-12 h-12 text-green-500" />}
                title="Community Support"
                description="Connect with peers and join AI-moderated support groups for shared experiences."
              />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 bg-purple-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center text-purple-800">Your AI Coaching Journey</h2>
            <div className="max-w-3xl mx-auto">
              <ol className="relative border-l border-purple-200">
                <TimelineItem 
                  title="Sign Up"
                  description="Create your free account in seconds. No credit card required."
                />
                <TimelineItem 
                  title="AI Assessment"
                  description="Complete a brief AI-guided assessment to personalize your experience."
                />
                <TimelineItem 
                  title="24/7 Coaching"
                  description="Start chatting with your AI coach anytime, anywhere. Get support, guidance, and coping strategies."
                />
                <TimelineItem 
                  title="Track Progress"
                  description="Monitor your mental health journey with AI-powered insights and progress tracking."
                />
                <TimelineItem 
                  title="Continuous Support"
                  description="Access ongoing support, resources, and community features to maintain your mental well-being."
                />
              </ol>
            </div>
          </div>
        </section>

        <section id="cta" className="py-20 bg-blue-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8 text-purple-800">Start Your Free Mental Health Journey Today</h2>
            <p className="text-xl mb-12 text-gray-600 max-w-2xl mx-auto">
              Experience the future of mental health support. No cost, no waiting, just compassionate AI-powered coaching available 24/7.
            </p>
            <Link
              className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white transition-colors rounded-full"
              href="/dashboard"
            >
              Get Started Now - It's Free
            </Link>
          </div>
        </section>

        <section id="crisis-support" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center text-red-600">Immediate Crisis Support</h2>
            <div className="max-w-4xl mx-auto bg-red-50 rounded-lg shadow-md p-6">
              <p className="text-lg mb-6 text-center text-gray-800">
                While our AI coach provides valuable support, if you're experiencing a mental health crisis or need immediate help, please use these free resources:
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
                      <Bot className="w-8 h-8 text-green-500 mr-4" />
                      <h3 className="text-xl font-semibold text-gray-800">AI Coach Support</h3>
                    </div>
                    <p className="mb-4 text-gray-600">Chat with our AI Coach for immediate guidance.</p>
                    <Link 
                      className="w-full bg-green-500 hover:bg-green-600 text-white rounded-md py-2 px-4 inline-block text-center"
                      href="/support?assistant=Mental%20Health%20Coach"
                    >
                      Chat Now
                    </Link>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-8 p-4 bg-yellow-100 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2 flex-shrink-0 mt-1" />
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> If you're experiencing severe mental health issues or having thoughts of self-harm, please contact a qualified healthcare professional or emergency services immediately. Our AI Mental Health Coach is not a substitute for professional medical advice, diagnosis, or treatment.
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
        <h3 className="text-xl font-semibold mb-2 text-purple-800">{title}</h3>
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
      <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white">
        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
      </span>
      <h3 className="flex items-center mb-1 text-lg font-semibold text-purple-800">{title}</h3>
      <p className="mb-4 text-base font-normal text-gray-600">{description}</p>
    </li>
  );
}

export default LandingPage;