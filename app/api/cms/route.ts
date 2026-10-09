import { NextRequest, NextResponse } from 'next/server';
import { requestHasAdminAuth } from '@/lib/admin-auth';
import { mergeIncomingCmsData, readCmsData, writeCmsData } from '@/lib/cms-store';

export async function GET() {
  const data = await readCmsData();
  return NextResponse.json({ success: true, data });
}

export async function PUT(request: NextRequest) {
  if (!requestHasAdminAuth(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'Invalid CMS payload' }, { status: 400 });
  }

  const current = await readCmsData();
  const saved = await writeCmsData(mergeIncomingCmsData(current, body as Record<string, unknown>));
  return NextResponse.json({ success: true, data: saved });
}
