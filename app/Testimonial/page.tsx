'use client';

import { useState } from 'react';
import { Star, MessageSquareQuote, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import Link from 'next/link';

type TestimonialResponse = {
  _id: string;
  name: string;
  avatar?: string;
  designation?: string;
  company?: string;
  rating: number;
  message: string;
  approvedAt?: string;
  createdAt: string;
};

const staticTestimonials: TestimonialResponse[] = [
  {
    _id: '1',
    name: 'Aarav Sharma',
    designation: 'Founder',
    company: 'TechStart',
    rating: 5,
    message: 'Kaiyo delivered an exceptional website that perfectly captures our brand. Highly recommend!',
    createdAt: new Date().toISOString(),
  },
  {
    _id: '2',
    name: 'Priya Patel',
    designation: 'CEO',
    company: 'DesignHub',
    rating: 5,
    message: 'Amazing team, fast delivery, and great support. Our conversions increased by 40%.',
    createdAt: new Date().toISOString(),
  },
];

function TestimonialSkeleton() {
  return (
    <div className="relative">
      <div className="bg-white rounded-[30px] shadow-md pt-10 pb-8 px-6 min-h-[220px] animate-pulse">
        <div className="flex justify-end mb-4">
          <div className="w-20 h-20 rounded-full bg-gray-200" />
        </div>
        <div className="h-8 w-40 rounded-full mb-3 bg-gray-200" />
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-5 h-5 rounded bg-gray-200" />
          ))}
        </div>
        <div className="h-16 w-full bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export default function TestimonialsPage() {
  const [testimonials] = useState<TestimonialResponse[]>(staticTestimonials);
  const [page, setPage] = useState(1);
  const totalPages = 1;
  const hasMore = false;
  const loading = false;
  const error: string | null = null;

  return (
    <div className="bg-[#E9E9E7] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight text-gray-900">
              <span className="text-[#2f4f3f]">See Why</span> Clients Love
              <br />
              Kaiyo.
            </h1>
            <p className="mt-8 text-lg text-gray-600 max-w-xl leading-relaxed">
              Check out what others are saying about us or leave your
              feedback. Your reviews help us grow and improve every step
              of the way. Join thousands of happy clients who trust us.
              Don&rsquo;t just take our word for it&mdash;read their reviews now.
            </p>
            <Link
              href="/Testimonial/submit"
              className="mt-6 inline-flex items-center gap-2 bg-[#2f4f3f] hover:bg-[#63776d] text-white px-8 py-4 rounded-full font-semibold transition"
            >
              <Send className="w-5 h-5" />
              Leave Your Feedback
            </Link>
          </div>
          <div className="flex justify-center">
            <img src="/images/download.png" alt="" />
          </div>
        </div>

        {error && (
          <div className="text-center py-12">
            <div className="bg-red-50 text-red-600 rounded-2xl p-6 max-w-md mx-auto">
              <p className="font-semibold">Something went wrong</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="grid md:grid-cols-2 gap-16">
            {[1, 2, 3, 4].map((i) => (
              <TestimonialSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && !error && testimonials.length === 0 && (
          <div className="text-center py-16">
            <MessageSquareQuote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600">No testimonials yet</h3>
            <p className="text-gray-400 mt-2">Be the first to share your experience!</p>
            <Link
              href="/Testimonial/submit"
              className="mt-6 inline-flex items-center gap-2 bg-[#2f4f3f] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#63776d] transition"
            >
              <Send className="w-4 h-4" />
              Submit Testimonial
            </Link>
          </div>
        )}

        {!loading && testimonials.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 gap-16">
              {testimonials.map((item) => (
                <div key={item._id} className="relative">
                  <div className="absolute -top-8 right-8 z-10">
                    {item.avatar ? (
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="w-20 h-20 rounded-full border-4 border-white shadow-xl object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl bg-[#2f4f3f] flex items-center justify-center text-white text-2xl font-bold">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded-[30px] shadow-md pt-10 pb-8 px-6 min-h-[220px]">
                    <div className="inline-flex items-center bg-[#2f4f3f] text-white px-8 py-4 rounded-full font-semibold text-lg mb-3">
                      {item.name}
                    </div>
                    {(item.designation || item.company) && (
                      <p className="text-sm text-gray-500 mb-3 pl-2">
                        {[item.designation, item.company].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, index) => (
                        <Star
                          key={index}
                          size={22}
                          fill={index < item.rating ? '#FACC15' : 'transparent'}
                          className={index < item.rating ? 'text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <div className="border-l-4 border-[#2f4f3f] pl-4">
                      <p className="text-gray-600 text-lg leading-relaxed">{item.message}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-4 text-right">
                      {new Date(item.approvedAt || item.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 bg-white px-4 py-2 rounded-full shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => (hasMore ? p + 1 : p))}
                  disabled={!hasMore}
                  className="flex items-center gap-1 bg-white px-4 py-2 rounded-full shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        <div className="text-center mt-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Trusted by Thousands of Happy Clients
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We value every review and continuously strive to provide
            exceptional service and support for our community.
          </p>
        </div>
      </div>
    </div>
  );
}
