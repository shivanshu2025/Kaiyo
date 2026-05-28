import ReferHeader from '@/components/sections/ReferHeader';

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ReferHeader />
      {children}
    </>
  );
}
