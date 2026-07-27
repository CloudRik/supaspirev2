import { useEffect } from "react";

// SupaSpire is a separate standalone app (runs on :5175).
// Opening it from the Zenith OS sidebar should show it in full screen with NO
// Zenith OS navbar or sidebar — exactly like opening it on its own. So we just
// send the browser to the SupaSpire app instead of embedding it inside AppShell.
export default function SupaspirePage() {
  useEffect(() => {
    // Same-domain path (e.g. /supaspire). In dev, Zenith OS proxies this to the
    // SupaSpire dev server; in production, nginx routes cloudrik.com/supaspire
    // to the SupaSpire server. This keeps both apps under one domain.
    window.location.replace("/supaspire/");
  }, []);

  return null;
}
