'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

type CustomerFormProps = {
  onSuccess?: (name: string, email: string) => void;
  isOnboarding?: boolean;
}

export default function CustomerForm({ onSuccess, isOnboarding = false }: CustomerFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      })

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Feil ved lagring av kunde');
      }

      const data = await res.json()
      console.log(data)
      
      // For onboarding flow, call the success callback with customer info
      if (onSuccess) {
        onSuccess(name, email);
      } else {
        setSuccess(true);
        setName('');
        setEmail('');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false)
    }
  }

  const formBaseClass = isOnboarding 
    ? "space-y-4" 
    : "p-4 space-y-4 bg-white rounded shadow max-w-md";

  return (
    <form onSubmit={handleSubmit} className={formBaseClass}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Navn
        </label>
        <input
          id="name"
          type="text"
          placeholder="Kundens navn"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          E-post
        </label>
        <input
          id="email"
          type="email"
          placeholder="Kundens e-postadresse"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">
          {error}
        </div>
      )}
      
      {success && !isOnboarding && (
        <div className="bg-green-100 text-green-700 p-3 rounded">
          Kunde lagt til!
        </div>
      )}
      
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Lagrer...
          </>
        ) : (
          'Legg til kunde'
        )}
      </Button>
    </form>
  )
} 