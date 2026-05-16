'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createTrip } from '@/lib/api';
import { useRouter } from 'next/navigation';

const schema = z.object({
  fromAirport: z.string().length(3, 'Must be a 3-letter IATA code').toUpperCase(),
  toAirport: z.string().length(3, 'Must be a 3-letter IATA code').toUpperCase(),
  travelDate: z.string().min(1, 'Required'),
  airline: z.string().min(2, 'Required'),
  flightNumber: z.string().optional(),
  contactNumber: z.string().min(7, 'Valid phone number required'),
  language: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Spanish', 'French', 'Arabic', 'Mandarin', 'Other'];

export default function VolunteerPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    await createTrip({ ...data, type: 'volunteer' });
    router.push('/dashboard');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">Offer to Volunteer</h1>
        <p className="text-lg text-gray-600 mt-2">Fill in your flight details to be matched with elderly travellers who need help.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-8 shadow space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-lg font-semibold mb-1">From Airport (IATA) *</label>
            <input {...register('fromAirport')} placeholder="e.g. JFK" className="w-full border-2 rounded-xl px-4 py-3 text-lg uppercase" />
            {errors.fromAirport && <p className="text-red-600">{errors.fromAirport.message}</p>}
          </div>
          <div>
            <label className="block text-lg font-semibold mb-1">To Airport (IATA) *</label>
            <input {...register('toAirport')} placeholder="e.g. LHR" className="w-full border-2 rounded-xl px-4 py-3 text-lg uppercase" />
            {errors.toAirport && <p className="text-red-600">{errors.toAirport.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-lg font-semibold mb-1">Travel Date *</label>
            <input {...register('travelDate')} type="date" className="w-full border-2 rounded-xl px-4 py-3 text-lg" />
            {errors.travelDate && <p className="text-red-600">{errors.travelDate.message}</p>}
          </div>
          <div>
            <label className="block text-lg font-semibold mb-1">Airline *</label>
            <input {...register('airline')} placeholder="e.g. British Airways" className="w-full border-2 rounded-xl px-4 py-3 text-lg" />
            {errors.airline && <p className="text-red-600">{errors.airline.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-lg font-semibold mb-1">Flight Number (optional)</label>
            <input {...register('flightNumber')} placeholder="e.g. BA178" className="w-full border-2 rounded-xl px-4 py-3 text-lg" />
          </div>
          <div>
            <label className="block text-lg font-semibold mb-1">Your Language *</label>
            <select {...register('language')} className="w-full border-2 rounded-xl px-4 py-3 text-lg">
              <option value="">Select...</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {errors.language && <p className="text-red-600">{errors.language.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-lg font-semibold mb-1">Contact Number *</label>
          <input {...register('contactNumber')} placeholder="+1 555 000 0000" className="w-full border-2 rounded-xl px-4 py-3 text-lg" />
          <p className="text-sm text-gray-500 mt-1">Only shared after a match is confirmed.</p>
          {errors.contactNumber && <p className="text-red-600">{errors.contactNumber.message}</p>}
        </div>
        <div>
          <label className="block text-lg font-semibold mb-1">Additional Notes (optional)</label>
          <textarea {...register('notes')} rows={3} placeholder="Any special needs or information..." className="w-full border-2 rounded-xl px-4 py-3 text-lg" />
        </div>
        <button type="submit" disabled={isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-xl transition disabled:opacity-60">
          {isSubmitting ? 'Submitting...' : 'Post Volunteer Offer'}
        </button>
      </form>
    </div>
  );
}
