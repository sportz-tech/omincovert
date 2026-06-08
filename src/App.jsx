import React, { useState } from 'react';
import { FileText, Image, Sliders, Menu, X, ShieldCheck, Cpu } from 'lucide-react';
import OCRTool from './components/OCRTool';
import ImageConverter from './components/ImageConverter';
import ImageResizer from './components/ImageResizer';
import DocumentConverter from './components/DocumentConverter';
import AdsensePlaceholder from './components/AdsensePlaceholder';
import logoImg from './assets/logo.png';

export default function App() {
  const [activeTab, setActiveTab] = useState('ocr');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const tabs = [
    {
      id: 'ocr',
      label: 'Image to Text (OCR)',
      icon: <FileText className="menu-icon" />,
      component: <OCRTool />,
      subtitle: 'Extract editable text from any image file instantly in your browser'
    },
    {
      id: 'convert',
      label: 'Image Converter',
      icon: <Image className="menu-icon" />,
      component: <ImageConverter />,
      subtitle: 'Convert between PNG, JPG, WebP, and BMP format in bulk'
    },
    {
      id: 'resize',
      label: 'Social Media Resizer',
      icon: <Sliders className="menu-icon" />,
      component: <ImageResizer />,
      subtitle: 'Crop & fit images for Facebook post/cover, Instagram story/reel, YouTube and more'
    },
    {
      id: 'docs',
      label: 'Document Converter',
      icon: <Cpu className="menu-icon" />,
      component: <DocumentConverter />,
      subtitle: 'Client-side conversion between Word (DOCX), PDF, and Excel formats'
    }
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

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
            <span className="brand-name">OmniConvert</span>
          </div>
          <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <ul className="sidebar-menu">
          {tabs.map(tab => (
            <li key={tab.id}>
              <button
                className={`menu-item-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
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
            <div style={{ marginTop: '8px', fontSize: '0.72rem' }}>
              © 2026 OmniConvert.
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
