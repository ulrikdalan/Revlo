"use client";

import { Suspense } from 'react'
import ResetPasswordForm from './ResetPasswordForm'

export default function ResetPasswordPage() {
  // Add a simple static page that doesn't use useSearchParams directly
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Suspense fallback={<div className="text-center py-8">Loading password reset form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic' 