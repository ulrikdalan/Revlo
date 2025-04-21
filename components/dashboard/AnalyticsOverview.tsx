'use client';

import { Mail, Star, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnalyticsOverviewProps {
  requestsSent?: number;
  reviewsReceived?: number;
  clickRate?: number;
  remindersSent?: number;
  weeklyGrowth?: number;
  conversionRate?: number;
  isAboveAverage?: boolean;
  newReminders?: number;
}

export default function AnalyticsOverview({
  requestsSent = 542,
  reviewsReceived = 182,
  clickRate = 47.8,
  remindersSent = 219,
  weeklyGrowth = 34,
  conversionRate = 33.6,
  isAboveAverage = true,
  newReminders = 17
}: AnalyticsOverviewProps) {
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Forespørsler sendt */}
      <Card className="rounded-2xl shadow-md overflow-hidden">
        <CardHeader className="pb-2 relative">
          <div className="absolute top-4 right-4 p-2 bg-blue-100 text-blue-600 rounded-full">
            <Mail className="h-5 w-5" />
          </div>
          <CardTitle className="text-sm font-medium text-gray-500">
            Forespørsler sendt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{requestsSent}</div>
          <p className="text-sm font-medium text-green-600 mt-1">
            +{weeklyGrowth}% siste uke
          </p>
        </CardContent>
      </Card>

      {/* Anmeldelser mottatt */}
      <Card className="rounded-2xl shadow-md overflow-hidden">
        <CardHeader className="pb-2 relative">
          <div className="absolute top-4 right-4 p-2 bg-yellow-100 text-yellow-600 rounded-full">
            <Star className="h-5 w-5" />
          </div>
          <CardTitle className="text-sm font-medium text-gray-500">
            Anmeldelser mottatt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reviewsReceived}</div>
          <p className="text-sm font-medium text-gray-600 mt-1">
            Conversion rate: {conversionRate}%
          </p>
        </CardContent>
      </Card>

      {/* Klikkrate */}
      <Card className="rounded-2xl shadow-md overflow-hidden">
        <CardHeader className="pb-2 relative">
          <div className="absolute top-4 right-4 p-2 bg-green-100 text-green-600 rounded-full">
            <TrendingUp className="h-5 w-5" />
          </div>
          <CardTitle className="text-sm font-medium text-gray-500">
            Klikkrate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(clickRate)}</div>
          <p className={cn("text-sm font-medium mt-1", isAboveAverage ? "text-green-600" : "text-yellow-600")}>
            {isAboveAverage ? "Over gjennomsnittet" : "Under gjennomsnittet"}
          </p>
        </CardContent>
      </Card>

      {/* Påminnelser sendt */}
      <Card className="rounded-2xl shadow-md overflow-hidden">
        <CardHeader className="pb-2 relative">
          <div className="absolute top-4 right-4 p-2 bg-purple-100 text-purple-600 rounded-full">
            <Clock className="h-5 w-5" />
          </div>
          <CardTitle className="text-sm font-medium text-gray-500">
            Påminnelser sendt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{remindersSent}</div>
          <p className="text-sm font-medium text-gray-600 mt-1">
            {newReminders} nye siste 24t
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 