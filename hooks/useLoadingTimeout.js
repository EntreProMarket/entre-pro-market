// hooks/useLoadingTimeout.js
import { useEffect, useState } from "react";

// ── Watches a page's own `loading` boolean and flips `timedOut` to true if
// loading has been stuck for longer than `ms` (default 12s). Used to turn a
// silent infinite spinner (e.g. a Supabase fetch that never resolves while
// offline) into a real "couldn't load" message with a retry option. Resets
// automatically if `loading` becomes true again (e.g. after a manual retry). ──
export default function useLoadingTimeout(loading, ms = 12000) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) { setTimedOut(false); return; }
    const timer = setTimeout(() => setTimedOut(true), ms);
    return () => clearTimeout(timer);
  }, [loading, ms]);

  return timedOut;
}
