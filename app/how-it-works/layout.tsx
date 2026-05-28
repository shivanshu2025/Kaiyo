import ReferHeader from '@/components/sections/ReferHeader';
import CookiePopup from '@/components/sections/CookiePopup';

export default function ReferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ReferHeader />

      {/* Cookie Popup */}
      <CookiePopup />

      {/* Page Content */}
      {children}
    </>
  );
}