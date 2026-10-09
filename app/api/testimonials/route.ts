import { NextRequest, NextResponse } from 'next/server';
import { createId, updateCmsData } from '@/lib/cms-store';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const content = String(body.content || body.message || '').trim();
  const rating = Number(body.rating || 5);

  if (!name || !content || !Number.isFinite(rating)) {
    return NextResponse.json({ success: false, error: 'Name, rating, and feedback are required' }, { status: 400 });
  }

  const testimonial = {
    id: createId('testimonial'),
    name,
    content,
    avatar: String(body.avatar || '').trim(),
    image: String(body.avatar || body.image || '').trim(),
    designation: String(body.designation || '').trim(),
    company: String(body.company || '').trim(),
    rating: Math.max(1, Math.min(5, rating)),
    createdAt: new Date().toISOString(),
  };

  await updateCmsData((current) => ({
    ...current,
    testimonials: { ...current.testimonials, items: [testimonial, ...(current.testimonials.items || [])] },
  }));

  return NextResponse.json({ success: true, data: testimonial });
}
