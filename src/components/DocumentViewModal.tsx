import React, { useState } from 'react';
import { CompanyProfile, CurrencyConfig, Document, StaffUser } from '../types';
import { downloadDocumentPdf, generateDocumentPdfBlob, formatCurrency } from '../services/pdfGenerator';
import { uploadPdfToDrive } from '../services/googleDrive';
import { A4DocumentSheet } from './A4DocumentSheet';
import { 
  X, Download, CloudUpload, ExternalLink, Send, CreditCard, 
  FileCheck, Truck, Printer, CheckCircle2, FileText
} from 'lucide-react';

interface DocumentViewModalProps {
  document: Document;
  company: CompanyProfile;
  currencies: CurrencyConfig[];
  currentUser: StaffUser;
  driveAccessToken: string | null;
  onClose: () => void;
  onRecordPayment: (doc: Document) => void;
  onSendReminder: (doc: Document) => void;
  onConvertToInvoice?: (proformaDoc: Document) => void;
  onUpdateDocument: (updated: Document) => void;
}

export const DocumentViewModal: React.FC<DocumentViewModalProps> = ({
  document: doc,
  company,
  currencies,
  currentUser,
  driveAccessToken,
  onClose,
  onRecordPayment,
  onSendReminder,
  onConvertToInvoice,
  onUpdateDocument,
}) => {
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [driveSuccessMsg, setDriveSuccessMsg] = useState<string | null>(null);

  const balanceDue = Math.max(0, doc.grandTotal - doc.paidAmount);

  const handleDownloadPdf = () => {
    downloadDocumentPdf(doc, company, currencies);
  };

  const handlePrintA4 = () => {
    const sheetElement = document.getElementById('a4-printable-sheet');
    if (!sheetElement) {
      window.print();
      return;
    }

    // Create an isolated hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    // Extract stylesheets so print iframe matches exact styling
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${doc.documentNumber}_${doc.clientCompany || doc.clientName}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .a4-sheet-container {
              width: 210mm !important;
              max-width: 210mm !important;
              min-height: 297mm !important;
              box-sizing: border-box !important;
              padding: 10mm 12mm !important;
              margin: 0 auto !important;
              border: none !important;
              box-shadow: none !important;
              background: #ffffff !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div style="width: 210mm; margin: 0 auto; box-sizing: border-box;">
            ${sheetElement.outerHTML}
          </div>
        </body>
      </html>
    `;

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printHtml);
      iframeDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print fallback to window.print', e);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        }
      }, 350);
    } else {
      window.print();
    }
  };

  const handleSyncToDrive = async () => {
    if (!driveAccessToken) {
      alert('Please connect Google Drive using the "Sign in with Google" button in the navigation bar first.');
      return;
    }

    try {
      setIsUploadingToDrive(true);
      setDriveSuccessMsg(null);
      const pdfBlob = generateDocumentPdfBlob(doc, company, currencies);
      const fileName = `${doc.documentNumber}_${doc.clientCompany || doc.clientName}`.replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';
      const result = await uploadPdfToDrive(driveAccessToken, fileName, pdfBlob);

      const updated: Document = {
        ...doc,
        driveFileId: result.fileId,
        driveViewLink: result.webViewLink,
        lastSyncedWithDrive: new Date().toISOString(),
      };

      onUpdateDocument(updated);
      setDriveSuccessMsg('Successfully synced & uploaded PDF to Google Drive!');
      setTimeout(() => setDriveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to sync to Drive:', err);
      alert(`Could not upload to Google Drive: ${err.message || err}`);
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  return (
    <div className="document-view-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:block">
      <div className="document-view-modal-content bg-white rounded-xl shadow-2xl w-full max-w-5xl my-auto overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none print:overflow-visible print:m-0 print:p-0">
        
        {/* Top Control Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 no-print">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md tracking-wider ${
              doc.type === 'invoice' 
                ? 'bg-blue-600 text-white' 
                : doc.type === 'proforma' 
                ? 'bg-amber-600 text-white' 
                : 'bg-emerald-600 text-white'
            }`}>
              {doc.type === 'invoice' ? 'Tax Invoice' : doc.type === 'proforma' ? 'Proforma Invoice' : 'Delivery Challan'}
            </span>
            <span className="font-mono text-sm font-semibold text-slate-200">{doc.documentNumber}</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-950/60 border border-blue-800 px-2 py-0.5 rounded">
              <FileText className="w-3 h-3" />
              <span>A4 Standard (210×297mm)</span>
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Print A4 Sheet */}
            <button
              onClick={handlePrintA4}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700 cursor-pointer"
              title="Print standard A4 sheet"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print A4</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700 cursor-pointer"
              title="Download PDF locally"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>PDF</span>
            </button>

            {/* Sync to Google Drive */}
            <button
              onClick={handleSyncToDrive}
              disabled={isUploadingToDrive}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700 cursor-pointer"
              title="Store PDF on your Google Drive"
            >
              {isUploadingToDrive ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="hidden sm:inline">{doc.driveFileId ? 'Re-sync' : 'Drive'}</span>
            </button>

            {doc.driveViewLink && (
              <a
                href={doc.driveViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-950/60 hover:bg-blue-900 border border-blue-800 text-blue-300 text-xs font-semibold rounded-lg transition-colors"
                title="Open in Google Drive"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Drive File</span>
              </a>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors ml-1 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drive Success Alert */}
        {driveSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-xs font-medium text-emerald-800 no-print">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{driveSuccessMsg}</span>
          </div>
        )}

        {/* Document Body (Standard A4 Format) */}
        <div className="p-3 sm:p-6 md:p-8 max-h-[82vh] overflow-y-auto bg-slate-200/90 font-sans print:p-0 print:m-0 print:bg-white print:max-h-none print:overflow-visible flex justify-center">
          <A4DocumentSheet
            document={doc}
            company={company}
            currencies={currencies}
          />
        </div>

        {/* Bottom Action Controls Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="text-xs text-slate-500">
            Status: <span className="font-bold uppercase text-slate-800">{doc.status}</span>
            {balanceDue > 0 && doc.type === 'invoice' && (
              <span className="ml-3 text-red-600 font-semibold">
                Balance Due: {formatCurrency(balanceDue, doc.currency, currencies)}
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Convert Proforma to Invoice */}
            {doc.type === 'proforma' && onConvertToInvoice && (
              <button
                onClick={() => onConvertToInvoice(doc)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Convert to Tax Invoice</span>
              </button>
            )}

            {/* Delivery Challan status actions */}
            {doc.type === 'challan' && doc.status !== 'delivered' && (
              <button
                onClick={() => {
                  const updated: Document = {
                    ...doc,
                    status: 'delivered',
                    dispatchedAt: doc.dispatchedAt || new Date().toISOString(),
                    deliveredAt: new Date().toISOString(),
                  };
                  onUpdateDocument(updated);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Mark Delivered</span>
              </button>
            )}

            {/* Record Payment Button */}
            {doc.type === 'invoice' && balanceDue > 0 && (
              <button
                onClick={() => onRecordPayment(doc)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            )}

            {/* Send Reminder Button */}
            {doc.type === 'invoice' && balanceDue > 0 && (
              <button
                onClick={() => onSendReminder(doc)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-slate-600" />
                <span>Send Reminder</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
