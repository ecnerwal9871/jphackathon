'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProfile, updateProfile } from '@/lib/api';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  phone: z.string().min(7, 'Valid phone required'),
  preferredLanguage: z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Spanish', 'French', 'Arabic', 'Mandarin', 'Other'];

export default function ProfilePage() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    getProfile().then(p => reset({ name: p.name, phone: p.phone, preferredLanguage: p.preferredLanguage })).catch(console.error);
  }, [reset]);

  async function onSubmit(data: FormData) {
    await updateProfile(data);
    alert('Profile updated!');
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-brand-900">My Profile</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-8 shadow space-y-6">
        <div>
          <label className="block text-lg font-semibold mb-1">Full Name *</label>
          <input {...register('name')} className="w-full border-2 rounded-xl px-4 py-3 text-lg" />
          {errors.name && <p className="text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-lg font-semibold mb-1">Phone Number *</label>
          <input {...register('phone')} placeholder="+1 555 000 0000" className="w-full border-2 rounded-xl px-4 py-3 text-lg" />
          {errors.phone && <p className="text-red-600">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="block text-lg font-semibold mb-1">Preferred Language *</label>
          <select {...register('preferredLanguage')} className="w-full border-2 rounded-xl px-4 py-3 text-lg">
            <option value="">Select...</option>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          {errors.preferredLanguage && <p className="text-red-600">{errors.preferredLanguage.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting || !isDirty}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl text-xl transition disabled:opacity-60">
          {isSubmitting ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
