import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { Upload, FileText, Copy, Download, Trash2, Check, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OCRTool({ initialLanguage = 'eng' }) {
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [ocrLanguage, setOcrLanguage] = useState(initialLanguage);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (initialLanguage) {
      setOcrLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  const activeFile = files.find(f => f.id === activeFileId);

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
        status: 'pending', // pending, processing, completed, failed
        progress: 0,
        progressText: 'Ready to convert',
        text: ''
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

  // Perform OCR on a single file
  const performOCR = async (fileObj) => {
    // Update status to processing
    setFiles(prev => prev.map(f => f.id === fileObj.id ? { 
      ...f, 
      status: 'processing', 
      progress: 0, 
      progressText: 'Initializing OCR...' 
    } : f));

    try {
      const result = await Tesseract.recognize(
        fileObj.file,
        ocrLanguage,
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setFiles(prev => prev.map(f => f.id === fileObj.id ? { 
                ...f, 
                progress: Math.round(m.progress * 100), 
                progressText: `Recognizing: ${Math.round(m.progress * 100)}%` 
              } : f));
            } else {
              setFiles(prev => prev.map(f => f.id === fileObj.id ? { 
                ...f, 
                progressText: m.status.replace(/_/g, ' ') 
              } : f));
            }
          }
        }
      );

      setFiles(prev => prev.map(f => f.id === fileObj.id ? { 
        ...f, 
        status: 'completed', 
        progress: 100, 
        progressText: 'Success', 
        text: result.data.text 
      } : f));
      
      return result.data.text;
    } catch (err) {
      console.error(err);
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { 
        ...f, 
        status: 'failed', 
        progressText: 'OCR Failed' 
      } : f));
      return null;
    }
  };

  // Run OCR on all files that are pending or failed
  const convertAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'failed');
    if (pendingFiles.length === 0) return;

    setIsProcessingAll(true);
    for (const f of pendingFiles) {
      await performOCR(f);
    }
    setIsProcessingAll(false);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8a5cf5', '#00f5ff', '#ff007a']
    });
  };

  // Copy text to clipboard
  const handleCopy = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download TXT
  const downloadTxt = (name, text) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name.substring(0, name.lastIndexOf('.')) + '_extracted.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download DOCX
  const downloadDocx = async (name, text) => {
    const paragraphs = text.split('\n').map(line => {
      return new Paragraph({
        children: [new TextRun(line)]
      });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name.substring(0, name.lastIndexOf('.')) + '_extracted.docx';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Bulk Download Zip of Text Files
  const downloadAllZip = async () => {
    const completed = files.filter(f => f.status === 'completed');
    if (completed.length === 0) return;

    const zip = new JSZip();
    completed.forEach(f => {
      const txtName = f.name.substring(0, f.name.lastIndexOf('.')) + '_extracted.txt';
      zip.file(txtName, f.text);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'omniconvert_ocr_texts.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTextChange = (id, newText) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, text: newText } : f));
  };

  return (
    <div className="workspace-container">
      {/* Drag Drop Area */}
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
          <p className="drag-drop-desc">Supports PNG, JPG, JPEG, WebP, BMP (Batch upload supported)</p>
        </div>
        <button className="btn btn-secondary" style={{ pointerEvents: 'none' }}>
          Browse Files
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
          {/* File Queue & Controls */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Upload Queue ({files.length})</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className={`btn btn-primary ${isProcessingAll || files.every(f => f.status === 'completed') ? 'btn-disabled' : ''}`}
                  onClick={convertAll}
                >
                  {isProcessingAll ? <RefreshCw className="animate-spin" size={16} /> : 'Convert All'}
                </button>
                {files.some(f => f.status === 'completed') && (
                  <button className="btn btn-secondary" onClick={downloadAllZip}>
                    <Download size={16} /> Download All (ZIP)
                  </button>
                )}
              </div>
            </div>

            {/* Language Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--card-border)', paddingTop: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>OCR Language:</span>
              <select
                value={ocrLanguage}
                className="select-control"
                style={{ padding: '6px 10px', fontSize: '0.8rem', width: '160px' }}
                onChange={(e) => setOcrLanguage(e.target.value)}
              >
                <option value="eng">🇬🇧 English</option>
                <option value="hin">🇮🇳 Hindi (हिन्दी)</option>
                <option value="eng+hin">🇮🇳 English + Hindi</option>
                <option value="spa">🇪🇸 Spanish</option>
                <option value="fra">🇫🇷 French</option>
                <option value="deu">🇩🇪 German</option>
              </select>
            </div>

            {/* List scrollbar */}
            <div className="file-list-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {files.map(f => (
                <div 
                  key={f.id} 
                  className={`file-row-card ${f.id === activeFileId ? 'gradient-border' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveFileId(f.id)}
                >
                  <div className={`${f.id === activeFileId ? 'gradient-border-content' : ''} file-row-inner`} style={{ padding: f.id === activeFileId ? '11px 17px' : '12px 18px' }}>
                    <div className="file-info">
                      <img src={f.preview} alt="" className="file-thumbnail" />
                      <div className="file-details">
                        <span className="file-name">{f.name}</span>
                        <span className="file-size">{f.size}</span>
                      </div>
                    </div>

                    <div className="file-actions" onClick={(e) => e.stopPropagation()}>
                      <span className={`status-badge ${f.status}`}>
                        {f.status}
                      </span>
                      {f.status === 'pending' && (
                        <button className="btn btn-secondary btn-download-small" onClick={() => performOCR(f)}>
                          Start
                        </button>
                      )}
                      {f.status === 'completed' && (
                        <button className="btn btn-secondary btn-download-small" onClick={() => downloadTxt(f.name, f.text)}>
                          <Download size={12} /> TXT
                        </button>
                      )}
                      <button className="btn-icon-only" onClick={() => removeFile(f.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details Pane */}
          {activeFile && (
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <div className="ocr-pane-title">
                <span style={{ fontSize: '0.88rem' }}>Active Document: {activeFile.name}</span>
                <span className={`status-badge ${activeFile.status}`}>{activeFile.status}</span>
              </div>

              {activeFile.status === 'processing' ? (
                <div className="ocr-status-progress">
                  <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--accent-purple)', marginBottom: '8px' }} />
                  <p style={{ fontWeight: 600 }}>Running Image-to-Text OCR</p>
                  <p className="file-size">{activeFile.progressText}</p>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${activeFile.progress}%` }}></div>
                  </div>
                </div>
              ) : activeFile.status === 'completed' ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '10px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--card-border)' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => handleCopy(activeFile.id, activeFile.text)}
                    >
                      {copiedId === activeFile.id ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                      {copiedId === activeFile.id ? 'Copied' : 'Copy'}
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => downloadTxt(activeFile.name, activeFile.text)}
                    >
                      <Download size={14} /> TXT
                    </button>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => downloadDocx(activeFile.name, activeFile.text)}
                    >
                      <FileText size={14} /> Word (DOCX)
                    </button>
                  </div>
                  <textarea
                    className="ocr-textarea"
                    value={activeFile.text}
                    onChange={(e) => handleTextChange(activeFile.id, e.target.value)}
                    placeholder="Extracted text will appear here. You can edit it before downloading."
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '40px 20px', alignItems: 'center', textAlign: 'center' }}>
                  <div className="preview-container" style={{ minHeight: '180px', width: '100%' }}>
                    <img src={activeFile.preview} className="preview-image" alt="preview" style={{ maxHeight: '180px' }} />
                  </div>
                  {activeFile.status === 'failed' ? (
                    <div style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={18} />
                      <span>OCR failed to process this image.</span>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      Ready to convert this image. Click "Convert All" or the "Start" button next to the file name to run OCR.
                    </p>
                  )}
                  <button className="btn btn-primary" onClick={() => performOCR(activeFile)}>
                    Run OCR Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel empty-state-card">
          <FileText className="empty-state-icon" />
          <div>
            <h3>No images uploaded yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Upload images containing English text to extract and convert them to TXT or MS Word (.docx) format.
            </p>
          </div>
        </div>
      )}

      {/* SEO Guide & FAQ Section */}
      <section className="seo-guide-section">
        <div>
          <h2 className="seo-guide-title">How to Extract Text from Images with Client-Side OCR</h2>
          <p className="seo-guide-intro">
            OmniConvert provides a secure, serverless Optical Character Recognition (OCR) tool that reads text from images instantly. Follow these three simple steps to convert files:
          </p>
          <div className="seo-steps-grid">
            <div className="seo-step-card">
              <div className="seo-step-number">01</div>
              <h3 className="seo-step-title">Upload Images</h3>
              <p className="seo-step-desc">Drag and drop one or multiple JPEG, PNG, or WebP images into the upload area above.</p>
            </div>
            <div className="seo-step-card">
              <div className="seo-step-number">02</div>
              <h3 className="seo-step-title">Select Language</h3>
              <p className="seo-step-desc">Choose the language (English or Hindi) contained in your image to maximize text recognition accuracy.</p>
            </div>
            <div className="seo-step-card">
              <div className="seo-step-number">03</div>
              <h3 className="seo-step-title">Edit & Download</h3>
              <p className="seo-step-desc">Refine the extracted text directly in the browser and download it as a plain TXT, Word document (.docx), or ZIP.</p>
            </div>
          </div>
        </div>

        <div className="seo-faq-container">
          <h3 className="seo-faq-title">Frequently Asked Questions (FAQ)</h3>
          <div className="seo-faq-grid">
            <div className="seo-faq-card">
              <h4 className="seo-faq-q">Is my uploaded document secure?</h4>
              <p className="seo-faq-a">Yes. Your images are never uploaded to any server. All text extraction is performed entirely on your computer using client-side WebAssembly. This ensures 100% data privacy.</p>
            </div>
            <div className="seo-faq-card">
              <h4 className="seo-faq-q">Can this tool read handwritten text?</h4>
              <p className="seo-faq-a">Our OCR tool works best on typed, scanned, or digital document screenshots. Recognition accuracy for handwriting depends heavily on the legibility of the script.</p>
            </div>
            <div className="seo-faq-card">
              <h4 className="seo-faq-q">Can I extract text from multiple images at once?</h4>
              <p className="seo-faq-a">Absolutely. You can select multiple images to upload in bulk. You can then run OCR on all of them sequentially and download the zipped results.</p>
            </div>
            <div className="seo-faq-card">
              <h4 className="seo-faq-q">Does this tool support Hindi OCR?</h4>
              <p className="seo-faq-a">Yes, we have native support for Devanagari script (Hindi). Just select "Hindi" from the language dropdown before processing your image.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
