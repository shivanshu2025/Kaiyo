"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLocalAuthenticated } from "../lib/auth";

export function useRequireAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLocalAuthenticated()) {
      router.replace("/adminpanel/login");
      return;
    }

    setReady(true);
  }, [router]);

  return ready;
}
