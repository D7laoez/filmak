import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void import("@/integrations/supabase/client")
      .then(({ supabase }) => {
        if (cancelled) return;

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          setLoading(false);
        });
        unsubscribe = () => data.subscription.unsubscribe();

        void supabase.auth.getSession().then(({ data: sessionData }) => {
          if (!cancelled) {
            setUser(sessionData.session?.user ?? null);
            setLoading(false);
          }
        });
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return { user, loading };
}
