"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Listens for auth state changes (sign-in/sign-out from other tabs)
 * and refreshes the page so the server component re-renders with
 * the correct UI (landing page vs dashboard).
 *
 * Only triggers refresh when auth state actually changes
 * (not on token refreshes or initial session load).
 */
export default function AuthListener() {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const previousUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = supabaseRef.current;

    // Get initial user state so we can detect actual changes
    supabase.auth.getUser().then(({ data: { user } }) => {
      previousUserIdRef.current = user?.id ?? null;
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUserId = session?.user?.id ?? null;
      const previousUserId = previousUserIdRef.current;

      // Skip if we haven't loaded the initial state yet
      if (previousUserId === undefined) return;

      // Only refresh if the user actually changed
      // (null → user = signed in, user → null = signed out)
      if (previousUserId !== currentUserId) {
        previousUserIdRef.current = currentUserId;
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
