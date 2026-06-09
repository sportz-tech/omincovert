import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { Document as DocxDocument, Packer, Paragraph, TextRun } from 'docx';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Upload, FileText, Download, Trash2, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

// Set up pdfjsLib to refer to global window instance loaded via CDN
const pdfjsLib = window.pdfjsLib;
if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

export default function DocumentConverter({ initialDocType = 'pdf-to-docx' }) {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  // File Upload Handler
  const handleFileChange = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      const newFiles = selected.map(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        let targetOptions = [];
        let defaultTarget = '';

        if (ext === 'pdf') {
          targetOptions = [
            { value: 'docx', label: 'Word (.docx)' },
            { value: 'xlsx', label: 'Excel (.xlsx)' },
            { value: 'png', label: 'Images (.zip of PNGs)' },
            { value: 'txt', label: 'Plain Text (.txt)' }
          ];
          
          if (initialDocType && initialDocType.startsWith('pdf-to-')) {
            const requestedTarget = initialDocType.replace('pdf-to-', '');
            defaultTarget = targetOptions.some(opt => opt.value === requestedTarget) ? requestedTarget : 'docx';
          } else {
            defaultTarget = 'docx';
          }
        } else if (ext === 'docx') {
          targetOptions = [{ value: 'pdf', label: 'PDF Document (.pdf)' }];
          defaultTarget = 'pdf';
        } else if (ext === 'xlsx' || ext === 'xls') {
          targetOptions = [{ value: 'pdf', label: 'PDF Document (.pdf)' }];
          defaultTarget = 'pdf';
        } else if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext)) {
          targetOptions = [{ value: 'pdf', label: 'PDF Document (.pdf)' }];
          defaultTarget = 'pdf';
        }

        return {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          extension: ext,
          size: (file.size / 1024).toFixed(1) + ' KB',
          file: file,
          status: ['pdf', 'docx', 'xlsx', 'xls', 'png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext) ? 'pending' : 'failed',
          targetFormat: defaultTarget,
          targetOptions: targetOptions,
          progressText: 'Ready',
          convertedBlob: null,
          convertedName: null,
          convertedUrl: null
        };
      });

      setFiles(prev => [...prev, ...newFiles]);
      e.target.value = '';
    }
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateTargetFormat = (id, format) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, targetFormat: format } : f));
  };

  // Convert single PDF to TXT
  const convertPdfToTxt = async (file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const typedarray = new Uint8Array(reader.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.filter(item => item && item.str).map(item => item.str).join(' ');
            text += `--- Page ${i} ---\n` + pageText + '\n\n';
          }
          const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
          resolve(blob);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Convert single PDF to DOCX
  const convertPdfToDocx = async (file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const typedarray = new Uint8Array(reader.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          const paragraphs = [];

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.filter(item => item && item.str).map(item => item.str).join(' ');
            
            paragraphs.push(new Paragraph({
              children: [
                new TextRun({
                  text: `--- PAGE ${i} ---`,
                  bold: true,
                  size: 24
                })
              ]
            }));
            
            paragraphs.push(new Paragraph({
              children: [
                new TextRun({
                  text: pageText,
                  size: 22
                })
              ]
            }));
            
            paragraphs.push(new Paragraph({ text: '' })); // Spacing
          }

          const doc = new DocxDocument({
            sections: [{
              properties: {},
              children: paragraphs
            }]
          });

          const blob = await Packer.toBlob(doc);
          resolve(blob);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Convert DOCX to PDF (using Mammoth to parse, rendering to HTML, exporting via jsPDF)
  const convertDocxToPdf = async (file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result;
          const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
          const html = result.value;

          // Create temporary offscreen rendering node
          const container = document.createElement('div');
          container.style.width = '750px';
          container.style.padding = '40px';
          container.style.color = '#000000';
          container.style.backgroundColor = '#ffffff';
          container.style.fontFamily = 'Inter, sans-serif';
          container.style.fontSize = '14px';
          container.style.lineHeight = '1.6';
          container.innerHTML = html;
          document.body.appendChild(container);

          const doc = new jsPDF('p', 'pt', 'a4');
          
          await doc.html(container, {
            x: 20,
            y: 20,
            width: 550,
            windowWidth: 800
          });

          document.body.removeChild(container);
          const pdfBlob = doc.output('blob');
          resolve(pdfBlob);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Convert XLSX to PDF (parsing via SheetJS, making HTML Table, printing using jsPDF)
  const convertXlsxToPdf = async (file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const data = new Uint8Array(reader.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to HTML Table
          const htmlTable = XLSX.utils.sheet_to_html(worksheet, { editable: false });

          // Create styling container
          const container = document.createElement('div');
          container.style.width = '800px';
          container.style.padding = '30px';
          container.style.backgroundColor = '#ffffff';
          container.style.color = '#000000';
          // Style table headings/cells nicely
          container.innerHTML = `
            <style>
              table { border-collapse: collapse; width: 100%; font-family: monospace; font-size: 11px; }
              td, th { border: 1px solid #ddd; padding: 6px; text-align: left; }
              tr:nth-child(even){background-color: #f9f9f9;}
              th { padding-top: 10px; padding-bottom: 10px; background-color: #f2f2f2; }
            </style>
            <h3 style="font-family: sans-serif; text-align: center; margin-bottom: 15px;">Sheet: ${firstSheetName}</h3>
            ${htmlTable}
          `;
          document.body.appendChild(container);

          const doc = new jsPDF('l', 'pt', 'a4'); // Landscape is better for Excel tables
          
          await doc.html(container, {
            x: 20,
            y: 20,
            width: 800,
            windowWidth: 900
          });

          document.body.removeChild(container);
          const pdfBlob = doc.output('blob');
          resolve(pdfBlob);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Convert single PDF to Excel
  const convertPdfToExcel = async (file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const typedarray = new Uint8Array(reader.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          const wb = XLSX.utils.book_new();
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const rowsMap = {};
            
            textContent.items.forEach(item => {
              if (!item || !item.str || !item.transform || !item.str.trim()) return;
              const y = Math.round(item.transform[5] / 10) * 10;
              const x = item.transform[4];
              
              if (!rowsMap[y]) {
                rowsMap[y] = [];
              }
              rowsMap[y].push({ x, text: item.str });
            });
            
            const sortedY = Object.keys(rowsMap).map(Number).sort((a, b) => b - a);
            const sheetData = [];
            sortedY.forEach(y => {
              const rowItems = rowsMap[y].sort((a, b) => a.x - b.x);
              const rowArray = [];
              let lastX = 0;
              
              rowItems.forEach((item, index) => {
                if (index > 0 && item.x - lastX > 50) {
                  const emptyCellsCount = Math.min(5, Math.floor((item.x - lastX) / 80));
                  for (let k = 0; k < emptyCellsCount; k++) {
                    rowArray.push('');
                  }
                }
                rowArray.push(item.text);
                lastX = item.x + item.text.length * 6;
              });
              sheetData.push(rowArray);
            });
            if (sheetData.length === 0) {
              sheetData.push(['No tabular text detected on this page']);
            }
            
            const ws = XLSX.utils.aoa_to_sheet(sheetData);
            XLSX.utils.book_append_sheet(wb, ws, `Page ${pageNum}`);
          }
          
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
          const buf = new ArrayBuffer(wbout.length);
          const view = new Uint8Array(buf);
          for (let i = 0; i < wbout.length; i++) {
            view[i] = wbout.charCodeAt(i) & 0xFF;
          }
          
          const blob = new Blob([buf], { type: 'application/octet-stream' });
          resolve(blob);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Convert single PDF to PNG Images ZIP
  const convertPdfToPng = async (file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const typedarray = new Uint8Array(reader.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          const zip = new JSZip();

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');

            await page.render({
              canvasContext: ctx,
              viewport: viewport
            }).promise;

            const blob = await new Promise(resolveBlob => canvas.toBlob(resolveBlob, 'image/png'));
            zip.file(`page_${i}.png`, blob);
          }

          const zipBlob = await zip.generateAsync({ type: 'blob' });
          resolve(zipBlob);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Convert single Image to PDF
  const convertImageToPdf = async (fileObj) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.src = e.target.result;
        img.onload = () => {
          const doc = new jsPDF({
            orientation: img.width > img.height ? 'l' : 'p',
            unit: 'px',
            format: [img.width, img.height]
          });
          doc.addImage(img.src, 'PNG', 0, 0, img.width, img.height);
          const pdfBlob = doc.output('blob');
          resolve(pdfBlob);
        };
        img.onerror = () => resolve(null);
      };
      reader.readAsDataURL(fileObj.file);
    });
  };

  // Convert individual file wrapper
  const convertSingle = async (fileObj) => {
    setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'processing', progressText: 'Processing...' } : f));
    
    try {
      let blob;
      let newName = '';
      const origName = fileObj.name.substring(0, fileObj.name.lastIndexOf('.'));

      if (fileObj.extension === 'pdf') {
        if (fileObj.targetFormat === 'docx') {
          blob = await convertPdfToDocx(fileObj.file);
          newName = `${origName}_converted.docx`;
        } else if (fileObj.targetFormat === 'xlsx') {
          blob = await convertPdfToExcel(fileObj.file);
          newName = `${origName}_converted.xlsx`;
        } else if (fileObj.targetFormat === 'png') {
          blob = await convertPdfToPng(fileObj.file);
          newName = `${origName}_pages.zip`;
        } else {
          blob = await convertPdfToTxt(fileObj.file);
          newName = `${origName}_converted.txt`;
        }
      } else if (fileObj.extension === 'docx') {
        blob = await convertDocxToPdf(fileObj.file);
        newName = `${origName}_converted.pdf`;
      } else if (fileObj.extension === 'xlsx' || fileObj.extension === 'xls') {
        blob = await convertXlsxToPdf(fileObj.file);
        newName = `${origName}_converted.pdf`;
      } else if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(fileObj.extension)) {
        blob = await convertImageToPdf(fileObj);
        newName = `${origName}_converted.pdf`;
      }

      if (blob) {
        const url = URL.createObjectURL(blob);
        setFiles(prev => prev.map(f => f.id === fileObj.id ? {
          ...f,
          status: 'completed',
          progressText: 'Success',
          convertedBlob: blob,
          convertedName: newName,
          convertedUrl: url
        } : f));
        return true;
      }
    } catch (err) {
      console.error('Error during document conversion:', err);
      setFiles(prev => prev.map(f => f.id === fileObj.id ? {
        ...f,
        status: 'failed',
        progressText: 'Conversion Error'
      } : f));
    }
    return false;
  };

  // Convert all files in queue
  const convertAll = async () => {
    const pending = files.filter(f => f.status === 'pending' || f.status === 'failed');
    if (pending.length === 0) return;

    setIsProcessing(true);
    for (const f of pending) {
      await convertSingle(f);
    }
    setIsProcessing(false);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8a5cf5', '#00f5ff', '#ff007a']
    });
  };

  // Individual file download trigger
  const downloadFile = (fileObj) => {
    if (!fileObj.convertedUrl) return;
    const a = document.createElement('a');
    a.href = fileObj.convertedUrl;
    a.download = fileObj.convertedName;
    a.click();
  };

  // Bulk ZIP Download
  const downloadAllZip = async () => {
    const completed = files.filter(f => f.status === 'completed');
    if (completed.length === 0) return;

    const zip = new JSZip();
    completed.forEach(f => {
      zip.file(f.convertedName, f.convertedBlob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ominconvert_documents.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getAcceptedExtensions = () => {
    if (!initialDocType) return ".pdf,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.bmp";
    if (initialDocType.startsWith('pdf-to-')) return ".pdf";
    if (initialDocType === 'docx-to-pdf') return ".docx";
    if (initialDocType === 'xlsx-to-pdf') return ".xlsx,.xls";
    return ".pdf,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.bmp";
  };

  const getUploadDesc = () => {
    if (!initialDocType) return "Supports PDF, Word, Excel, and Images (PNG, JPG, WebP, BMP)";
    if (initialDocType === 'pdf-to-docx') return "Upload PDF documents to convert to Word (.docx) format";
    if (initialDocType === 'pdf-to-xlsx') return "Upload PDF documents to extract tables to Excel (.xlsx) format";
    if (initialDocType === 'pdf-to-png') return "Upload PDF documents to convert pages to PNG images";
    if (initialDocType === 'pdf-to-txt') return "Upload PDF documents to extract plain text (.txt)";
    if (initialDocType === 'docx-to-pdf') return "Upload Word (.docx) documents to convert to PDF format";
    if (initialDocType === 'xlsx-to-pdf') return "Upload Excel (.xlsx, .xls) files to convert to PDF format";
    return "Supports PDF, Word, Excel, and Images (PNG, JPG, WebP, BMP)";
  };

  return (
    <div className="workspace-container" style={{
      '--local-theme-color': '#10b981',
      '--local-theme-rgba': 'rgba(16, 185, 129, 0.03)',
      '--local-theme-shadow': 'rgba(16, 185, 129, 0.15)',
      '--local-theme-icon-bg': 'rgba(16, 185, 129, 0.1)',
      '--local-theme-hover-color': 'var(--accent-purple)',
      '--local-theme-hover-bg': 'rgba(138, 92, 245, 0.1)'
    }}>
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
          <p className="drag-drop-title">Drag & drop your files here</p>
          <p className="drag-drop-desc">{getUploadDesc()}</p>
        </div>
          <button className="btn btn-secondary" style={{ pointerEvents: 'none' }}>
            Browse Files
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            className="file-input-hidden" 
            multiple 
            accept={getAcceptedExtensions()}
          onChange={handleFileChange}
        />
      </div>

      {files.length > 0 ? (
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Document Conversion Queue ({files.length})</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className={`btn btn-primary ${isProcessing || files.every(f => f.status === 'completed') ? 'btn-disabled' : ''}`}
                onClick={convertAll}
              >
                {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : 'Convert All'}
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
                  <div className="doc-placeholder-icon">
                    <FileText size={22} />
                  </div>
                  <div className="file-details">
                    <span className="file-name">{f.name}</span>
                    <span className="file-size">{f.size} • Original format: {f.extension.toUpperCase()}</span>
                  </div>
                </div>

                {/* Target conversion options selection */}
                {f.status === 'pending' && f.targetOptions.length > 0 && (
                  <div className="file-row-settings">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Convert to:</span>
                    <select
                      value={f.targetFormat}
                      className="select-control"
                      style={{ padding: '6px 10px', fontSize: '0.8rem', width: '130px' }}
                      onChange={(e) => updateTargetFormat(f.id, e.target.value)}
                    >
                      {f.targetOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="file-actions">
                  <span className={`status-badge ${f.status}`}>
                    {f.status === 'completed' && f.convertedName ? f.convertedName.split('.').pop().toUpperCase() : f.progressText}
                  </span>
                  
                  {f.status === 'pending' && (
                    <button className="btn btn-secondary btn-download-small" onClick={() => convertSingle(f)}>
                      Convert
                    </button>
                  )}
                  {f.status === 'completed' && (
                    <button className="btn btn-secondary btn-download-small" onClick={() => downloadFile(f)}>
                      <Download size={12} /> Download
                    </button>
                  )}
                  <button className="btn-icon-only" onClick={() => removeFile(f.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="alert-info-box" style={{ marginTop: '10px' }}>
            <AlertCircle size={18} />
            <span>
              <strong>Note:</strong> All document parsing and PDF generation happen directly inside your browser. Layout formatting (especially on highly complex desktop layouts) is approximate to optimize file size and privacy.
            </span>
          </div>
        </div>
      ) : (
        <div className="dashboard-grid">
          <div className="glass-panel empty-state-card" style={{ padding: '48px 24px' }}>
            <FileText className="empty-state-icon" style={{ color: '#10b981', filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.25))' }} />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Document Converter</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '8px', maxWidth: '320px', margin: '8px auto 0 auto', lineHeight: '1.5' }}>
                Convert document formats privately between PDF, Word (.docx), Excel (.xlsx), and text offline inside your browser.
              </p>
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              How to Use (Document Guide)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#10b981', flexShrink: 0 }}>1</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  <strong>Upload Documents:</strong> Select or drop Word (.docx), Excel (.xlsx), or PDF (.pdf) files in the upload area above.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#10b981', flexShrink: 0 }}>2</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  <strong>Choose Target Format:</strong> Select the output format (like converting PDF pages to PNG or extracting tables to XLSX sheets).
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#10b981', flexShrink: 0 }}>3</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  <strong>Convert & Save:</strong> Click **Convert All** and download the completed files directly. No servers are used in the conversion process.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEO Guide & FAQ Section */}
      <section className="seo-guide-section">
        <div>
          <h2 className="seo-guide-title">How to Convert PDF, Word Documents & Excel Spreadsheet Files</h2>
          <p className="seo-guide-intro">
            Change file formats instantly between PDF documents, Word DOCX documents, Excel XLSX spreadsheet cell sheets, and text files offline with no server uploads. Follow this simple local conversion guide:
          </p>
          <div className="seo-steps-grid">
            <div className="seo-step-card">
              <div className="seo-step-number">01</div>
              <h3 className="seo-step-title">Select Documents</h3>
              <p className="seo-step-desc">Drag and drop Word documents (.docx), Excel spreadsheets (.xlsx, .xls), or PDF (.pdf) files into the drop zone.</p>
            </div>
            <div className="seo-step-card">
              <div className="seo-step-number">02</div>
              <h3 className="seo-step-title">Choose Output</h3>
              <p className="seo-step-desc">For PDF files, pick the target format (Word Doc, Excel Spreadsheet, Images Zip, or Plain Text) from the settings list.</p>
            </div>
            <div className="seo-step-card">
              <div className="seo-step-number">03</div>
              <h3 className="seo-step-title">Convert and Download</h3>
              <p className="seo-step-desc">Click "Convert All" and download the converted files. Processing happens instantly on your device.</p>
            </div>
          </div>
        </div>

        <div className="seo-faq-container">
          <h3 className="seo-faq-title">Frequently Asked Questions (FAQ)</h3>
          <div className="seo-faq-grid">
            <div className="seo-faq-card">
              <h4 className="seo-faq-q">Which document formats can I convert?</h4>
              <p className="seo-faq-a">Our converter supports PDF to Word Doc (DOCX), PDF to Excel Spreadsheet Cell Sheet (XLSX), PDF to Plain Text (TXT), PDF to Images (PNG), Word to PDF, and Excel to PDF.</p>
            </div>
            <div className="seo-faq-card">
              <h4 className="seo-faq-q">Are my documents sent to any external server?</h4>
              <p className="seo-faq-a">No. All file readers, converters, layout parsers, and file writers are programmed to execute locally on your computer. Your document data is 100% confidential and secure.</p>
            </div>
            <div className="seo-faq-card">
              <h4 className="seo-faq-q">How does PDF to Excel Spreadsheet Cell Sheet conversion work?</h4>
              <p className="seo-faq-a">Our browser engine reads textual cell layouts inside PDF document layouts. It groups structured tables into data columns and exports them into an offline Excel XLSX spreadsheet cell sheet instantly using client-side JavaScript.</p>
            </div>
            <div className="seo-faq-card">
              <h4 className="seo-faq-q">Can I convert images to PDF documents?</h4>
              <p className="seo-faq-a">Yes. In addition to Word and Excel documents, you can drop PNG, JPG, or WebP images into the converter to merge them into a single PDF file.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
