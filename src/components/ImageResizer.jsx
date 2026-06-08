import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { Upload, Download, Trash2, Maximize, Crop, Eye, Sliders, Image, Check, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

const PRESETS = [
  { id: 'insta_story', label: 'Instagram Stories/Reels', ratio: '9:16', w: 1080, h: 1920, icon: '📱' },
  { id: 'insta_square', label: 'Instagram Feed (1:1)', ratio: '1:1', w: 1080, h: 1080, icon: '⏹️' },
  { id: 'insta_portrait', label: 'Instagram Feed (4:5)', ratio: '4:5', w: 1080, h: 1350, icon: '📸' },
  { id: 'fb_feed', label: 'Facebook Feed Post', ratio: '1.91:1', w: 1200, h: 630, icon: '📰' },
  { id: 'fb_cover', label: 'Facebook Cover Photo', ratio: '2.63:1', w: 820, h: 312, icon: '🖼️' },
  { id: 'yt_thumb', label: 'YouTube Thumbnail', ratio: '16:9', w: 1280, h: 720, icon: '📺' },
  { id: 'pinterest_pin', label: 'Pinterest Pin', ratio: '2:3', w: 1000, h: 1500, icon: '📌' },
  { id: 'custom', label: 'Custom Dimension', ratio: 'Custom', w: 1000, h: 1000, icon: '⚙️' }
];

export default function ImageResizer() {
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  
  // Resizing Configurations
  const [selectedPresetId, setSelectedPresetId] = useState('insta_story');
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1920);
  const [fitMode, setFitMode] = useState('cover'); // 'cover' or 'contain'
  const [backgroundStyle, setBackgroundStyle] = useState('blur'); // 'blur', 'black', 'white'
  const [isProcessing, setIsProcessing] = useState(false);
  
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeFile = files.find(f => f.id === activeFileId);
  const activePreset = PRESETS.find(p => p.id === selectedPresetId);

  const targetWidth = selectedPresetId === 'custom' ? customWidth : activePreset.w;
  const targetHeight = selectedPresetId === 'custom' ? customHeight : activePreset.h;

  // Handle file select
  const handleFileChange = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      const newFiles = selected.map(file => ({
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        file: file,
        preview: URL.createObjectURL(file),
        status: 'pending', // pending, completed, failed
        resizedUrl: null,
        resizedName: null
      }));

      setFiles(prev => {
        const updated = [...prev, ...newFiles];
        if (!activeFileId && updated.length > 0) {
          setActiveFileId(updated[0].id);
        }
        return updated;
      });
      e.target.value = '';
    }
  };

  const removeFile = (id) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      if (activeFileId === id) {
        setActiveFileId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  // Re-draw Canvas whenever configurations or active file changes
  useEffect(() => {
    if (activeFile && canvasRef.current) {
      drawOnCanvas(activeFile.preview, canvasRef.current, targetWidth, targetHeight);
    }
  }, [activeFileId, selectedPresetId, customWidth, customHeight, fitMode, backgroundStyle, files]);

  // Canvas drawing core logic
  const drawOnCanvas = (imgUrl, canvas, tw, th) => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.src = imgUrl;
      img.onload = () => {
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext('2d');
        
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const targetRatio = tw / th;

        if (fitMode === 'cover') {
          // Crop and Fill
          let sw, sh, sx, sy;
          if (imgRatio > targetRatio) {
            sh = img.naturalHeight;
            sw = sh * targetRatio;
            sx = (img.naturalWidth - sw) / 2;
            sy = 0;
          } else {
            sw = img.naturalWidth;
            sh = sw / targetRatio;
            sx = 0;
            sy = (img.naturalHeight - sh) / 2;
          }
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
        } else {
          // Contain & Fit
          // 1. Draw Background style
          if (backgroundStyle === 'black') {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, tw, th);
          } else if (backgroundStyle === 'white') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, tw, th);
          } else if (backgroundStyle === 'blur') {
            // Draw blurred background
            ctx.filter = 'blur(25px) brightness(0.6)';
            
            // Draw image stretched to cover background
            let bsw, bsh, bsx, bsy;
            if (imgRatio > targetRatio) {
              bsh = img.naturalHeight;
              bsw = bsh * targetRatio;
              bsx = (img.naturalWidth - bsw) / 2;
              bsy = 0;
            } else {
              bsw = img.naturalWidth;
              bsh = bsw / targetRatio;
              bsx = 0;
              bsy = (img.naturalHeight - bsh) / 2;
            }
            ctx.drawImage(img, bsx, bsy, bsw, bsh, -40, -40, tw + 80, th + 80);
            ctx.filter = 'none'; // reset filter
          }

          // 2. Draw centered image
          let dw, dh, dx, dy;
          if (imgRatio > targetRatio) {
            dw = tw;
            dh = dw / imgRatio;
            dx = 0;
            dy = (th - dh) / 2;
          } else {
            dh = th;
            dw = dh * imgRatio;
            dx = (tw - dw) / 2;
            dy = 0;
          }
          ctx.drawImage(img, dx, dy, dw, dh);
        }
        resolve(true);
      };
      img.onerror = () => resolve(false);
    });
  };

  // Process all files in queue
  const resizeAll = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    const tempCanvas = document.createElement('canvas');

    const updatedFiles = [];
    for (const fileObj of files) {
      await drawOnCanvas(fileObj.preview, tempCanvas, targetWidth, targetHeight);
      
      const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/jpeg', 0.9));
      const ext = 'jpg';
      const origName = fileObj.name.substring(0, fileObj.name.lastIndexOf('.'));
      const newName = `${origName}_resized_${targetWidth}x${targetHeight}.${ext}`;
      const url = URL.createObjectURL(blob);

      updatedFiles.push({
        ...fileObj,
        status: 'completed',
        resizedUrl: url,
        resizedName: newName
      });
    }

    setFiles(updatedFiles);
    setIsProcessing(false);

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#8a5cf5', '#00f5ff', '#ff007a']
    });
  };

  // Download Individual file
  const downloadSingle = (fileObj) => {
    if (!fileObj.resizedUrl) return;
    const a = document.createElement('a');
    a.href = fileObj.resizedUrl;
    a.download = fileObj.resizedName;
    a.click();
  };

  // Download All as ZIP
  const downloadAllZip = async () => {
    const completed = files.filter(f => f.status === 'completed');
    if (completed.length === 0) return;

    const zip = new JSZip();
    for (const f of completed) {
      const res = await fetch(f.resizedUrl);
      const blob = await res.blob();
      zip.file(f.resizedName, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omniconvert_resized_${targetWidth}x${targetHeight}.zip`;
    a.click();
    URL.revokeObjectURL(url);
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
          <p className="drag-drop-desc">Resize multiple images at once to any social media ratio (Facebook Feed/Cover, Instagram Story/Reel, YouTube)</p>
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
        <div className="resizer-workspace">
          {/* Left Canvas Preview Area */}
          <div className="canvas-preview-container">
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.05rem' }}>Visual Output Preview ({targetWidth} × {targetHeight}px)</h3>
                <span className="status-badge completed" style={{ fontSize: '0.7rem' }}>
                  Ratio: {selectedPresetId === 'custom' ? `${customWidth}:${customHeight}` : activePreset.ratio}
                </span>
              </div>
              
              <div className="canvas-wrapper">
                <canvas ref={canvasRef} className="actual-resizer-canvas" />
              </div>
            </div>

            {/* Scrollable Gallery Selection Strip */}
            <div className="glass-panel" style={{ padding: '12px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                Select image to edit / preview:
              </p>
              <div className="strip-scroll">
                {files.map(f => (
                  <div 
                    key={f.id} 
                    className={`strip-item ${f.id === activeFileId ? 'active' : ''}`}
                    onClick={() => setActiveFileId(f.id)}
                  >
                    <img src={f.preview} alt="" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Configuration Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Presets Card */}
            <div className="glass-panel control-panel">
              <h3 className="panel-section-title">Select Aspect Ratio</h3>
              <div className="preset-grid">
                {PRESETS.map(p => (
                  <div 
                    key={p.id} 
                    className={`preset-card ${p.id === selectedPresetId ? 'active' : ''}`}
                    onClick={() => setSelectedPresetId(p.id)}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{p.icon}</span>
                    <span className="preset-label" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }}>
                      {p.label.split(' ')[0]}
                    </span>
                    <span className="preset-ratio">{p.ratio}</span>
                  </div>
                ))}
              </div>

              {selectedPresetId === 'custom' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                  <div className="control-group">
                    <label className="control-label">Width (px)</label>
                    <input 
                      type="number" 
                      className="input-control"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="control-group">
                    <label className="control-label">Height (px)</label>
                    <input 
                      type="number" 
                      className="input-control"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Fit Controls */}
            <div className="glass-panel control-panel">
              <h3 className="panel-section-title">Fit & Background Styles</h3>
              
              <div className="control-group">
                <label className="control-label">Fit Mode</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className={`btn flex-1 ${fitMode === 'cover' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFitMode('cover')}
                    style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                  >
                    <Crop size={16} /> Cover & Crop
                  </button>
                  <button 
                    className={`btn flex-1 ${fitMode === 'contain' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFitMode('contain')}
                    style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                  >
                    <Maximize size={16} /> Contain & Fit
                  </button>
                </div>
              </div>

              {fitMode === 'contain' && (
                <div className="control-group" style={{ marginTop: '8px' }}>
                  <label className="control-label">Padding Background</label>
                  <select 
                    value={backgroundStyle}
                    className="select-control"
                    onChange={(e) => setBackgroundStyle(e.target.value)}
                  >
                    <option value="blur">✨ Blurred Image (Premium)</option>
                    <option value="black">⬛ Black Bars</option>
                    <option value="white">⬜ White Bars</option>
                  </select>
                </div>
              )}
            </div>

            {/* Processing Commands */}
            <div className="glass-panel control-panel" style={{ background: 'linear-gradient(185deg, rgba(138,92,245,0.08) 0%, rgba(17,25,40,0.55) 100%)' }}>
              <h3 className="panel-section-title">Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  className={`btn btn-primary w-full ${isProcessing ? 'btn-disabled' : ''}`}
                  onClick={resizeAll}
                >
                  {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : 'Resize All Uploads'}
                </button>
                
                {files.some(f => f.status === 'completed') && (
                  <button className="btn btn-secondary w-full" onClick={downloadAllZip}>
                    <Download size={16} /> Download All (ZIP)
                  </button>
                )}
              </div>

              {/* Status List per image */}
              <div style={{ marginTop: '12px', borderTop: '1px solid var(--card-border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {files.map(f => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                    <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '140px' }}>
                      {f.name}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {f.status === 'completed' ? (
                        <>
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>Ready</span>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                            onClick={() => downloadSingle(f)}
                          >
                            Download
                          </button>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Pending</span>
                      )}
                      <button 
                        style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                        onClick={() => removeFile(f.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel empty-state-card">
          <Image className="empty-state-icon" />
          <div>
            <h3>No images loaded</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Upload single or multiple images to resize, crop, and output them in custom aspect ratios or social formats.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
