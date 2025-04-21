'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const supabase = createClientComponentClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!token) {
      setError('Invalid or missing token')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.updateUser({ 
        password 
      })
      
      if (error) throw error
      
      setSuccess(true)
      // Redirect to login after successful password reset
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Reset Your Password</h1>
        <p className="text-gray-500">Enter your new password below</p>
      </div>
      
      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              disabled={loading}
              required
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Reset Password'}
          </Button>
        </form>
      ) : (
        <div className="rounded-lg bg-green-50 p-4 text-green-700">
          <p>Password reset successful! Redirecting to login page...</p>
        </div>
      )}
    </div>
  )
} 