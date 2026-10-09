import { brandLogosData } from '@/components/solutions/data/brandLogos';
import { digitalInvitesData } from '@/components/solutions/data/digitalInvites';
import { landingPagesData } from '@/components/solutions/data/landingPages';
import { portfoliosData } from '@/components/solutions/data/portfolios';
import { socialBannersData } from '@/components/solutions/data/socialBanners';
import { viralThumbnailsData } from '@/components/solutions/data/viralThumbnails';
import { webAppsData } from '@/components/solutions/data/webApps';
import type { CmsData } from './cms-types';

const now = new Date('2026-10-06T00:00:00.000Z').toISOString();

export const defaultCmsData: CmsData = {
  siteSettings: {
    logo: '/images/Kaiyologo.png',
    whatsappNumber: '919760926681',
    phoneNumber: '9760926681',
    socialLinks: [
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/jatin-singh-1033aa3b7/' },
      { label: 'GitHub', url: 'https://github.com/shivanshu2025' },
      { label: 'Instagram', url: 'https://www.instagram.com/__codeno.in/' },
    ],
  },
  home: {
    hero: {
      title: 'The future of startup building -Kaiyo',
      subtitle: 'YOUR WEBSITE, REIMAGINED.',
      description: "Building an online presence doesn't have to be complicated. We create clean, modern websites that turn your business idea into a professional digital presence.",
      image: '/images/kk.png',
      logoImage: '/images/Kaiyologo.png',
      ctaText: 'I create websites and sell them.',
      ctaLink: '/contact',
    },
    collection: {
      heading: 'BUILDING YOUR DIGITAL PRESENCE',
      description: 'DESIGN. BUILD. DELIVER. WE BUILD YOUR WEBSITE.',
      items: [
        { title: 'Design', text: 'Creating thoughtful, modern, and user-focused designs that give your brand a strong visual identity and professional digital presence.' },
        { title: 'Development', text: 'Creating clean, modern, and responsive websites that give your business a professional presence online.' },
        { title: 'Responsive', text: 'Building responsive websites that adapt smoothly across mobile, tablet, and desktop screens for a consistent and comfortable user experience.' },
      ],
    },
    projectShowcase: {
      heading: 'Design Clarity Function',
      description: 'We create clean, modern, and responsive websites that help businesses build a professional presence online.',
      projects: [
        { title: 'Goal', description: 'To create a modern and easy-to-use website with a clear structure, strong visual presentation, and a straightforward way for visitors to understand the business and take action.', image: 'https://videos.pexels.com/video-files/29848605/12817762_3840_2160_30fps.mp4' },
        { title: 'Solution', description: 'A clean, modern visual style was used with clear typography and a structured layout. The content was kept simple and focused, while responsive design ensures the website works smoothly across desktop and mobile devices.', image: 'https://videos.pexels.com/video-files/34128902/14471915_3840_2160_30fps.mp4' },
      ],
    },
    process: {
      heading: 'Project process and typography',
      description: 'MODERN WEB DESIGN / DIGITAL PRESENCE',
      steps: [
        { number: '01', title: 'UNDERSTAND', description: 'We understand your business idea and what you need from your website.' },
        { number: '02', title: 'DESIGN', description: 'We create a clean and modern website design based on your requirements.' },
        { number: '03', title: 'BUILD', description: 'We turn the design into a functional website that is easy to use.' },
        { number: '04', title: 'DELIVER', description: 'We make sure your website is ready to use on desktop and mobile devices.' },
      ],
    },
    finalCta: {
      heading: 'THE TIME IS NOW',
      description: 'You bring the vision, we turn it into a website people remember.',
      buttonText: 'THE PATH IS',
      buttonLink: '/contact',
      listItems: [
        { title: 'DIGITAL, BUT DIFFERENT', desc: 'We create websites that give your business a strong identity online.' },
        { title: 'YOUR IDEA. OUR CRAFT.', desc: 'You bring the vision, we turn it into a website people remember.' },
        { title: 'BUILT FOR THE FIRST IMPRESSION', desc: 'Because your website is often the first thing your customers see.' },
      ],
    },
  },
  solutions: [
    { slug: 'brand-logos', label: 'Brand Logos', category: 'Creative Studio', data: brandLogosData },
    { slug: 'viral-thumbnails', label: 'Viral Thumbnails', category: 'Creative Studio', data: viralThumbnailsData },
    { slug: 'digital-shaadi-invites', label: 'Digital Shaadi Invites', category: 'Creative Studio', data: digitalInvitesData },
    { slug: 'social-media-banners', label: 'Social Media Banners', category: 'Creative Studio', data: socialBannersData },
    { slug: 'personal-portfolios', label: 'Personal Portfolios', category: 'Web Apps', data: portfoliosData },
    { slug: 'landing-pages', label: 'Landing Pages', category: 'Web Apps', data: landingPagesData },
    { slug: 'next-gen-web-apps', label: 'Next-Gen Web Apps', category: 'Web Apps', data: webAppsData },
  ],
  pricing: {
    hero: { heading: 'YOUR WEBSITE STARTS HERE.', description: 'Choose the right website package for your business.' },
    plans: [
      { id: 'starter-website', title: 'Starter Website', description: 'Ideal for personal brands, portfolios, and small businesses starting online.', price: '₹15,000', color: 'bg-orange-500', features: ['Up to 5-7 Pages', 'Responsive Design', 'Basic UI/UX Layout', 'Contact Form', 'Basic SEO Setup', 'Delivery: 7-10 working Days'] },
      { id: 'business-website', title: 'Business Website', description: 'Perfect for growing businesses that need a professional and complete online presence.', price: '₹25,000', color: 'bg-green-500', features: ['Up to 7-12 Pages', 'Custom UI/UX Design', 'Fully Responsive Design', 'CMS Integration', 'On-page SEO Optimization', 'Contact & Inquiry Forms', 'Delivery: 14-18 Working Days'] },
      { id: 'custom-website', title: 'Custom Website', description: 'For businesses that need a website built around their specific requirements.', price: 'Depends on Complexity', color: 'bg-orange-600', features: ['Pages According to Need / Admin Dashboard', 'Custom Premium Design', 'Advanced UI/UX & Animations', 'E-commerce or Booking Integration', 'Speed & Performance Optimization', 'SEO & Analytics Setup', 'Priority Support', 'Delivery: According to Project'] },
    ],
  },
  howItWorks: {
    heroTitle: 'How It Works',
    heroDescription: 'Join our partner network and earn up to 65% commission on every project. Simple, transparent, and profitable.',
    heroImage: 'https://engineersealstamps.com/cdn/shop/products/in-use-great-job-stamp-4773-photo-1_a600c697-e7ec-4ee7-89e3-f7288a7894e4.jpg?v=1683890415&width=1500',
    tiers: [
      { name: 'Referral Partner', percentage: '20%', description: 'Simply refer clients to us', features: ['Share client leads', 'No technical work required', 'Passive income stream', 'Unlimited referrals'], color: 'bg-blue-500' },
      { name: 'Closing Expert', percentage: '25%', description: 'Help negotiate and close deals', features: ['Manage client communication', 'Negotiate contracts', 'Higher earning potential', 'Direct client interaction'], color: 'bg-purple-500' },
      { name: 'Full Handling', percentage: '30%', description: 'End-to-end project management', features: ['Complete project ownership', 'Maximum earnings', 'Priority project allocation', 'Dedicated support'], color: 'bg-emerald-500' },
    ],
    workflowSteps: [
      { number: '01', title: 'Connect', description: 'Share client leads or help close deals' },
      { number: '02', title: 'We Build', description: 'Our team delivers exceptional results' },
      { number: '03', title: 'Get Paid', description: 'Receive your earnings within 7 days' },
    ],
    yourRole: ['Identify and connect with potential clients', 'Share project requirements with our team', 'Facilitate initial discussions (optional)', 'Maintain client relationships', 'Track project progress and earnings'],
    ourRole: ['Handle all technical development', 'Manage project timelines and delivery', 'Provide regular progress updates', 'Ensure quality assurance and testing', 'Process your earnings promptly'],
    whyChooseUs: [
      { icon: 'FiDollarSign', title: 'High Commissions', description: 'Earn up to 65% on every project you bring' },
      { icon: 'FiShield', title: 'Secure Payments', description: 'Transparent and timely payouts guaranteed' },
      { icon: 'FiTarget', title: 'Quality Delivery', description: 'We ensure exceptional results for your clients' },
      { icon: 'FiUsers', title: 'Dedicated Support', description: '24/7 assistance for partners and clients' },
      { icon: 'FiTrendingUp', title: 'Growth Potential', description: 'Scale your earnings with more projects' },
      { icon: 'FiZap', title: 'Fast Turnaround', description: 'Quick project completion and delivery' },
    ],
    faqs: [
      { question: 'How do I become a partner?', answer: 'Simply click "Get Started" and fill out the partner application form. Our team will review your profile and get back to you within 24 hours.' },
      { question: 'When do I get paid?', answer: 'Payments are processed within 7 days of project completion and client payment.' },
      { question: 'Do I need technical skills?', answer: 'Not necessarily! As a referral partner, you just need to connect us with potential clients.' },
      { question: 'Is there a minimum project value?', answer: 'We work with projects starting from ₹10,000.' },
      { question: 'Can I work on multiple projects?', answer: 'Absolutely! There is no limit to how many clients you can refer.' },
    ],
    calculator: { heading: 'Calculate Your Potential', description: 'See how much you can earn based on project value and your role', defaultProjectValue: 50000, defaultRole: 'Referral', defaultPercentage: 30, defaultEarnings: 15000, buttonText: 'Try Interactive Calculator', buttonLink: '/calculator' },
    ctaTitle: 'Ready to Start Earning?',
    ctaDescription: 'Join hundreds of partners who are already earning with us. Start your journey today.',
    ctaWhatsApp: 'https://wa.me/919760926681?text=Hello%2C%20I%20want%20to%20start%20a%20project.',
    ctaPrimaryText: 'Contact on WhatsApp',
    ctaSecondaryText: 'Get Started Now',
    ctaSecondaryLink: '/contact',
    ctaBackgroundImage: '',
  },
  calculator: {
    heroSection: { badgeText: 'Partner Revenue v2.0', heading: 'Predict your', highlightText: 'success', description: '' },
    projectValue: { minValue: 1, maxValue: 2500000, defaultValue: 0, currency: '₹', capLabel: 'No cap • Any amount' },
    calculatorLogic: { maxEarning: 9999999, rounding: 0, displayFormat: 'en-IN' },
    resultCard: { heading: 'Tier Earnings', label: 'Your Share', emptyStateMessage: 'Enter amount to see 20% / 25% / 30% breakdown', currency: '₹', resultFormatting: 'en-IN' },
    ctaCard: { heading: 'Ready to convert?', description: 'Join our elite network of partners and get access to high-ticket projects.', primaryButton: 'WhatsApp', secondaryButton: 'Join Now', whatsappLink: 'https://wa.me/919760926681?text=Hello%2C%20I%20want%20to%20start%20a%20project.', joinButtonLink: '/contact', backgroundImage: '' },
    globalSettings: { currencySymbol: '₹', buttonLabels: { calculate: 'Calculate My Cut', processing: 'Processing...' }, animationToggle: true, calculationDelay: 600 },
    tiers: [
      { title: 'Partner at 20%', percentage: 20, description: '20% → Project amount ka 20%', icon: 'FiShare2', accentColor: '#32483e', displayOrder: 0, isEnabled: true },
      { title: 'Partner at 25%', percentage: 25, description: '25% → Project amount ka 25% — balanced starting point', icon: 'FiTarget', accentColor: '#32483e', displayOrder: 1, isEnabled: true },
      { title: 'Partner at 30%', percentage: 30, description: '30% → Project amount ka 30% — qualified leads + follow-up + client relationship', icon: 'FiAward', accentColor: '#32483e', displayOrder: 2, isEnabled: true },
    ],
  },
  testimonials: {
    hero: { heading: 'WHAT OUR CLIENTS SAY', description: 'See what our clients have to say about their website projects and experiences working with us.' },
    items: [
      { id: 'testimonial-1', name: 'Aarav Sharma', designation: 'Founder', company: 'TechStart', rating: 5, content: 'Kaiyo delivered an exceptional website that perfectly captures our brand. Highly recommend!', createdAt: now },
      { id: 'testimonial-2', name: 'Priya Patel', designation: 'CEO', company: 'DesignHub', rating: 5, content: 'Amazing team, fast delivery, and great support. Our conversions increased by 40%.', createdAt: now },
    ],
  },
  contact: {
    heading: "LET'S BUILD YOUR WEBSITE",
    description: "Tell us about your business or idea. We'll turn it into a clean, modern website.",
    contactInfoHeading: 'GET IN TOUCH',
    contactInfoDescription: "Fill out the form and tell us what you need. We'll get back to you soon.",
    phone: '9760926681',
    whatsapp: '9760926681',
    faqs: [
      { question: 'What services does Kaiyo offer?', answer: 'We offer a wide range of digital services including web design, development, branding, social media graphics, and digital invitations. Each solution is tailored to your specific needs.' },
      { question: 'How long does a typical project take?', answer: 'Project timelines vary based on complexity. A standard website takes 7-10 days, while more complex custom solutions may take 14-18 days or longer depending on requirements.' },
      { question: 'What is the pricing structure?', answer: 'Our pricing starts at $15,000 for starter websites and goes up based on complexity. We offer custom quotes for enterprise solutions and unique project requirements.' },
      { question: 'Do you offer post-launch support?', answer: 'Yes, we provide ongoing support and maintenance packages to ensure your digital presence remains up-to-date and performs optimally.' },
      { question: 'How do I get started?', answer: 'Simply fill out the contact form or reach out via WhatsApp. We will schedule a consultation to understand your vision and provide a tailored proposal.' },
    ],
    submissions: [],
  },
  media: {
    images: [
      { path: '/images/coffee.webp', name: 'coffee.webp' },
      { path: '/images/download.png', name: 'download.png' },
      { path: '/images/Kaiyologo.png', name: 'Kaiyologo.png' },
      { path: '/images/kk.png', name: 'kk.png' },
      { path: '/images/support-qr.png', name: 'support-qr.png' },
    ],
    videos: [{ path: '/video/Vide.mp4', name: 'Vide.mp4' }],
  },
  updatedAt: now,
};
