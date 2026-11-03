// hooks/useInactivityLogout.js
import { useEffect } from "react";

// The 30-minute auto-logout now lives in ONE place (pages/_app.js) so it behaves the same on every
// page and every device. Pages that call this hook just ask it to check right now.
export default function useInactivityLogout() {
  useEffect(() => {
    if (typeof window !== "undefined") window.dispatchEvent(new Event("epm-check-session"));
  }, []);
}
