'use client';

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send, ArrowLeft, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

interface SolutionDetail {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  fullDescription: string;
  thumbnail: string;
  galleryImages: string[];
  tags: string[];
  featured: boolean;
  published: boolean;
  category: string;
  subCategory: string;
  hero?: { titleMain?: string; titleHighlight?: string; description?: string };
  gallery?: { url: string; _id: string }[];
}

export default function SolutionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const solution: SolutionDetail | null = slug ? {
    _id: slug,
    title: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    slug,
    description: 'Solution details',
    shortDescription: 'Explore our solution.',
    fullDescription: 'This is a static solution page. Contact us for more details.',
    thumbnail: '',
    galleryImages: [],
    tags: [],
    featured: false,
    published: true,
    category: '',
    subCategory: '',
  } : null;
  const related: SolutionDetail[] = [];
  const loading = false;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.message.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    toast.success('Inquiry submitted! We will contact you soon.');
    setForm({ name: '', email: '', phone: '', company: '', message: '' });
    setShowForm(false);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#171923]" />
      </div>
    );
  }

  if (!solution) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold text-[#0f172a]">Solution not found</h1>
        <Link href="/solutions" className="text-[#171923] underline">Back to solutions</Link>
      </div>
    );
  }

  const allImages = [
    ...(solution.thumbnail ? [solution.thumbnail] : []),
    ...(solution.galleryImages || []),
    ...(solution.gallery || []).map(g => g.url),
  ];

  return (
    <div className="min-h-screen bg-[#f7f3ed]">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/solutions" className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#0f172a] mb-6">
          <ArrowLeft size={16} /> Back to solutions
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div>
            {allImages.length > 0 && (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 mb-8">
                {allImages.slice(0, 6).map((img, i) => (
                  <div key={i} className="aspect-video rounded-xl overflow-hidden bg-[#e6e8ee]">
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#64748b]">
                        <ImageIcon size={24} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <h1 className="text-3xl font-bold text-[#0f172a] mb-3">{solution.title}</h1>
            {solution.shortDescription && (
              <p className="text-lg text-[#64748b] mb-4">{solution.shortDescription}</p>
            )}
            {solution.fullDescription && (
              <div className="prose prose-sm max-w-none text-[#64748b] whitespace-pre-line mb-6">
                {solution.fullDescription}
              </div>
            )}

            {solution.tags && solution.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {solution.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-[#e6e8ee] text-xs text-[#64748b]">{tag}</span>
                ))}
              </div>
            )}

            {related.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Related Solutions</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {related.map((r) => (
                    <Link key={r._id} href={`/solution/${r.slug}`} className="block p-4 rounded-xl border border-[#e6e8ee] bg-white hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-[#0f172a]">{r.title}</h3>
                      {r.shortDescription && <p className="mt-1 text-sm text-[#64748b] line-clamp-2">{r.shortDescription}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-8 self-start">
            <div className="rounded-2xl border border-[#e6e8ee] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Interested in this service?</h2>
              <p className="text-sm text-[#64748b] mb-6">Fill in your details and we&apos;ll get back to you.</p>

              {!showForm ? (
                <button onClick={() => setShowForm(true)} className="w-full bg-[#171923] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#242735] transition-colors">
                  Send Inquiry
                </button>
              ) : (
                <div className="space-y-3">
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-[#e6e8ee] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#171923]" placeholder="Your name *" />
                  <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full border border-[#e6e8ee] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#171923]" placeholder="Your email *" />
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full border border-[#e6e8ee] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#171923]" placeholder="Your phone *" />
                  <input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} className="w-full border border-[#e6e8ee] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#171923]" placeholder="Company (optional)" />
                  <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={3} className="w-full border border-[#e6e8ee] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#171923]" placeholder="Your message *" />
                  <button onClick={handleSubmit} disabled={submitting} className="w-full bg-[#171923] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#242735] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {submitting ? 'Sending...' : 'Submit Inquiry'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
