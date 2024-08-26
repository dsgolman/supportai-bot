import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

/**
 * Add fonts into your Next.js project:
 *
 * import { IBM_Plex_Sans } from 'next/font/google'
 * import { Gabarito } from 'next/font/google'
 *
 * ibm_plex_sans({
 *   subsets: ['latin'],
 *   display: 'swap',
 * })
 *
 * gabarito({
 *   subsets: ['latin'],
 *   display: 'swap',
 * })
 *
 * To read more about using these fonts, please visit the Next.js documentation:
 * - App Directory: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
 * - Pages Directory: https://nextjs.org/docs/pages/building-your-application/optimizing/fonts
 **/

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Welcome to PSYFE.SPACE
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Discover a holistic approach to mental health with our AI-powered assistants. At PSYFE.SPACE, we offer a range of virtual support tailored to your psychological, somatic, gender-related, emotional, and environmental needs.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    href="/get-started"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                  >
                    Get Started
                  </Link>
                  <Link
                    href="#about"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <img
                src="/placeholder.svg"
                width="550"
                height="550"
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
              />
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Our Services</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Comprehensive Support with AI</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  PSYFE.SPACE offers an array of AI-powered services to address various aspects of mental health, from peer support to crisis intervention.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-1">
                {/*<UserPlusIcon className="mx-auto h-12 w-12 text-primary" />*/}
                <h3 className="text-xl font-bold">Peer Support</h3>
                <p className="text-muted-foreground">Engage with AI-driven peer support tailored to your needs.</p>
                <Link
                  href="/peer-support"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  prefetch={false}
                >
                  Try Now
                </Link>
              </div>
              <div className="grid gap-1">
                {/*<GroupIcon className="mx-auto h-12 w-12 text-primary" />*/}
                <h3 className="text-xl font-bold">Support Groups</h3>
                <p className="text-muted-foreground">
                  Participate in virtual support groups for specific mental health concerns with AI facilitation.
                </p>
                <Link
                  href="/support-groups"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  prefetch={false}
                >
                  Try Now
                </Link>
              </div>
              <div className="grid gap-1">
                {/*<AmbulanceIcon className="mx-auto h-12 w-12 text-primary" />*/}
                <h3 className="text-xl font-bold">Crisis Intervention</h3>
                <p className="text-muted-foreground">Immediate AI-supported intervention for mental health crises.</p>
                <Link
                  href="/crisis-intervention"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  prefetch={false}
                >
                  Try Now
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32" id="assistants">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Our Assistants</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Meet Our AI Assistants</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Explore the range of AI assistants designed to provide support and guidance through various mental health needs.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <div className="grid gap-1">
                <img
                  src="/placeholder.svg"
                  width="550"
                  height="310"
                  alt="Mindful Meditation Assistant"
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
                />
                <h3 className="text-xl font-bold">Mindful Meditation</h3>
                <p className="text-muted-foreground">Experience guided meditations to enhance relaxation and inner peace.</p>
                <Link
                  href="/mindful-meditation"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  prefetch={false}
                >
                  Try Now
                </Link>
              </div>
              <div className="grid gap-1">
                <img
                  src="/placeholder.svg"
                  width="550"
                  height="310"
                  alt="Cognitive Behavioral Therapy Assistant"
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
                />
                <h3 className="text-xl font-bold">Cognitive Behavioral Therapy</h3>
                <p className="text-muted-foreground">Utilize personalized CBT exercises to improve your mental well-being.</p>
                <Link
                  href="/cbt"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  prefetch={false}
                >
                  Try Now
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-t-muted-foreground bg-background py-12">
        <div className="container flex flex-col items-center space-y-4 px-4 md:px-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} PSYFE.SPACE. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}


// function AmbulanceIcon(props) {
//   return (
//     <svg
//       {...props}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <path d="M10 10H6" />
//       <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
//       <path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14" />
//       <path d="M8 8v4" />
//       <path d="M9 18h6" />
//       <circle cx="17" cy="18" r="2" />
//       <circle cx="7" cy="18" r="2" />
//     </svg>
//   )
// }

// function GroupIcon(props) {
//   return (
//     <svg
//       {...props}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <path d="M3 7V5c0-1.1.9-2 2-2h2" />
//       <path d="M17 3h2c1.1 0 2 .9 2 2v2" />
//       <path d="M21 17v2c0 1.1-.9 2-2 2h-2" />
//       <path d="M7 21H5c-1.1 0-2-.9-2-2v-2" />
//       <rect width="7" height="5" x="7" y="7" rx="1" />
//       <rect width="7" height="5" x="10" y="12" rx="1" />
//     </svg>
//   )
// }


// function UserPlusIcon(props) {
//   return (
//     <svg
//       {...props}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
//       <circle cx="9" cy="7" r="4" />
//       <line x1="19" x2="19" y1="8" y2="14" />
//       <line x1="22" x2="16" y1="11" y2="11" />
//     </svg>
//   )
// }
