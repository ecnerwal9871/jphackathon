'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createTrip } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const schema = z.object({
  fromAirport: z.string().length(3, 'Enter a 3-letter airport code').toUpperCase(),
  toAirport: z.string().length(3, 'Enter a 3-letter airport code').toUpperCase(),
  travelDate: z.string().min(1, 'Please select a date'),
  airline: z.string().min(2, 'Please select an airline'),
  flightNumber: z.string().optional(),
  contactNumber: z.string().min(7, 'Please enter a valid phone number'),
  language: z.string().min(1, 'Please select a language'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Spanish', 'French', 'Arabic', 'Mandarin', 'Other'];

const AIRLINES = [
  'Air Canada', 'Air France', 'Air India', 'Alaska Airlines', 'American Airlines',
  'ANA (All Nippon Airways)', 'British Airways', 'Cathay Pacific', 'Delta Air Lines',
  'Emirates', 'Etihad Airways', 'EVA Air', 'Frontier Airlines', 'Hawaiian Airlines',
  'IndiGo', 'Japan Airlines', 'JetBlue Airways', 'KLM Royal Dutch Airlines',
  'Korean Air', 'Lufthansa', 'Malaysia Airlines', 'Qantas', 'Qatar Airways',
  'Singapore Airlines', 'Southwest Airlines', 'Spirit Airlines', 'Sri Lankan Airlines',
  'Swiss International Air Lines', 'Thai Airways', 'Turkish Airlines',
  'United Airlines', 'Vietnam Airlines', 'Virgin Atlantic', 'WestJet', 'Other',
];

export default function RequestPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  async function onSubmit(data: FormData) {
    setSubmitError('');
    try {
      await createTrip({ ...data, type: 'request' });
      setSuccess(true);
      setTimeout(() => { window.location.href = '/dashboard'; }, 2000);
    } catch (e) {
      setSubmitError((e as Error).message || 'Something went wrong. Please try again.');
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="text-5xl">✅</div>
        <h1 className="text-3xl font-bold text-green-700">Your request has been posted!</h1>
        <p className="text-lg text-gray-700">Taking you to your dashboard where you can track matches...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">Request Travel Assistance</h1>
        <p className="text-lg text-gray-700 mt-2">Tell us about your flight. A volunteer on the same route will be able to offer help.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-6 sm:p-8 shadow space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-lg font-semibold mb-1">Departure airport code *</label>
            <p className="text-base text-gray-600 mb-2">3 letters — e.g. JFK for New York, LHR for London</p>
            <input {...register('fromAirport')} placeholder="JFK" className="w-full border-2 rounded-xl px-4 py-3 text-lg uppercase focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
            {errors.fromAirport && <p className="text-red-600 text-base font-medium mt-1">{errors.fromAirport.message}</p>}
          </div>
          <div>
            <label className="block text-lg font-semibold mb-1">Arrival airport code *</label>
            <p className="text-base text-gray-600 mb-2">3 letters — e.g. DEL for Delhi, SIN for Singapore</p>
            <input {...register('toAirport')} placeholder="LHR" className="w-full border-2 rounded-xl px-4 py-3 text-lg uppercase focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
            {errors.toAirport && <p className="text-red-600 text-base font-medium mt-1">{errors.toAirport.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-lg font-semibold mb-1">Travel date *</label>
            <input {...register('travelDate')} type="date" className="w-full border-2 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
            {errors.travelDate && <p className="text-red-600 text-base font-medium mt-1">{errors.travelDate.message}</p>}
          </div>
          <div>
            <label className="block text-lg font-semibold mb-1">Airline *</label>
            <select {...register('airline')} className="w-full border-2 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
              <option value="">Choose your airline...</option>
              {AIRLINES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            {errors.airline && <p className="text-red-600 text-base font-medium mt-1">{errors.airline.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-lg font-semibold mb-1">Flight number (optional)</label>
            <p className="text-base text-gray-600 mb-2">e.g. BA178 — check your ticket</p>
            <input {...register('flightNumber')} placeholder="BA178" className="w-full border-2 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-lg font-semibold mb-1">Language you speak *</label>
            <select {...register('language')} className="w-full border-2 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
              <option value="">Choose a language...</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {errors.language && <p className="text-red-600 text-base font-medium mt-1">{errors.language.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-lg font-semibold mb-1">Your phone number *</label>
          <p className="text-base text-gray-600 mb-2">🔒 Only shared after you confirm a match — never before.</p>
          <input {...register('contactNumber')} placeholder="+1 555 000 0000" className="w-full border-2 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
          {errors.contactNumber && <p className="text-red-600 text-base font-medium mt-1">{errors.contactNumber.message}</p>}
        </div>
        <div>
          <label className="block text-lg font-semibold mb-1">Anything else we should know? (optional)</label>
          <textarea {...register('notes')} rows={3} placeholder="e.g. I use a wheelchair, I need help with luggage..." className="w-full border-2 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
        </div>
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-lg font-medium">
            ⚠️ {submitError}
          </div>
        )}
        <button type="submit" disabled={isSubmitting}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-5 rounded-xl text-xl transition disabled:opacity-60">
          {isSubmitting ? 'Submitting your request...' : '📋 Post My Request'}
        </button>
      </form>
    </div>
  );
}
