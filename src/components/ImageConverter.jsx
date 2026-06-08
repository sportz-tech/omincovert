import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { Upload, Download, Trash2, Sliders, Image, Check, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ImageConverter({ initialRemoveBg = false }) {
  const [files, setFiles] = useState([]);
  const [globalFormat, setGlobalFormat] = useState('image/jpeg');
  const [globalQuality, setGlobalQuality] = useState(0.85);
  const [globalRemoveBg, setGlobalRemoveBg] = useState(initialRemoveBg);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    setGlobalRemoveBg(initialRemoveBg);
    setFiles(prev => prev.map(f => f.status === 'pending' ? { ...f, removeBg: initialRemoveBg } : f));
  }, [initialRemoveBg]);

  // File Select Handler
  const handleFileChange = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      const newFiles = selected.map(file => ({
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        file: file,
        preview: URL.createObjectURL(file),
        status: 'pending', // pending, converting, completed, failed
        format: globalFormat,
        quality: globalQuality,
        removeBg: globalRemoveBg,
        convertedUrl: null,
        convertedName: null,
        convertedSize: null
      }));

      setFiles(prev => [...prev, ...newFiles]);
      e.target.value = '';
    }
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFileFormat = (id, format) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, format } : f));
  };

  const updateFileQuality = (id, quality) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, quality } : f));
  };

  const updateFileRemoveBg = (id, removeBg) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, removeBg } : f));
  };

  // Canvas Convert Function
  const convertSingleFile = (fileObj) => {
    return new Promise(async (resolve) => {
      try {
        let currentSource = fileObj.preview;
        let originalFile = fileObj.file;

        if (fileObj.removeBg) {
          // Update status to bg-removing
          setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'bg-removing', progressText: 'Initializing AI...' } : f));
          
          const { removeBackground } = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal/+esm');
          
          const config = {
            progress: (key, current, total) => {
              const percent = Math.round((current / total) * 100);
              let text = 'Processing...';
              if (key.includes('fetch')) {
                text = `Model Download: ${percent}%`;
              } else if (key.includes('process')) {
                text = `Isolating: ${percent}%`;
              }
              setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, progressText: text } : f));
            }
          };

          const processedBlob = await removeBackground(originalFile, config);
          currentSource = URL.createObjectURL(processedBlob);
        }

        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'converting' } : f));

        const img = new window.Image();
        img.src = currentSource;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          
          const ctx = canvas.getContext('2d');
          // Handle transparency background for JPEGs (defaults to black, let's make it white)
          if (fileObj.format === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              const ext = fileObj.format.split('/')[1] === 'jpeg' ? 'jpg' : fileObj.format.split('/')[1];
              const origName = fileObj.name.substring(0, fileObj.name.lastIndexOf('.'));
              const suffix = fileObj.removeBg ? '_nobg' : '';
              const newName = `${origName}${suffix}.${ext}`;
              const url = URL.createObjectURL(blob);
              const sizeStr = (blob.size / 1024).toFixed(1) + ' KB';

              setFiles(prev => prev.map(f => f.id === fileObj.id ? {
                ...f,
                status: 'completed',
                convertedUrl: url,
                convertedName: newName,
                convertedSize: sizeStr
              } : f));

              if (currentSource !== fileObj.preview) {
                URL.revokeObjectURL(currentSource);
              }
              resolve(true);
            } else {
              setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'failed' } : f));
              resolve(false);
            }
          }, fileObj.format, fileObj.quality);
        };
        img.onerror = () => {
          setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'failed' } : f));
          resolve(false);
        };
      } catch (err) {
        console.error("AI Background removal failed", err);
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'failed' } : f));
        resolve(false);
      }
    });
  };

  // Convert All Pending Files
  const convertAll = async () => {
    const pending = files.filter(f => f.status === 'pending' || f.status === 'failed');
    if (pending.length === 0) return;

    setIsConverting(true);
    for (const f of pending) {
      await convertSingleFile(f);
    }
    setIsConverting(false);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8a5cf5', '#00f5ff', '#ff007a']
    });
  };

  // Individual Download
  const downloadFile = (fileObj) => {
    if (!fileObj.convertedUrl) return;
    const a = document.createElement('a');
    a.href = fileObj.convertedUrl;
    a.download = fileObj.convertedName;
    a.click();
  };

  // Download All as ZIP
  const downloadAllZip = async () => {
    const completed = files.filter(f => f.status === 'completed');
    if (completed.length === 0) return;

    const zip = new JSZip();
    
    // Add each file to zip
    for (const f of completed) {
      const response = await fetch(f.convertedUrl);
      const blob = await response.blob();
      zip.file(f.convertedName, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'omniconvert_images.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Set Global Preferences
  const applyGlobalFormat = (format) => {
    setGlobalFormat(format);
    setFiles(prev => prev.map(f => f.status === 'pending' ? { ...f, format } : f));
  };

  const applyGlobalQuality = (quality) => {
    setGlobalQuality(quality);
    setFiles(prev => prev.map(f => f.status === 'pending' ? { ...f, quality } : f));
  };

  const applyGlobalRemoveBg = (removeBg) => {
    setGlobalRemoveBg(removeBg);
    setFiles(prev => prev.map(f => f.status === 'pending' ? { ...f, removeBg } : f));
  };

  const formatLabels = {
    'image/jpeg': 'JPG / JPEG',
    'image/png': 'PNG Image',
    'image/webp': 'WebP Image',
    'image/bmp': 'BMP Format'
  };

  return (
    <div className="workspace-container">
      {/* Upload Zone */}
      <div 
        className="drag-drop-zone"
        onClick={() => fileInputRef.current.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('active');
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('active');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('active');
          if (e.dataTransfer.files) {
            handleFileChange({ target: { files: e.dataTransfer.files } });
          }
        }}
      >
        <div className="upload-icon-wrapper">
          <Upload size={28} />
        </div>
        <div>
          <p className="drag-drop-title">Drag & drop your images here</p>
          <p className="drag-drop-desc">Convert to PNG, JPG, WebP, or BMP in bulk</p>
        </div>
        <button className="btn btn-secondary" style={{ pointerEvents: 'none' }}>
          Browse Images
        </button>
        <input 
          type="file" 
          ref={fileInputRef}
          className="file-input-hidden" 
          multiple 
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      {files.length > 0 ? (
        <div className="dashboard-grid">
          {/* Main List */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Image Conversion Queue ({files.length})</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className={`btn btn-primary ${isConverting || files.every(f => f.status === 'completed') ? 'btn-disabled' : ''}`}
                  onClick={convertAll}
                >
                  {isConverting ? <RefreshCw className="animate-spin" size={16} /> : 'Convert All'}
                </button>
                {files.some(f => f.status === 'completed') && (
                  <button className="btn btn-secondary" onClick={downloadAllZip}>
                    <Download size={16} /> Download All (ZIP)
                  </button>
                )}
              </div>
            </div>

            <div className="file-list-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {files.map(f => (
                <div key={f.id} className="file-row-card">
                  <div className="file-info">
                    <img src={f.preview} alt="" className="file-thumbnail" />
                    <div className="file-details">
                      <span className="file-name">{f.name}</span>
                      <span className="file-size">{f.size}</span>
                      {f.convertedSize && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
                          New size: {f.convertedSize}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Settings per file when pending */}
                  {f.status === 'pending' && (
                    <div className="file-row-settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <select 
                        value={f.format} 
                        className="select-control"
                        style={{ padding: '6px 10px', fontSize: '0.8rem', width: '100px' }}
                        onChange={(e) => updateFileFormat(f.id, e.target.value)}
                      >
                        <option value="image/jpeg">JPG</option>
                        <option value="image/png">PNG</option>
                        <option value="image/webp">WebP</option>
                        <option value="image/bmp">BMP</option>
                      </select>
                      
                      {(f.format === 'image/jpeg' || f.format === 'image/webp') && (
                        <div className="file-slider-wrapper">
                          <input 
                            type="range" 
                            min="0.1" 
                            max="1.0" 
                            step="0.05"
                            value={f.quality}
                            style={{ width: '50px', accentColor: 'var(--accent-purple)' }}
                            onChange={(e) => updateFileQuality(f.id, parseFloat(e.target.value))}
                          />
                          <span style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>
                            {Math.round(f.quality * 100)}%
                          </span>
                        </div>
                      )}

                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', cursor: 'pointer', userSelect: 'none', color: 'var(--text-secondary)' }}>
                        <input 
                          type="checkbox" 
                          checked={f.removeBg || false} 
                          onChange={(e) => updateFileRemoveBg(f.id, e.target.checked)}
                          style={{ accentColor: 'var(--accent-purple)', width: '14px', height: '14px', cursor: 'pointer' }}
                        />
                        <span>✂️ Remove Bg</span>
                      </label>
                    </div>
                  )}

                  <div className="file-actions">
                    {f.status === 'bg-removing' ? (
                      <span className="status-badge" style={{ background: 'rgba(138,92,245,0.15)', color: 'var(--accent-purple)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <RefreshCw className="animate-spin" size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        {f.progressText || 'Removing Bg...'}
                      </span>
                    ) : f.status === 'converting' ? (
                      <span className="status-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <RefreshCw className="animate-spin" size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        Converting...
                      </span>
                    ) : (
                      <>
                        <span className={`status-badge ${f.status}`}>
                          {f.status === 'completed' && f.convertedName ? f.convertedName.split('.').pop().toUpperCase() : f.status}
                        </span>
                        {f.status === 'pending' && (
                          <button className="btn btn-secondary btn-download-small" onClick={() => convertSingleFile(f)}>
                            Convert
                          </button>
                        )}
                        {f.status === 'completed' && (
                          <button className="btn btn-secondary btn-download-small" onClick={() => downloadFile(f)}>
                            <Download size={12} /> Download
                          </button>
                        )}
                      </>
                    )}
                    <button className="btn-icon-only" onClick={() => removeFile(f.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Global Configurations Card */}
          <div className="glass-panel control-panel">
            <h3 className="panel-section-title">Batch Configuration</h3>
            
            <div className="control-group">
              <label className="control-label">Global Target Format</label>
              <select 
                value={globalFormat}
                className="select-control"
                onChange={(e) => applyGlobalFormat(e.target.value)}
              >
                <option value="image/jpeg">JPG / JPEG (Standard Compressed)</option>
                <option value="image/png">PNG (Lossless Transparent)</option>
                <option value="image/webp">WebP (Next-Gen Compressed)</option>
                <option value="image/bmp">BMP (Standard Bitmap)</option>
              </select>
            </div>

            {(globalFormat === 'image/jpeg' || globalFormat === 'image/webp') && (
              <div className="control-group">
                <label className="control-label">Global Image Quality</label>
                <div className="quality-slider-container">
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.05"
                    value={globalQuality} 
                    className="quality-slider"
                    onChange={(e) => applyGlobalQuality(parseFloat(e.target.value))}
                  />
                  <span className="quality-val">{Math.round(globalQuality * 100)}%</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Lower quality results in smaller file sizes. Lossless formats (PNG) ignore this parameter.
                </p>
              </div>
            )}

            <div className="control-group" style={{ marginTop: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={globalRemoveBg}
                  onChange={(e) => applyGlobalRemoveBg(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>✂️ Remove Background (AI)</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Automatically isolate subject using client-side AI</span>
                </div>
              </label>
            </div>

            <div className="alert-info-box" style={{ marginTop: '12px' }}>
              <Sliders size={18} />
              <span>
                Settings chosen above will apply to all newly added files, or any current files still in "pending" status.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel empty-state-card">
          <Image className="empty-state-icon" />
          <div>
            <h3>No images loaded</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Upload single or multiple images to convert them to other file types instantly.
            </p>
          </div>
        </div>
      )}

      {/* SEO Guide & FAQ Section */}
      <section className="seo-guide-section">
        <div>
          <h2 className="seo-guide-title">How to Convert Image Formats & Remove Backgrounds</h2>
          <p className="seo-guide-intro">
            Convert image extensions in bulk and remove photo background layers client-side. Follow these steps to optimize and convert your files:
          </p>
          <div className="seo-steps-grid">
            <div className="seo-step-card">
              <div className="seo-step-number">01</div>
              <h3 className="seo-step-title">Load Photos</h3>
              <p className="seo-step-desc">Select or drop PNG, JPG, WebP, or BMP files. You can convert single or multiple files in one batch.</p>
            </div>
            <div className="seo-step-card">
              <div className="seo-step-number">02</div>
              <h3 className="seo-step-title">Configure Formats</h3>
              <p className="seo-step-desc">Pick target formats, adjust quality compression sliders, or check the "Remove Background" AI toggle.</p>
            </div>
            <div className="seo-step-card">
              <div className="seo-step-number">03</div>
              <h3 className="seo-step-title">Convert & Save</h3>
              <p className="seo-step-desc">Click "Convert All" and download individual converted files or retrieve them as a single ZIP archive.</p>
            </div>
          </div>
        </div>

        <div className="seo-faq-container">
          <h3 className="seo-faq-title">Frequently Asked Questions (FAQ)</h3>
          <div className="seo-faq-grid">
            <div className="seo-faq-card">
              <h4 className="seo-faq-q">Which image conversions are supported?</h4>
              <p className="seo-faq-a">You can convert PNG to JPG, WebP to PNG, JPG to PNG, BMP to WebP, and any other configuration between JPG/JPEG, PNG, WebP, and BMP format.</p>
            </div>
            <div className="seo-faq-card">
              <h4 className="seo-faq-q">How does the background removal work?</h4>
              <p className="seo-faq-a">Our background isolation feature runs entirely client-side using state-of-the-art AI networks loaded directly in your browser. This isolates the main subject and makes the background transparent without sending data to any servers.</p>
            </div>
            <div className="seo-faq-card">
              <h4 className="seo-faq-q">What happens if I remove backgrounds and convert to JPG?</h4>
              <p className="seo-faq-a">Since JPG format does not support alpha transparency layers, the removed background area will automatically be styled with a clean white color. For transparent background outputs, choose PNG or WebP format.</p>
            </div>
            <div className="seo-faq-card">
              <h4 className="seo-faq-q">Is this image format converter completely free?</h4>
              <p className="seo-faq-a">Yes. There are no registration forms, upload size limits, or paywalls. Everything is processed directly inside your browser.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
