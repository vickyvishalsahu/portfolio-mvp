import { NextResponse } from 'next/server';
import { getJobs } from '@/domains/notifications/jobStore';

export const GET = () => NextResponse.json(getJobs());
