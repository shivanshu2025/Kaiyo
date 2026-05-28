import Link from 'next/link';

interface CTAButtonProps {
  text: string;
  href?: string;
  variant?: 'primary' | 'secondary';
  color?: string;
  onClick?: () => void;
}

export default function CTAButton({ 
  text, 
  href,
  variant = 'primary',
  color = '#32483e',
  onClick 
}: CTAButtonProps) {
  const baseStyles = "px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer";
  
  const primaryStyles = `bg-[${color}] text-white hover:shadow-lg`;
  const secondaryStyles = `bg-transparent text-[${color}] border-2 border-[${color}] hover:bg-[${color}] hover:text-white`;

  const content = (
    <button
      className={`${baseStyles} ${variant === 'primary' ? primaryStyles : secondaryStyles}`}
      onClick={onClick}
    >
      {text}
    </button>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
