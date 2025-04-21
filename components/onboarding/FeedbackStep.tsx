import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface FeedbackStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function FeedbackStep({ onNext, onBack }: FeedbackStepProps) {
  const [source, setSource] = useState('');
  const [goal, setGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/onboarding-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source, goal }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      toast({
        title: 'Takk for tilbakemeldingen!',
        description: 'Din tilbakemelding hjelper oss å forbedre ZenVouch.',
      });
      
      onNext();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Noe gikk galt',
        description: 'Vi kunne ikke lagre din tilbakemelding. Vennligst prøv igjen senere.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Hjelp oss å forbedre ZenVouch</CardTitle>
        <CardDescription>
          Fortell oss litt om deg selv og hvordan du planlegger å bruke ZenVouch
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="source">Hvordan hørte du om ZenVouch?</Label>
            <Input
              id="source"
              placeholder="F.eks. sosiale medier, søkemotor, anbefaling fra en venn..."
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal">Hva er ditt hovedmål med å bruke ZenVouch?</Label>
            <Textarea
              id="goal"
              placeholder="F.eks. samle kundeomtaler, øke nettstedstrafikk, forbedre kundetilfredshet..."
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Tilbake
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onNext}>
              Hopp over
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sender...' : 'Send og fortsett'}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
} 