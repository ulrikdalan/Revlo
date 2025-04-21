'use client'

import { Suspense } from 'react'
import LoginForm from './LoginForm'

// Add a loading component for Suspense
function LoadingState() {
  return <div className="flex items-center justify-center min-h-screen">Loading...</div>
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LoginForm />
    </Suspense>
  )
} 