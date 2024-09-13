import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import LayoutWrapper from "@/components/LayoutWrapper"
import { Toaster } from "@/components/ui/toaster"
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Serenity Circles - Find Peace With Serenity',
  description: 'A supportive space for your Holistic Health journey',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LayoutWrapper>
          {children}
          <Toaster />
        </LayoutWrapper>
      </body>
    </html>
  )
}