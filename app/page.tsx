'use client';

import React from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const router = useRouter();

  const handleJoinCircle = () => {
    console.log("Joining a Serenity Circle");
    router.push("/support");
  };

  const handleStartCall = () => {
    console.log("Starting a call with Serenity");
    router.push("/session");
  };

  const handleJoinAnonymously = () => {
    console.log("Joining anonymously");
    router.push("/support");
  };

  const handleChatWithCoach = () => {
    console.log("Chatting with Serenity Coach");
    router.push("/session");
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#f5f5f5] text-[#333]">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-[#fff] shadow-md fixed top-0 left-0 right-0 z-50">
        <Link href="#" className="flex items-center justify-center">
          <SerenityIcon className="h-6 w-6 text-[#7b61ff]" />
          <span className="ml-2 font-bold text-[#7b61ff]">Serenity Circles</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-sm font-medium hover:text-[#7b61ff] transition-colors">
            Circles
          </Link>
          <Link href="#" className="text-sm font-medium hover:text-[#7b61ff] transition-colors">
            About
          </Link>
          <Link href="#" className="text-sm font-medium hover:text-[#7b61ff] transition-colors">
            Pricing
          </Link>
          <Link href="#" className="text-sm font-medium hover:text-[#7b61ff] transition-colors">
            Contact
          </Link>
        </nav>
      </header>
      <main className="flex-1 pt-14">
        <section className="min-h-[100dvh] flex items-center w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-[#fff]">
          <div className="container grid gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-[#333]">
                Find peace with <span className="text-[#7b61ff]">Serenity</span>
              </h1>
              <p className="max-w-[600px] text-[#666] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join Serenity Circles, your personalized AI-powered support community available 24/7 for mental,
                emotional, and physical well-being.
              </p>
              <div className="flex flex-col gap-4 min-[400px]:flex-row">
                <Button
                  onClick={handleJoinCircle}
                  className="inline-flex h-12 items-center justify-center rounded-md bg-[#7b61ff] px-8 text-lg font-medium text-white shadow-lg transition-colors hover:bg-[#6247ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7b61ff] focus-visible:ring-offset-2"
                >
                  Join a Serenity Circle
                </Button>
                <Button
                  onClick={handleChatWithCoach}
                  variant="outline"
                  className="inline-flex h-12 items-center justify-center rounded-md border-2 border-[#7b61ff] bg-white px-8 text-lg font-medium text-[#7b61ff] shadow-lg transition-colors hover:bg-[#f0f0f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7b61ff] focus-visible:ring-offset-2"
                >
                  Chat with Serenity Coach
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <img
                src="/placeholder.svg?height=550&width=550"
                alt="Serenity Circles"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:aspect-square"
              />
            </div>
          </div>
        </section>
        <section className="min-h-[100dvh] flex items-center w-full py-12 md:py-24 lg:py-32 bg-[#f5f5f5]">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-[#ddd] px-3 py-1 text-sm text-[#666]">Serenity Circles</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-[#333]">
                  Discover the Power of AI-Supported Community
                </h2>
                <p className="max-w-[900px] text-[#666] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our AI-powered support groups offer a safe and inclusive space for you to connect, heal, and grow
                  alongside like-minded individuals. Experience the transformative power of Serenity-driven wellness.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <ul className="grid gap-6">
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold text-[#333]">AI-Powered Support</h3>
                      <p className="text-[#666]">
                        Benefit from Serenity's advanced AI that provides personalized support and insights tailored to your unique journey.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold text-[#333]">Voice-First Interaction</h3>
                      <p className="text-[#666]">
                        Engage in natural, voice-based conversations that feel as comfortable as talking to a supportive friend.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold text-[#333]">24/7 Availability</h3>
                      <p className="text-[#666]">
                        Access Serenity Circles whenever you need support, guidance, or a listening ear.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold text-[#333]">Privacy Focused</h3>
                      <p className="text-[#666]">
                        Enjoy complete anonymity and confidentiality in all your interactions within Serenity Circles.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold text-[#333]">Goal-Oriented Growth</h3>
                      <p className="text-[#666]">
                        Set and achieve personal growth goals with Serenity's guidance and support.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <img
                src="/placeholder.svg?height=310&width=550"
                alt="Serenity Circles Features"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>
        <section className="min-h-[100dvh] flex items-center w-full py-12 md:py-24 lg:py-32 bg-[#fff]">
          <div className="container grid items-center gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-[#333]">
                Join a Serenity Circle Today
              </h2>
              <p className="max-w-[600px] text-[#666] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Experience the transformative power of AI-supported wellness. Start your journey towards holistic well-being with Serenity.
              </p>
            </div>
            <div className="flex flex-col gap-4 min-[400px]:flex-row lg:justify-end">
              <Button
                onClick={handleJoinCircle}
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#7b61ff] px-8 text-lg font-medium text-white shadow-lg transition-colors hover:bg-[#6247ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7b61ff] focus-visible:ring-offset-2"
              >
                Join a Circle
              </Button>
              <Button
                onClick={handleStartCall}
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#4CAF50] px-8 text-lg font-medium text-white shadow-lg transition-colors hover:bg-[#45a049] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4CAF50] focus-visible:ring-offset-2"
              >
                Start a Call
              </Button>
            </div>
          </div>
        </section>
        <section className="min-h-[100dvh] flex items-center w-full py-12 md:py-24 lg:py-32 border-t bg-[#f5f5f5]">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-[#333]">
                Ready to Find Your Serenity?
              </h2>
              <p className="mx-auto max-w-[600px] text-[#666] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join our AI-powered support community and start experiencing the transformative power of Serenity Circles.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-4">
              <Button
                onClick={handleJoinAnonymously}
                className="w-full inline-flex h-12 items-center justify-center rounded-md bg-[#7b61ff] px-8 text-lg font-medium text-white shadow-lg transition-colors hover:bg-[#6247ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7b61ff] focus-visible:ring-offset-2"
              >
                Join Anonymously
              </Button>
              <p className="text-xs text-[#666]">
                By joining, you agree to our{" "}
                <Link href="#" className="underline underline-offset-2 text-[#7b61ff]">
                  Terms &amp; Conditions
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-[#fff] shadow-md">
        <p className="text-xs text-[#666]">&copy; 2024 Serenity Circles. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:text-[#7b61ff] transition-colors">
            Privacy Policy
          </Link>
          <Link href="#" className="text-xs hover:text-[#7b61ff] transition-colors">
            Terms of Service
          </Link>
        </nav>
      </footer>
    </div>
  )
}

function SerenityIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5h0c-1.4 0-2.5-1.1-2.5-2.5V2" />
      <path d="M8.5 2h7" />
      <path d="M14.5 16h-5" />
    </svg>
  )
}