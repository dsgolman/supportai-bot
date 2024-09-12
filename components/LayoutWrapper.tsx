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
      <main className="">
        {children}
      </main>
      {/* <footer className="bg-blue-800 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 Daily Dose. All rights reserved.</p>
        </div>
      </footer> */}
    </>
  )
}