import { NextRequest, NextResponse } from 'next/server';
import { requestHasAdminAuth } from '@/lib/admin-auth';
import { createId, updateCmsData } from '@/lib/cms-store';
import type { ContactSubmission } from '@/lib/cms-types';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const message = String(body.message || '').trim();

  if (!name || !email || !message) {
    return NextResponse.json({ success: false, error: 'Name, email, and message are required' }, { status: 400 });
  }

  const submission: ContactSubmission = {
    id: createId('contact'),
    name,
    email,
    interest: String(body.interest || '').trim(),
    phone: String(body.phone || '').trim(),
    message,
    createdAt: new Date().toISOString(),
  };

  await updateCmsData((current) => ({
    ...current,
    contact: { ...current.contact, submissions: [submission, ...(current.contact.submissions || [])] },
  }));

  return NextResponse.json({ success: true, data: submission });
}

export async function DELETE(request: NextRequest) {
  if (!requestHasAdminAuth(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing submission id' }, { status: 400 });
  }

  const data = await updateCmsData((current) => ({
    ...current,
    contact: { ...current.contact, submissions: (current.contact.submissions || []).filter((item) => item.id !== id) },
  }));

  return NextResponse.json({ success: true, data });
}
