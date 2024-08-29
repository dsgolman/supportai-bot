import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Daily Dose - Your Mental Health Companion',
  description: 'A supportive space for your mental wellness journey',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-white shadow-sm">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-blue-600">Daily Dose</h1>
              <ul className="flex space-x-4">
                <li><a href="/login" className="text-gray-600 hover:text-blue-600">Login</a></li>
                <li><a href="/support" className="text-gray-600 hover:text-blue-600">Support</a></li>
                <li><a href="/support?assistant=Daily%20Dose" className="text-gray-600 hover:text-blue-600">Start Session</a></li>
              </ul>
            </div>
          </nav>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="bg-blue-800 text-white py-4">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; 2024 Daily Dose. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}