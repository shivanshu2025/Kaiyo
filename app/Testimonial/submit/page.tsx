'use client';

import { useState } from 'react';
import { Send, Star, X } from 'lucide-react';
import { toast, Toaster } from 'sonner';

const CHARACTER_LIMIT = 1000;

export default function SubmitTestimonialPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({
    name: '',
    avatar: '',
    designation: '',
    company: '',
    rating: 0,
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const messageLength = form.message.length;

  const handleRatingClick = (rating: number) => {
    setSelectedRating(rating);
    setForm((p) => ({ ...p, rating }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setImagePreview(url);
      setForm((p) => ({ ...p, avatar: url }));
      setUploadingImage(false);
    };
    reader.onerror = () => {
      toast.error('Failed to upload image');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setForm((p) => ({ ...p, avatar: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.rating || form.rating < 1) e.rating = 'Rating is required';
    if (!form.message.trim()) e.message = 'Message is required';
    else if (form.message.length > CHARACTER_LIMIT) e.message = 'Message too long';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;
    setIsSubmitting(true);
    toast.success('Testimonial submitted successfully! It will be visible after review.');
    setSubmitted(true);
    setForm({ name: '', avatar: '', designation: '', company: '', rating: 0, message: '' });
    setSelectedRating(0);
    setImagePreview(null);
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#E9E9E7] flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-[30px] shadow-md p-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Thank You!</h2>
          <p className="text-gray-600 mb-2">Your testimonial has been submitted successfully.</p>
          <p className="text-gray-500 text-sm mb-8">It will be visible on our website once approved by our team.</p>
          <button onClick={() => setSubmitted(false)} className="bg-[#2f4f3f] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#63776d] transition">Submit Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E9E9E7]">
      <Toaster />
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Share Your <span className="text-[#2f4f3f]">Experience</span></h1>
          <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">We value your feedback. Tell us about your experience working with us.</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-[30px] shadow-md p-8 md:p-10 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-semibold text-gray-700">Name <span className="text-red-500">*</span></label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your full name"
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="avatar" className="text-sm font-semibold text-gray-700">Profile Image</label>
              <div className="flex items-center gap-3">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                    <button type="button" onClick={removeImage} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2 border border-dashed border-gray-300 hover:border-gray-400 transition">
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={uploadingImage} />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="designation" className="text-sm font-semibold text-gray-700">Designation</label>
              <input id="designation" value={form.designation} onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))} placeholder="e.g. CEO, Founder" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>

            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-semibold text-gray-700">Company</label>
              <input id="company" value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} placeholder="Your company name" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Rating <span className="text-red-500">*</span></label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => handleRatingClick(star)} className="transition-transform hover:scale-110 focus:outline-none" aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}>
                  <Star size={32} className={star <= selectedRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                </button>
              ))}
            </div>
            {errors.rating && <p className="text-red-500 text-xs mt-1">{errors.rating}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-semibold text-gray-700">Your Testimonial <span className="text-red-500">*</span></label>
            <textarea id="message" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} placeholder="Share your experience working with us..." rows={5} className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${errors.message ? 'border-red-500' : 'border-gray-300'}`} />
            <div className="flex justify-between items-center">
              {errors.message && <p className="text-red-500 text-xs">{errors.message}</p>}
              <p className={`text-xs ml-auto ${messageLength > CHARACTER_LIMIT ? 'text-red-500' : 'text-gray-400'}`}>{messageLength}/{CHARACTER_LIMIT}</p>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-[#2f4f3f] hover:bg-[#63776d] text-white px-8 py-4 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Testimonial
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
