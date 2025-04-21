'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/login')
    }
  }, [isLoading, session, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen pointer-events-none">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Don't wrap the children in an extra div to avoid potential pointer-events issues
  return session ? <>{children}</> : null
} 