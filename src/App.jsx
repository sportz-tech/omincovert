import React, { useState, useEffect } from 'react';
import { FileText, Image, Sliders, Menu, X, ShieldCheck, Cpu } from 'lucide-react';
import OCRTool from './components/OCRTool';
import ImageConverter from './components/ImageConverter';
import ImageResizer from './components/ImageResizer';
import DocumentConverter from './components/DocumentConverter';
import AdsensePlaceholder from './components/AdsensePlaceholder';
import logoImg from './assets/logo.png';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';

export default function App() {
  const parseCurrentPath = () => {
    const path = window.location.pathname.replace(/^\/|\/$/g, '');
    
    // Default values
    let tab = 'ocr';
    let ocrLang = 'eng';
    let converterRemoveBg = false;
    let resizerPreset = 'insta_story';
    let docType = 'pdf-to-docx';

    switch (path) {
      case 'image-to-text':
      case 'ocr':
        tab = 'ocr';
        ocrLang = 'eng';
        break;
      case 'image-to-text-hindi':
        tab = 'ocr';
        ocrLang = 'hin';
        break;
      case 'image-converter':
        tab = 'convert';
        break;
      case 'image-remove-background':
      case 'remove-background':
        tab = 'convert';
        converterRemoveBg = true;
        break;
      case 'social-media-resizer':
      case 'image-resizer':
        tab = 'resize';
        break;
      case 'image-resize-facebook':
        tab = 'resize';
        resizerPreset = 'fb_feed';
        break;
      case 'image-resize-facebook-cover':
        tab = 'resize';
        resizerPreset = 'fb_cover';
        break;
      case 'image-resize-youtube':
        tab = 'resize';
        resizerPreset = 'yt_thumb';
        break;
      case 'image-resize-instagram-story':
      case 'image-resize-instagram-reel':
        tab = 'resize';
        resizerPreset = 'insta_story';
        break;
      case 'image-resize-instagram':
        tab = 'resize';
        resizerPreset = 'insta_square';
        break;
      case 'image-resize-pinterest':
        tab = 'resize';
        resizerPreset = 'pinterest_pin';
        break;
      case 'document-converter':
      case 'docs':
        tab = 'docs';
        break;
      case 'pdf-to-word':
        tab = 'docs';
        docType = 'pdf-to-docx';
        break;
      case 'pdf-to-excel':
        tab = 'docs';
        docType = 'pdf-to-xlsx';
        break;
      case 'pdf-to-png':
      case 'pdf-to-jpg':
        tab = 'docs';
        docType = 'pdf-to-png';
        break;
      case 'pdf-to-text':
      case 'pdf-to-txt':
        tab = 'docs';
        docType = 'pdf-to-txt';
        break;
      case 'word-to-pdf':
        tab = 'docs';
        docType = 'docx-to-pdf';
        break;
      case 'excel-to-pdf':
        tab = 'docs';
        docType = 'xlsx-to-pdf';
        break;
      case 'privacy-policy':
      case 'privacy':
        tab = 'privacy';
        break;
      case 'terms-of-service':
      case 'terms':
        tab = 'terms';
        break;
      default:
        tab = 'ocr';
        ocrLang = 'eng';
    }

    return { tab, ocrLang, converterRemoveBg, resizerPreset, docType };
  };

  const tabPaths = {
    ocr: '/image-to-text',
    convert: '/image-converter',
    resize: '/social-media-resizer',
    docs: '/document-converter',
    privacy: '/privacy-policy',
    terms: '/terms-of-service'
  };

  const [routeParams, setRouteParams] = useState(parseCurrentPath());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeTab = routeParams.tab;

  useEffect(() => {
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.history.replaceState(null, '', '/image-to-text');
    }

    const handlePopState = () => {
      setRouteParams(parseCurrentPath());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (tabId) => {
    window.history.pushState(null, '', tabPaths[tabId]);
    setRouteParams(parseCurrentPath());
  };

  const tabs = [
    {
      id: 'ocr',
      label: 'Image to Text (OCR)',
      icon: <FileText className="menu-icon" />,
      component: <OCRTool initialLanguage={routeParams.ocrLang} />,
      subtitle: 'Extract editable text from any image file instantly in your browser'
    },
    {
      id: 'convert',
      label: 'Image Converter',
      icon: <Image className="menu-icon" />,
      component: <ImageConverter initialRemoveBg={routeParams.converterRemoveBg} />,
      subtitle: 'Convert between PNG, JPG, WebP, and BMP format in bulk'
    },
    {
      id: 'resize',
      label: 'Social Media Resizer',
      icon: <Sliders className="menu-icon" />,
      component: <ImageResizer initialPresetId={routeParams.resizerPreset} />,
      subtitle: 'Crop & fit images for Facebook post/cover, Instagram story/reel, YouTube and more'
    },
    {
      id: 'docs',
      label: 'Document Converter',
      icon: <Cpu className="menu-icon" />,
      component: <DocumentConverter initialDocType={routeParams.docType} />,
      subtitle: 'Client-side conversion between Word (DOCX), PDF, and Excel formats'
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      component: <PrivacyPolicy />,
      subtitle: 'How we respect your privacy and manage data',
      hidden: true
    },
    {
      id: 'terms',
      label: 'Terms of Service',
      component: <TermsOfService />,
      subtitle: 'Terms and conditions for using OminConvert',
      hidden: true
    }
  ];

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logoImg} className="logo-img" alt="Logo" />
            <span className="brand-name">OminConvert</span>
          </div>
          <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <ul className="sidebar-menu">
          {tabs.filter(t => !t.hidden).map(tab => (
            <li key={tab.id}>
              <button
                className={`menu-item-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  navigateTo(tab.id);
                  setIsSidebarOpen(false);
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Sidebar Advertisement Slot */}
        <div style={{ padding: '0 16px', marginBottom: '8px' }}>
          <AdsensePlaceholder format="rectangle" slotId="1111111111" />
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-links">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 600 }}>
              <ShieldCheck size={14} /> 100% Client-Side Privacy
            </span>
            <div style={{ marginTop: '8px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={() => navigateTo('privacy')} 
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Privacy Policy
              </button>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>|</span>
              <button 
                onClick={() => navigateTo('terms')} 
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Terms
              </button>
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.72rem' }}>
              © 2026 OminConvert.
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="hamburger-btn" onClick={toggleSidebar}>
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="tool-title-area">
              <h1 className="tool-title gradient-text">{currentTab.label}</h1>
              <span className="tool-subtitle">{currentTab.subtitle}</span>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Status:</span>
            <span className="status-badge completed" style={{ fontSize: '0.72rem' }}>Online / Serverless</span>
          </div>
        </header>

        {/* Top Advertisement Slot (Leaderboard format) */}
        <div className="adsense-header-container">
          <AdsensePlaceholder format="leaderboard" slotId="2222222222" />
        </div>

        {/* Dynamic Tool Content */}
        <div style={{ flex: 1 }}>
          {currentTab.component}
        </div>
      </main>
    </div>
  );
}
