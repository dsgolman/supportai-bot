import Link from "next/link"
import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Mic, Headphones, Heart, Calendar, Users, Check, PhoneCall, MessageSquare, AlertTriangle, Bot, Pill, Activity, Clipboard } from "lucide-react"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 text-gray-800">
      <main className="pt-16">
        <section id="home" className="min-h-screen flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center items-center space-x-8 mb-8">
              <Brain className="w-16 h-16 text-blue-600" />
              <Heart className="w-16 h-16 text-red-500" />
              <Activity className="w-16 h-16 text-green-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-blue-800">
              Daily Dose: Your Comprehensive Health Companion
            </h1>
            <p className="text-xl mb-12 text-gray-600 max-w-2xl mx-auto">
              Expert guidance in mental, physical, and emotional health, all in one place.
            </p>
            <Link
              className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              href="/onboarding"
            >
              Start Your Health Journey
            </Link>
          </div>
        </section>

        <section id="crisis-support" className="py-20 bg-red-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center text-red-600">Immediate Crisis Support</h2>
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
              <p className="text-lg mb-6 text-center text-gray-800">
                If you&apos;re experiencing a health crisis or need immediate support, please use one of these free resources:
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
                      <h3 className="text-xl font-semibold text-gray-800">Crisis Support Bot</h3>
                    </div>
                    <p className="mb-4 text-gray-600">Chat with our AI for immediate health guidance.</p>
                    <Link 
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                      href="/support?assistant=Daily%20Crisis"
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
                    <strong>Important:</strong> If you&apos;re dealing with a serious health condition or having thoughts of self-harm, please contact a qualified healthcare professional or emergency services immediately. Daily Dose is not a substitute for professional medical advice, diagnosis, or treatment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center text-blue-800">Comprehensive Health Support</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Brain className="w-12 h-12 text-blue-500" />}
                title="Mental Health Guidance"
                description="Access expert advice and resources for managing your mental well-being."
              />
              <FeatureCard
                icon={<Heart className="w-12 h-12 text-red-500" />}
                title="Emotional Support"
                description="Discover tools and techniques for emotional regulation and resilience."
              />
              <FeatureCard
                icon={<Activity className="w-12 h-12 text-green-500" />}
                title="Physical Health Tracking"
                description="Monitor and improve your physical health with personalized insights."
              />
              <FeatureCard
                icon={<Pill className="w-12 h-12 text-purple-500" />}
                title="Medication Management"
                description="Stay on top of your medications with reminders and detailed information."
              />
              <FeatureCard
                icon={<Clipboard className="w-12 h-12 text-indigo-500" />}
                title="Specialized Therapies"
                description="Explore various therapeutic approaches tailored to your needs."
              />
              <FeatureCard
                icon={<Users className="w-12 h-12 text-yellow-500" />}
                title="Community Support"
                description="Connect with others on similar health journeys for mutual support."
              />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center text-blue-800">Your Journey with Daily Dose</h2>
            <div className="max-w-3xl mx-auto">
              <ol className="relative border-l border-gray-200">
                <TimelineItem 
                  title="Create Your Profile"
                  description="Set up your account with your health goals and preferences."
                />
                <TimelineItem 
                  title="Personalized Health Plan"
                  description="Receive a tailored plan addressing your mental, physical, and emotional health needs."
                />
                <TimelineItem 
                  title="Access Expert Guidance"
                  description="Engage with our AI-powered health companion for daily support and advice."
                />
                <TimelineItem 
                  title="Track Your Progress"
                  description="Monitor your health journey with comprehensive tracking tools."
                />
                <TimelineItem 
                  title="Unlock Advanced Features"
                  description="Subscribe to access in-depth medication management, advanced fitness tracking, and specialized therapies."
                />
              </ol>
            </div>
          </div>
        </section>

        <section id="join" className="py-20 bg-blue-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center text-blue-800">Choose Your Health Plan</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <PlanCard
                title="Basic Health"
                description="Start your journey to better health."
                price="$9.99"
                features={[
                  "Daily health tips",
                  "Basic mental health resources",
                  "Simple physical activity tracking",
                  "24/7 Health Bot access"
                ]}
              />
              <PlanCard
                title="Comprehensive Care"
                description="Unlock advanced features for holistic health."
                price="$19.99"
                features={[
                  "All Basic Health features",
                  "In-depth medication management",
                  "Advanced fitness tracking",
                  "Personalized health insights"
                ]}
                highlighted={true}
              />
              <PlanCard
                title="Premium Wellness"
                description="Experience the full spectrum of health support."
                price="$29.99"
                features={[
                  "All Comprehensive Care features",
                  "Access to specialized therapeutic approaches",
                  "Priority health coaching",
                  "Customized wellness programs"
                ]}
              />
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
        <h3 className="text-xl font-semibold mb-2 text-blue-800">{title}</h3>
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
      <h3 className="flex items-center mb-1 text-lg font-semibold text-blue-800">{title}</h3>
      <p className="mb-4 text-base font-normal text-gray-600">{description}</p>
    </li>
  );
}


type PlanCardProps = {
  title: string;
  description: string;
  price: string;
  features: string[];
  highlighted?: boolean;
};

function PlanCard({
  title,
  description,
  price,
  features,
  highlighted = false
}: PlanCardProps) {
  return (
    <Card className={`border-none ${highlighted ? 'shadow-xl ring-2 ring-blue-500' : 'shadow-md'}`}>
      <CardContent className="p-6">
        <h3 className={`text-2xl font-semibold mb-2 ${highlighted ? 'text-blue-600' : 'text-blue-800'}`}>{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <p className="text-3xl font-bold mb-6 text-blue-800">{price}<span className="text-sm font-normal text-gray-600">/month</span></p>
        <ul className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-gray-600">
              <Check className="w-5 h-5 mr-2 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button className={`w-full ${highlighted ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}>
          Choose Plan
        </Button>
      </CardContent>
    </Card>
  );
}
