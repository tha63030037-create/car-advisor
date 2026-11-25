"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// the matcher moved to /advisor; keep old links working
export default function V2Redirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/advisor" + window.location.search); }, [router]);
  return null;
}
