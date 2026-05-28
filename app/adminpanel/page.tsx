import { redirect } from 'next/navigation';

export default function AdminPanelHome() {
  redirect('/adminpanel/login');
}
