import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="tool-card" style={{ maxWidth: '800px', margin: '20px auto', padding: '30px', color: 'var(--text)' }}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'var(--primary)' }}>Privacy Policy</h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
        Effective Date: June 9, 2026
      </p>
      
      <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
        At <strong>OmniConvert</strong> (accessible from <a href="https://ominconvert.com" style={{ color: 'var(--primary)' }}>https://ominconvert.com</a>), the privacy of our visitors is of extreme importance to us. This Privacy Policy document outlines the types of personal information received and collected by OmniConvert and how it is used.
      </p>

      <h3 style={{ fontSize: '1.2rem', marginTop: '25px', marginBottom: '10px' }}>1. 100% Client-Side Privacy (Zero Server Uploads)</h3>
      <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
        OmniConvert operates entirely inside your web browser. All file conversions, OCR text extraction, background removal, and image resizing are processed locally on your device using client-side JavaScript and WebAssembly. 
        <strong> We never upload your documents, images, or personal files to any server.</strong> Your data remains privately on your computer at all times.
      </p>

      <h3 style={{ fontSize: '1.2rem', marginTop: '25px', marginBottom: '10px' }}>2. Log Files</h3>
      <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
        Like many other websites, OmniConvert makes use of log files. These files merely log visitors to the site – usually a standard procedure for hosting companies and a part of hosting services' analytics. The information inside the log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date/time stamp, referring/exit pages, and possibly the number of clicks. This information is used to analyze trends, administer the site, track user's movement around the site, and gather demographic information. IP addresses and other such information are not linked to any information that is personally identifiable.
      </p>

      <h3 style={{ fontSize: '1.2rem', marginTop: '25px', marginBottom: '10px' }}>3. Google DoubleClick DART Cookie (Google AdSense)</h3>
      <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
        Google, as a third-party vendor, uses cookies to serve ads on OmniConvert. Google's use of the DART cookie enables it to serve ads to our site's visitors based upon their visit to OmniConvert and other sites on the Internet. 
        Users may opt out of the use of the DART cookie by visiting the Google ad and content network Privacy Policy at the following URL: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>https://policies.google.com/technologies/ads</a>.
      </p>

      <h3 style={{ fontSize: '1.2rem', marginTop: '25px', marginBottom: '10px' }}>4. Google Analytics</h3>
      <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
        We use Google Analytics to understand how visitors interact with our website (e.g., page views, popular tools, session durations). This helps us optimize performance and improve the tools we offer. Google Analytics collects anonymized interaction data. You can opt out of Google Analytics tracking across all websites by installing the Google Analytics Opt-out Browser Add-on.
      </p>

      <h3 style={{ fontSize: '1.2rem', marginTop: '25px', marginBottom: '10px' }}>5. Third-Party Ad Networks</h3>
      <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
        Third-party ad servers or ad networks use technology in their respective advertisements and links that appear on OmniConvert and which are sent directly to your browser. They automatically receive your IP address when this occurs. Other technologies (such as cookies, JavaScript, or Web Beacons) may also be used by our site's third-party ad networks to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on the site.
        OmniConvert has no access to or control over these cookies that are used by third-party advertisers.
      </p>

      <h3 style={{ fontSize: '1.2rem', marginTop: '25px', marginBottom: '10px' }}>6. Consent</h3>
      <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
        By using our website, you hereby consent to our Privacy Policy and agree to its terms.
      </p>

      <p style={{ marginTop: '30px', borderTop: '1px solid var(--border)', paddingTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        If you require any more information or have any questions about our privacy policy, please feel free to contact us by email at <a href="mailto:support@ominconvert.com" style={{ color: 'var(--primary)' }}>support@ominconvert.com</a>.
      </p>
    </div>
  );
}
