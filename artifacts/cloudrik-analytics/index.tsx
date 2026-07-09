import React, { useEffect } from 'react';

export function Analytics() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect Project Name from env variables or hostname
    const projectName = 
      process.env.NEXT_PUBLIC_ZENITH_PROJECT_NAME || 
      (window as any).__ZENITH_PROJECT_NAME ||
      window.location.hostname.split('.')[0]; // Fallback: extract subdomain

    const trackPageView = async () => {
      try {
        const payload = {
          projectName: projectName,
          name: 'pageview',
          type: 'pageview',
          path: window.location.pathname,
          hostname: window.location.hostname,
          referrer: document.referrer || '',
          environment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'development' : 'production'
        };
        
        await fetch(`http://13.233.87.37:5000/analytics/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        });
      } catch (err) {
        // Silently fail if blocked
      }
    };

    trackPageView();

    // Global helper for custom event tracking
    (window as any).zenith = (window as any).zenith || {};
    (window as any).zenith.track = (eventName: string, properties?: any) => {
      fetch(`http://13.233.87.37:5000/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: projectName,
          name: eventName,
          type: 'custom',
          path: window.location.pathname,
          hostname: window.location.hostname,
          referrer: document.referrer || '',
          environment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'development' : 'production',
          properties
        }),
        keepalive: true
      }).catch(() => {});
    };
  }, []);

  return null;
}
