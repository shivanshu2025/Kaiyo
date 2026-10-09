export type CmsCard = {
  src: string;
  title?: string;
  description?: string;
};

export type CmsSolutionSection = {
  title: string;
  cards: CmsCard[];
};

export type CmsSolution = {
  slug: string;
  label: string;
  category: string;
  data: any;
};

export type PricingPlan = {
  id: string;
  title: string;
  description: string;
  price: string;
  color?: string;
  features: string[];
};

export type Testimonial = {
  id: string;
  name: string;
  content: string;
  image?: string;
  avatar?: string;
  designation?: string;
  company?: string;
  rating: number;
  createdAt: string;
};

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  interest?: string;
  phone?: string;
  message: string;
  createdAt: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type SiteSettings = {
  logo: string;
  whatsappNumber: string;
  phoneNumber: string;
  socialLinks: Array<{ label: string; url: string }>;
};

/* ----------------------------- Home ----------------------------- */

export type HomeHero = {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  logoImage: string;
  ctaText: string;
  ctaLink: string;
};

export type HomeCollectionItem = {
  title: string;
  text: string;
};

export type HomeCollection = {
  heading: string;
  description: string;
  items: HomeCollectionItem[];
};

export type HomeProject = {
  title: string;
  description: string;
  image: string;
};

export type HomeProjectShowcase = {
  heading: string;
  description: string;
  projects: HomeProject[];
};

export type HomeProcessStep = {
  number: string;
  title: string;
  description: string;
};

export type HomeProcess = {
  heading: string;
  description: string;
  steps: HomeProcessStep[];
};

export type HomeFinalCta = {
  heading: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  listItems: Array<{ title: string; desc: string }>;
};

export type HomeContent = {
  hero: HomeHero;
  collection: HomeCollection;
  projectShowcase: HomeProjectShowcase;
  process: HomeProcess;
  finalCta: HomeFinalCta;
};

/* -------------------------- How It Works ------------------------ */

export type PartnerTier = {
  name: string;
  percentage: string;
  description: string;
  features: string[];
  color: string;
};

export type WorkflowStep = {
  number: string;
  title: string;
  description: string;
};

export type WhyChooseUsItem = {
  icon: string;
  title: string;
  description: string;
};

export type PartnerCalculatorPreview = {
  heading: string;
  description: string;
  defaultProjectValue: number;
  defaultRole: string;
  defaultPercentage: number;
  defaultEarnings: number;
  buttonText: string;
  buttonLink: string;
};

export type HowItWorksContent = {
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  tiers: PartnerTier[];
  workflowSteps: WorkflowStep[];
  yourRole: string[];
  ourRole: string[];
  whyChooseUs: WhyChooseUsItem[];
  faqs: FaqItem[];
  calculator: PartnerCalculatorPreview;
  ctaTitle: string;
  ctaDescription: string;
  ctaWhatsApp: string;
  ctaPrimaryText: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
  ctaBackgroundImage: string;
};

/* --------------------------- Calculator ------------------------- */

export type CalculatorTier = {
  title: string;
  percentage: number;
  description: string;
  icon: string;
  accentColor: string;
  displayOrder: number;
  isEnabled: boolean;
};

export type CalculatorContent = {
  heroSection: { badgeText: string; heading: string; highlightText: string; description: string };
  projectValue: { minValue: number; maxValue: number; defaultValue: number; currency: string; capLabel: string };
  calculatorLogic: { maxEarning: number; rounding: number; displayFormat: string };
  resultCard: { heading: string; label: string; emptyStateMessage: string; currency: string; resultFormatting: string };
  ctaCard: {
    heading: string;
    description: string;
    primaryButton: string;
    secondaryButton: string;
    whatsappLink: string;
    joinButtonLink: string;
    backgroundImage: string;
  };
  globalSettings: {
    currencySymbol: string;
    buttonLabels: { calculate: string; processing: string };
    animationToggle: boolean;
    calculationDelay: number;
  };
  tiers: CalculatorTier[];
};

/* ------------------------------ Cms ----------------------------- */

export type CmsData = {
  siteSettings: SiteSettings;
  home: HomeContent;
  solutions: CmsSolution[];
  pricing: {
    hero: { heading: string; description: string };
    plans: PricingPlan[];
  };
  howItWorks: HowItWorksContent;
  calculator: CalculatorContent;
  testimonials: {
    hero: { heading: string; description: string };
    items: Testimonial[];
  };
  contact: {
    heading: string;
    description: string;
    contactInfoHeading: string;
    contactInfoDescription: string;
    phone: string;
    whatsapp: string;
    faqs: FaqItem[];
    submissions: ContactSubmission[];
  };
  media: {
    images: Array<{ path: string; name: string }>;
    videos: Array<{ path: string; name: string }>;
  };
  updatedAt: string;
};