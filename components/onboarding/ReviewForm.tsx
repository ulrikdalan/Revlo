'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

type ReviewFormProps = {
  initialCustomer: { name: string; email: string } | null
  onSuccess: () => void
}

export function ReviewForm({ initialCustomer, onSuccess }: ReviewFormProps) {
  const [name, setName] = useState(initialCustomer?.name || '')
  const [email, setEmail] = useState(initialCustomer?.email || '')
  const [reviewLink, setReviewLink] = useState('')
  const [subject, setSubject] = useState('Vil du gi oss en vurdering?')
  const [content, setContent] = useState(`Hei {{name}},

Takk for at du valgte oss! Vi setter stor pris på om du kan gi oss en vurdering.
Det tar bare 30 sekunder og betyr mye for oss.

Klikk her for å gi din vurdering: {{link}}

Tusen takk for din hjelp!

Med vennlig hilsen,
[Ditt firma]`)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/send-review-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          reviewLink,
          subject,
          body: content
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Feil ved sending av e-post')
      }

      onSuccess()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Navn
        </label>
        <input
          id="name"
          type="text"
          placeholder="Kundens navn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded p-2"
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
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded p-2"
          required
        />
      </div>

      <div>
        <label htmlFor="reviewLink" className="block text-sm font-medium text-gray-700 mb-1">
          Anmeldelseslenke
        </label>
        <input
          id="reviewLink"
          type="text"
          placeholder="https://..."
          value={reviewLink}
          onChange={(e) => setReviewLink(e.target.value)}
          className="w-full border rounded p-2"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          For eksempel: Link til din Google My Business-side, Trustpilot, eller egendefinert anmeldelsesside.
        </p>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          E-post emne
        </label>
        <input
          id="subject"
          type="text"
          placeholder="Emne for e-posten"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border rounded p-2"
          required
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          E-post innhold
        </label>
        <p className="text-xs text-gray-500 mb-1">
          Tips: {'{{'} name {'}}' } blir erstattet med kundens navn og {'{{'} link {'}}' } med anmeldelseslenken.
        </p>
        <textarea
          id="content"
          placeholder="Innhold for e-posten..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border rounded p-2"
          rows={6}
          required
        />
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">
          {error}
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
            Sender...
          </>
        ) : (
          'Send vurderingsforespørsel'
        )}
      </Button>
    </form>
  )
} 