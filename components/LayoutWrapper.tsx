"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }

    checkAuth()
  }, [])

  return (
    <>
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">Daily Dose</h1>
            <ul className="flex space-x-4">
              {isLoggedIn ? (
                <>
                  <li><a href="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</a></li>
                  <li><a href="/support" className="text-gray-600 hover:text-blue-600">Support</a></li>
                  <li><a href="/support?assistant=Daily%20Dose" className="text-gray-600 hover:text-blue-600">Start Session</a></li>
                  <li><a href="#" onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    setIsLoggedIn(false)
                    router.push('/')
                  }} className="text-gray-600 hover:text-blue-600">Logout</a></li>
                </>
              ) : (
                <li><a href="/login" className="text-gray-600 hover:text-blue-600">Login</a></li>
              )}
            </ul>
          </div>
        </nav>
      </header>
      <main className="container mx-auto">
        {children}
      </main>
      <footer className="bg-blue-800 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 Daily Dose. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}