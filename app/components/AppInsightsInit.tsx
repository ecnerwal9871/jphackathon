'use client';
import { useEffect } from 'react';
import { initAppInsights } from '@/lib/appInsights';

export default function AppInsightsInit() {
  useEffect(() => {
    initAppInsights();
  }, []);
  return null;
}
