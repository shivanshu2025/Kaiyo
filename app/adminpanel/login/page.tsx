'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginSection } from '../components/login/LoginSection';
import {
  isLocalAuthenticated,
  setAuthenticated,
  validateCredentials,
} from '../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isLocalAuthenticated()) {
      router.replace('/adminpanel/dashboard');
      return;
    }

    setChecked(true);
  }, [router]);

  if (!checked) {
    return null;
  }

  const handleSignIn = (username: string, password: string) => {
    if (!validateCredentials(username, password)) {
      return false;
    }

    setAuthenticated();
    router.push('/adminpanel/dashboard');
    return true;
  };

  return <LoginSection onSignIn={handleSignIn} />;
}
