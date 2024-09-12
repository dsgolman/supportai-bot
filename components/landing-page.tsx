'use client';

import React, { ReactNode } from 'react';
import Link from "next/link";
import { motion } from "framer-motion";
import { Sun, Users, Heart, Mic, MessageSquare, ArrowRight, Bell } from "lucide-react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e0d0c1]">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-[#b7410e]">{title}</h3>
      <p className="text-[#5c4033]">{description}</p>
    </div>
  );
}

interface JourneyStepProps {
  number: string;
  title: string;
  description: string;
}

function JourneyStep({ number, title, description }: JourneyStepProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e0d0c1]">
      <div className="text-4xl font-bold text-[#f4a261] mb-2">{number}</div>
      <h3 className="text-xl font-semibold mb-2 text-[#b7410e]">{title}</h3>
      <p className="text-[#5c4033]">{description}</p>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fdf6e3] text-[#5c4033] font-sans">
      <main className="container mx-auto px-4 py-20">
        <header className="mb-20">
          <nav className="flex justify-between items-center">
            <div className="text-3xl font-bold text-[#b7410e]">
              Wellness Circles
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="w-6 h-6 text-[#5c4033]" />
              <Link 
                href="/login" 
                className="bg-white text-[#5c4033] px-4 py-2 rounded-full text-sm font-medium border border-[#5c4033] hover:bg-[#f0e6d2] transition-colors"
              >
                Login
              </Link>
            </div>
          </nav>
        </header>

        <section className="text-center mb-20">
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6 text-[#b7410e]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Find Solace in Our Circles
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-[#5c4033] mb-10 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Join our supportive community for mental, emotional, and physical well-being. 
            Experience the warmth of connection in our virtual circles.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link 
              href="/support" 
              className="bg-[#f4a261] text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-[#e76f51] transition-colors inline-flex items-center"
            >
              Join a Circle <ArrowRight className="ml-2" />
            </Link>
          </motion.div>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 mb-20">
          <FeatureCard 
            icon={<Sun className="w-10 h-10 text-[#f4a261]" />}
            title="Find Your Light"
            description="Discover inner peace and clarity through guided discussions and shared experiences."
          />
          <FeatureCard 
            icon={<Users className="w-10 h-10 text-[#f4a261]" />}
            title="Supportive Community"
            description="Connect with others who understand your journey in a safe, nurturing environment."
          />
          <FeatureCard 
            icon={<Heart className="w-10 h-10 text-[#f4a261]" />}
            title="Emotional Healing"
            description="Process your emotions and find comfort in our specialized healing circles."
          />
          <FeatureCard 
            icon={<Mic className="w-10 h-10 text-[#f4a261]" />}
            title="Voice Connections"
            description="Engage in audio rooms for a more personal and immersive experience."
          />
          <FeatureCard 
            icon={<MessageSquare className="w-10 h-10 text-[#f4a261]" />}
            title="24/7 Support"
            description="Access our circles anytime, ensuring support is always within reach."
          />
          <FeatureCard 
            icon={<Sun className="w-10 h-10 text-[#f4a261]" />}
            title="Holistic Wellness"
            description="Address mental, emotional, and physical aspects of well-being in our comprehensive approach."
          />
        </section>

        <section className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#b7410e]">
            Your Journey to Inner Peace
          </h2>
          <p className="text-xl text-[#5c4033] mb-10 max-w-3xl mx-auto">
            Embark on a transformative journey with our wellness circles. 
            Here's how you can find solace and growth in our community:
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <JourneyStep number="1" title="Join a Circle" description="Choose a wellness circle that resonates with your current needs." />
            <JourneyStep number="2" title="Connect & Share" description="Engage with others in a safe, moderated environment." />
            <JourneyStep number="3" title="Reflect & Grow" description="Absorb insights and apply them to your daily life." />
            <JourneyStep number="4" title="Return & Flourish" description="Come back regularly to continue your growth and healing." />
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#b7410e]">
            Ready to Find Your Solace?
          </h2>
          <p className="text-xl text-[#5c4033] mb-10 max-w-3xl mx-auto">
            Join our community today and start your journey towards inner peace and well-being.
          </p>
          <Link 
            href="/signup" 
            className="bg-[#f4a261] text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-[#e76f51] transition-colors inline-flex items-center"
          >
            Get Started <ArrowRight className="ml-2" />
          </Link>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;