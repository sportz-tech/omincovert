import React, { useEffect } from 'react';

// Central configuration for Adsense. 
// Replace with your Google Adsense Publisher ID (e.g., 'ca-pub-1234567890123456')
export const ADSENSE_PUBLISHER_ID = 'ca-pub-4370867821860158'; 

export default function AdsensePlaceholder({ format = 'rectangle', slotId = '' }) {
  const isEnabled = !!ADSENSE_PUBLISHER_ID;

  useEffect(() => {
    if (isEnabled) {
      try {
        // Load the adsense script if not already loaded
        if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
          const script = document.createElement('script');
          script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_PUBLISHER_ID;
          script.async = true;
          script.crossOrigin = 'anonymous';
          document.body.appendChild(script);
        }
        
        // Push adsense calls
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.warn('Adsense failed to load:', err);
      }
    }
  }, [isEnabled]);

  // Determine size classes
  let sizeClass = 'adsense-rectangle';
  let sizeText = 'Ad Banner (336x280)';
  
  if (format === 'leaderboard') {
    sizeClass = 'adsense-leaderboard';
    sizeText = 'Responsive Leaderboard (728x90)';
  } else if (format === 'sidebar') {
    sizeClass = 'adsense-sidebar';
    sizeText = 'Responsive Sidebar (300x600)';
  }

  if (isEnabled) {
    return (
      <div className="adsense-container">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADSENSE_PUBLISHER_ID}
          data-ad-slot={slotId || '1234567890'}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  return (
    <div className="adsense-container">
      <div className={`adsense-mock ${sizeClass}`}>
        <span>Sponsored Advertisement</span>
        <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>{sizeText}</span>
        <span style={{ fontSize: '0.62rem', marginTop: '6px', opacity: 0.4 }}>
          Set ADSENSE_PUBLISHER_ID in AdsensePlaceholder.jsx to activate
        </span>
      </div>
    </div>
  );
}
