'use client';

import { useState, useEffect } from 'react';

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  content: string;
  created_at: string;
  user_id: string;
};

export default function ReviewForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reviewLink, setReviewLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Hent e-postmaler når komponenten lastes
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const response = await fetch('/api/email-templates', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Kunne ikke hente e-postmaler');
        }
        
        const data = await response.json();
        setTemplates(data.templates || []);
      } catch (err) {
        console.error('Error fetching email templates:', err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    
    fetchTemplates();
  }, []);

  // Oppdater subject og content når en mal er valgt
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);
    
    if (templateId) {
      const selectedTemplate = templates.find(t => t.id === templateId);
      if (selectedTemplate) {
        setSubject(selectedTemplate.subject);
        setContent(selectedTemplate.content);
      }
    } else {
      // Reset hvis "Velg mal" er valgt
      setSubject('');
      setContent('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/send-review-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          reviewLink,
          subject,
          body: content // Bruk content som body for bakoverkompatibilitet med API
        }),
      });
  
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Feil ved sending av e-post');
      }
      
      setSuccess(true);
      // Reset skjemaet
      setName('');
      setEmail('');
      setReviewLink('');
      setSelectedTemplateId('');
      setSubject('');
      setContent('');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <div>
        <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
          Velg e-postmal (valgfritt)
        </label>
        <select
          id="template"
          value={selectedTemplateId}
          onChange={handleTemplateChange}
          className="border px-4 py-2 w-full rounded"
          disabled={loadingTemplates}
        >
          <option value="">Velg mal...</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>
      
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
          className="border px-4 py-2 w-full rounded"
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
          className="border px-4 py-2 w-full rounded"
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
          className="border px-4 py-2 w-full rounded"
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
          placeholder="Emne for e-posten"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="border px-4 py-2 w-full rounded"
          required
        />
      </div>
      
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          E-post innhold
        </label>
        <p className="text-xs text-gray-500 mb-1">
          Tips: Bruk {'{{name}}'} for kundens navn og {'{{link}}'} for anmeldelseslenken.
        </p>
        <textarea
          id="content"
          placeholder="Innhold for e-posten..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border px-4 py-2 w-full rounded"
          rows={6}
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Sender...' : 'Send vurderingsforespørsel'}
      </button>
      
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded">
          E-post sendt! Kunden vil motta en e-post med anmeldelseslenken.
        </div>
      )}
    </form>
  );
} 