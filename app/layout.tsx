// app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PSYFE SPACE",
  description: "A SAFE SPACE FOR ALL MENTAL HEALTH NEEDS",
};

// function BrainIcon(props) {
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
//       <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
//       <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
//       <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
//       <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
//       <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
//       <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
//       <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
//       <path d="M6 18a4 4 0 0 1-1.967-.516" />
//       <path d="M19.967 17.484A4 4 0 0 1 18 18" />
//     </svg>
//   )
// }

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-gray-800 text-white py-4">
          <div className="container mx-auto flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              {/*<BrainIcon className="h-6 w-6" /> PSYFE.ai*/}
            </Link>
            <nav className="space-x-4">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/support" className="hover:underline">Support</Link>
              <Link href="#assistants" className="hover:underline">Assistants</Link>
              <Link href="#testimonials" className="hover:underline">Testimonials</Link>
              <Link href="#contact" className="hover:underline">Contact</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="bg-gray-800 text-white py-4">
          <div className="container mx-auto text-center">
            &copy; {new Date().getFullYear()} PSYFE.ai. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
