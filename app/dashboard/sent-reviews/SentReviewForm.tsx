'use client';

import { useState } from 'react';

export default function SentReviewForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reviewLink, setReviewLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/send-review-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, reviewLink }),
    });

    if (res.ok) {
      setSuccess(true);
      setName('');
      setEmail('');
      setReviewLink('');
    } else {
      alert('Feil ved sending av e-post');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <input
        type="text"
        placeholder="Navn"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border px-4 py-2 w-full"
      />
      <input
        type="email"
        placeholder="E-post"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border px-4 py-2 w-full"
      />
      <input
        type="text"
        placeholder="Review-link"
        value={reviewLink}
        onChange={(e) => setReviewLink(e.target.value)}
        className="border px-4 py-2 w-full"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Sender...' : 'Send vurderingsforespørsel'}
      </button>
      {success && <p className="text-green-600">E-post sendt!</p>}
    </form>
  );
} 