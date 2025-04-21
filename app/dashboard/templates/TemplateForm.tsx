'use client';

import { useState } from 'react';

type TemplateFormProps = {
  onSuccess?: () => void;
  initialData?: {
    id?: string;
    name: string;
    subject: string;
    body: string;
  };
  mode?: 'create' | 'edit';
};

export default function TemplateForm({ 
  onSuccess, 
  initialData = { name: '', subject: '', body: '' },
  mode = 'create'
}: TemplateFormProps) {
  const [name, setName] = useState(initialData.name);
  const [subject, setSubject] = useState(initialData.subject);
  const [body, setBody] = useState(initialData.body);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subject, body }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Noe gikk galt ved lagring av malen');
      }

      setSuccess(true);
      
      // Reset skjemaet etter vellykket lagring
      if (mode === 'create') {
        setName('');
        setSubject('');
        setBody('');
      }
      
      // Kall onSuccess-callback hvis den er gitt
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error saving template:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Malnavn
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="F.eks. Standard vurderingsforespørsel"
          required
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          E-post emne
        </label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="F.eks. Vi ønsker din tilbakemelding!"
          required
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
          E-post innhold
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Du kan bruke {'{'}{'{'}'name'{'}'}{'}}'} som variabel for kundens navn og {'{'}{'{'}'link'{'}'}{'}}'} for vurderingslenken.
        </p>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="F.eks. Hei {{name}}, vi setter pris på om du kan gi oss en vurdering. Klikk her: {{link}}"
          required
        />
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded">
          Malen ble lagret!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
      >
        {loading ? 'Lagrer...' : mode === 'create' ? 'Opprett mal' : 'Oppdater mal'}
      </button>
    </form>
  );
} 