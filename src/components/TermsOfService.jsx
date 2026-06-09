import React from 'react';

export default function TermsOfService() {
  return (
    <div className="tool-card" style={{ maxWidth: '800px', margin: '20px auto', padding: '30px', color: 'var(--text)' }}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'var(--primary)' }}>Terms of Service</h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
        Effective Date: June 9, 2026
      </p>

      <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
        Welcome to <strong>OmniConvert</strong>! By accessing our website at <a href="https://ominconvert.com" style={{ color: 'var(--primary)' }}>https://ominconvert.com</a>, you agree to comply with and be bound by the following terms and conditions of use.
      </p>

      <h3 style={{ fontSize: '1.2rem', marginTop: '25px', marginBottom: '10px' }}>1. Acceptance of Terms</h3>
      <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
        By visiting or using any of the tools provided on OmniConvert, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our website or services.
      </p>

      <h3 style={{ fontSize: '1.2rem', marginTop: '25px', marginBottom: '10px' }}>2. Use License and Permitted Use</h3>
      <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
        OmniConvert grants you a free, non-exclusive, non-transferable license to use our web-based tools (Image-to-Text OCR, Image Converter, Social Media Resizer, and Document Converter) for personal or commercial purposes. 
        All conversions and calculations are run client-side on your local device. We do not store, host, or possess any copyright over the files you choose to process. You retain full ownership and responsibility for your files.
      </p>

      <h3 style={{ fontSize: '1.2rem', marginTop: '25px', marginBottom: '10px' }}>3. Prohibited Activities</h3>
      <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
        You agree not to use this website to:
      </p>
      <ul style={{ lineHeight: '1.6', marginBottom: '20px', paddingLeft: '20px' }}>
        <li>Attempt to disrupt, damage, or overload our web hosting servers.</li>
        <li>Automate the service (e.g., using scripts, scrapers, or bots to crawl or convert files in bulk systematically) without permission.</li>
        <li>Perform illegal activities or process content that violates local, state, or international laws.</li>
      </ul>

      <h3 style={{ fontSize: '1.2rem', marginTop: '25px', marginBottom: '10px' }}>4. Disclaimer of Warranties</h3>
      <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
        OmniConvert is provided "as is" and "as available". We make no warranties, expressed or implied, regarding the accuracy, completeness, performance, or availability of the tools. Because all file processing happens directly in your browser using client-side engines, results may vary depending on file size, format compatibility, and device performance. 
      </p>

      <h3 style={{ fontSize: '1.2rem', marginTop: '25px', marginBottom: '10px' }}>5. Limitation of Liability</h3>
      <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
        In no event shall OmniConvert, its owners, or affiliates be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the tools on OmniConvert, even if notified orally or in writing of the possibility of such damage.
      </p>

      <h3 style={{ fontSize: '1.2rem', marginTop: '25px', marginBottom: '10px' }}>6. Revisions and Errata</h3>
      <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
        The materials appearing on OmniConvert could include technical, typographical, or photographic errors. We do not promise that any of the materials on this website are accurate, complete, or current. OmniConvert may make changes to the materials contained on its website at any time without notice.
      </p>

      <h3 style={{ fontSize: '1.2rem', marginTop: '25px', marginBottom: '10px' }}>7. Governing Law</h3>
      <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
        Any claim relating to OmniConvert shall be governed by the laws of our operating jurisdiction, without regard to its conflict of law provisions.
      </p>
    </div>
  );
}
