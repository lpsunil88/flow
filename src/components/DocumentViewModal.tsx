import React, { useState } from 'react';
import { CompanyProfile, CurrencyConfig, Document, StaffUser, InvoiceTemplate } from '../types';
import { formatCurrency, downloadDocumentPdf, generateDocumentPdfBlob } from '../services/pdfGenerator';
import { uploadPdfToDrive } from '../services/googleDrive';
import { DOCUMENT_DESIGNS, getDesignForDocument, DocumentDesign } from '../services/themeEngine';
import { 
  X, Download, CloudUpload, ExternalLink, Send, CreditCard, 
  FileCheck, Truck, Printer, CheckCircle2, AlertCircle, RefreshCw, Palette, Building2,
  LayoutTemplate, Check, ShieldCheck, FileText, QrCode
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

  const defaultDesignId =
    doc.designId ||
    doc.theme ||
    (doc.type === 'invoice'
      ? company.defaultInvoiceDesign || company.invoiceTheme
      : doc.type === 'proforma'
      ? company.defaultProformaDesign || company.proformaTheme
      : company.defaultChallanDesign || company.challanTheme);

  const design = getDesignForDocument(doc.type, defaultDesignId);
  const theme = design.theme;

  const currentTemplate: InvoiceTemplate =
    doc.invoiceTemplate ||
    doc.template ||
    (design.id === 'classic-corporate' || design.id === 'tender-formal'
      ? 'Classic'
      : design.id === 'modern-minimal' || design.id === 'compact-grid'
      ? 'Minimal'
      : 'Modern');

  const handleTemplateSelect = (template: InvoiceTemplate) => {
    let targetDesignId = 'executive-split';
    if (template === 'Classic') targetDesignId = 'classic-corporate';
    if (template === 'Minimal') targetDesignId = 'modern-minimal';

    const selectedDesign = DOCUMENT_DESIGNS.find((d) => d.id === targetDesignId);
    const updated: Document = {
      ...doc,
      designId: targetDesignId,
      theme: selectedDesign ? selectedDesign.theme.id : doc.theme,
      invoiceTemplate: template,
      template: template,
    };
    onUpdateDocument(updated);
  };

  const handleDesignChange = (newDesignId: string) => {
    const selectedDesign = DOCUMENT_DESIGNS.find((d) => d.id === newDesignId);
    let newTemplate: InvoiceTemplate = 'Modern';
    if (newDesignId === 'classic-corporate' || newDesignId === 'tender-formal') {
      newTemplate = 'Classic';
    } else if (newDesignId === 'modern-minimal' || newDesignId === 'compact-grid') {
      newTemplate = 'Minimal';
    }
    const updated: Document = {
      ...doc,
      designId: newDesignId,
      theme: selectedDesign ? selectedDesign.theme.id : doc.theme,
      invoiceTemplate: newTemplate,
      template: newTemplate,
    };
    onUpdateDocument(updated);
  };

  const balanceDue = Math.max(0, doc.grandTotal - doc.paidAmount);

  const handleDownloadPdf = () => {
    downloadDocumentPdf(doc, company, currencies);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-auto overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Control Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md tracking-wider ${theme.web.badgeBg} ${theme.web.badgeText}`}>
              {doc.type === 'invoice' ? 'Tax Invoice' : doc.type === 'proforma' ? 'Proforma Invoice' : 'Delivery Challan'}
            </span>
            <span className="font-mono text-sm font-semibold">{doc.documentNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Visual Style Template Switcher (Modern / Classic / Minimal) */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              {(['Modern', 'Classic', 'Minimal'] as const).map((tmpl) => {
                const isSelected = currentTemplate === tmpl;
                return (
                  <button
                    key={tmpl}
                    type="button"
                    onClick={() => handleTemplateSelect(tmpl)}
                    className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                    }`}
                  >
                    {tmpl}
                  </button>
                );
              })}
            </div>

            {/* Live Design Layout Switcher */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-lg text-xs border border-slate-700">
              <LayoutTemplate className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] text-slate-300 font-medium">Layout:</span>
              <select
                value={design.id}
                onChange={(e) => handleDesignChange(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {DOCUMENT_DESIGNS.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                    {d.name} ({d.badge})
                  </option>
                ))}
              </select>
            </div>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              title="Download PDF locally"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            {/* Sync to Google Drive */}
            <button
              onClick={handleSyncToDrive}
              disabled={isUploadingToDrive}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              title="Store PDF on your Google Drive"
            >
              {isUploadingToDrive ? (
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="hidden sm:inline">
                {isUploadingToDrive ? 'Uploading...' : 'Save to Drive'}
              </span>
            </button>

            {/* Drive Link if already uploaded */}
            {doc.driveViewLink && (
              <a
                href={doc.driveViewLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-900/40 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-semibold rounded-lg transition-colors"
                title="View in Google Drive"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="hidden md:inline">Drive View</span>
              </a>
            )}

            {/* Convert Proforma to Invoice button */}
            {doc.type === 'proforma' && onConvertToInvoice && (
              <button
                onClick={() => onConvertToInvoice(doc)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Convert to Invoice</span>
              </button>
            )}

            {/* Record Payment */}
            {doc.type === 'invoice' && balanceDue > 0 && (
              <button
                onClick={() => onRecordPayment(doc)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Pay</span>
              </button>
            )}

            {/* Send Reminder */}
            {doc.type === 'invoice' && balanceDue > 0 && (
              <button
                onClick={() => onSendReminder(doc)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Reminder</span>
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert for Drive Sync */}
        {driveSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{driveSuccessMsg}</span>
          </div>
        )}

        {/* Document Body (Printable Sheet Layout) */}
        <div className="p-4 sm:p-8 max-h-[80vh] overflow-y-auto bg-slate-100 font-sans">
          
          {/* THERMAL POS RETAIL SLIP LAYOUT */}
          {design.layoutType === 'thermal-slip' ? (
            <div className="max-w-md mx-auto bg-white p-6 shadow-md border-2 border-dashed border-slate-400 font-mono text-xs text-slate-800 space-y-4 rounded-sm">
              <div className="text-center pb-3 border-b border-dashed border-slate-400">
                <h1 className="text-base font-bold uppercase tracking-wider">{company.name}</h1>
                <p className="text-[11px] text-slate-600 mt-0.5">{company.address}, {company.city}</p>
                <p className="text-[11px] text-slate-600">GSTIN / Tax ID: {company.taxId}</p>
                <p className="text-[11px] text-slate-600">Tel: {company.phone}</p>
                <div className="mt-2 py-1 bg-slate-100 font-bold uppercase text-[11px] tracking-widest border-y border-dashed border-slate-300">
                  {doc.type === 'invoice' ? '*** TAX INVOICE ***' : doc.type === 'proforma' ? '*** ESTIMATE / QUOTE ***' : '*** DISPATCH SLIP ***'}
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-600 pb-2 border-b border-dashed border-slate-300">
                <div>
                  <div>Doc: <strong>{doc.documentNumber}</strong></div>
                  <div>Date: {doc.date}</div>
                </div>
                <div className="text-right">
                  <div>Client: <strong>{doc.clientCompany || doc.clientName}</strong></div>
                  <div>Status: <span className="uppercase font-bold">{doc.status}</span></div>
                </div>
              </div>

              <div className="space-y-1.5 pb-3 border-b border-dashed border-slate-400">
                <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-slate-200">
                  <span>ITEM / QTY</span>
                  <span>TOTAL ({doc.currency})</span>
                </div>
                {doc.items.map((item, idx) => (
                  <div key={item.id} className="flex justify-between items-start text-[11px]">
                    <div className="pr-2">
                      <div className="font-semibold">{idx + 1}. {item.description}</div>
                      <div className="text-slate-500 text-[10px]">{item.quantity} {item.unit || 'pcs'} @ {formatCurrency(item.unitPrice, doc.currency, currencies)}</div>
                    </div>
                    <div className="font-bold shrink-0">{formatCurrency(item.total, doc.currency, currencies)}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(doc.subtotal, doc.currency, currencies)}</span>
                </div>
                {doc.discountTotal > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>- {formatCurrency(doc.discountTotal, doc.currency, currencies)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{doc.taxType === 'gst' ? 'GST Total:' : 'Tax Total:'}</span>
                  <span>{formatCurrency(doc.taxAmount, doc.currency, currencies)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-slate-400">
                  <span>NET PAYABLE:</span>
                  <span>{formatCurrency(doc.grandTotal, doc.currency, currencies)}</span>
                </div>
                {balanceDue > 0 && (
                  <div className="flex justify-between text-rose-700 font-bold">
                    <span>BALANCE DUE:</span>
                    <span>{formatCurrency(balanceDue, doc.currency, currencies)}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-2 space-y-1">
                <div>UPI / Digital Payment: {company.bankDetails.upiId}</div>
                <div>Thank you for your business!</div>
                <div className="text-slate-400 pt-1 text-[9px]">*** COMPUTER GENERATED THERMAL RECEIPT ***</div>
              </div>
            </div>
          ) : (
            /* ALL STANDARD SHEET DESIGNS */
            <div className={`max-w-3xl mx-auto bg-white shadow-sm rounded-lg text-slate-800 ${
              design.layoutType === 'classic-corporate' || design.layoutType === 'tender-formal'
                ? 'border-2 border-slate-700 p-6 sm:p-8'
                : `border ${theme.web.cardBorder} p-6 sm:p-10`
            } ${design.layoutType === 'tender-formal' ? 'font-serif' : ''} space-y-6`}>
              
              {/* EXECUTIVE SPLIT: FULL-WIDTH TOP ACCENT BANNER */}
              {design.layoutType === 'executive-split' && (
                <div className={`${theme.web.accentBg} text-white p-6 -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 rounded-t-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
                  <div className="flex items-center gap-4">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={company.name}
                        className="w-14 h-14 object-contain rounded-lg bg-white p-1 shrink-0 shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/20 text-white flex items-center justify-center font-bold text-xl shrink-0 border border-white/30">
                        {company.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h1 className="text-xl font-bold tracking-tight">{company.name}</h1>
                      <p className="text-xs text-white/80">{company.address}, {company.city}</p>
                      <p className="text-xs text-white/80">Tax ID: {company.taxId} • Tel: {company.phone}</p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <div className="inline-block px-3 py-1 bg-white text-slate-900 text-xs font-bold uppercase tracking-wider rounded shadow-xs">
                      {doc.type === 'invoice' ? 'Tax Invoice' : doc.type === 'proforma' ? 'Proforma Invoice' : 'Delivery Challan'}
                    </div>
                    <div className="text-lg font-bold font-mono mt-1 text-white">{doc.documentNumber}</div>
                    <div className="text-xs text-white/80">Date: {doc.date} | Due: {doc.dueDate}</div>
                  </div>
                </div>
              )}

              {/* CLASSIC CORPORATE / TENDER FORMAL: STRUCTURED 2-COLUMN HEADER */}
              {(design.layoutType === 'classic-corporate' || design.layoutType === 'tender-formal') && (
                <div className="border border-slate-700 p-4 bg-slate-50/70">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-3 border-b border-slate-300">
                    <div className="flex items-start gap-3">
                      {company.logoUrl && (
                        <img src={company.logoUrl} alt={company.name} className="w-14 h-14 object-contain p-1 bg-white border border-slate-300 shrink-0" />
                      )}
                      <div>
                        <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{company.name}</h1>
                        <p className="text-xs text-slate-600 mt-0.5">{company.address}, {company.city}, {company.country}</p>
                        <p className="text-xs font-mono font-medium text-slate-700">GSTIN / Corporate Tax ID: {company.taxId}</p>
                        <p className="text-xs text-slate-600">Email: {company.email} | Phone: {company.phone}</p>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0 border-t sm:border-t-0 sm:border-l sm:border-slate-300 pt-3 sm:pt-0 sm:pl-4">
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-800 pb-1">
                        {design.layoutType === 'tender-formal' ? 'GOVERNMENT TENDER INVOICE' : 'ORIGINAL TAX INVOICE'}
                      </div>
                      <div className="mt-1.5 font-mono text-base font-bold text-slate-900">{doc.documentNumber}</div>
                      <div className="text-xs text-slate-600 mt-1">Invoice Date: <strong>{doc.date}</strong></div>
                      <div className="text-xs text-slate-600">Payment Due: <strong>{doc.dueDate}</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODERN MINIMALIST / CREATIVE BOLD / COMPACT / LOGISTICS: STANDARD HEADER */}
              {design.layoutType !== 'executive-split' && design.layoutType !== 'classic-corporate' && design.layoutType !== 'tender-formal' && (
                <div className={`flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 ${
                  design.layoutType === 'creative-bold' ? 'border-l-4 border-indigo-600 pl-4 border-b border-slate-200' : 'border-b border-slate-200'
                }`}>
                  <div className="flex items-start gap-4">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={company.name}
                        className="w-16 h-16 object-contain rounded-lg border border-slate-200 bg-white p-1 shrink-0 shadow-2xs"
                      />
                    ) : (
                      <div className={`w-14 h-14 rounded-lg ${theme.web.accentBg} text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs`}>
                        {company.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h1 className={`${design.layoutType === 'creative-bold' ? 'text-2xl font-black text-slate-900' : 'text-xl font-bold text-slate-900'} tracking-tight`}>
                        {company.name}
                      </h1>
                      <p className="text-xs text-slate-600 mt-1">{company.address}, {company.city}, {company.country}</p>
                      <p className="text-xs text-slate-500">
                        Tax ID/GSTIN: <span className="font-mono font-medium text-slate-700">{company.taxId}</span> • Tel: {company.phone}
                      </p>
                      <p className="text-xs text-slate-500">Email: {company.email} • {company.website}</p>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <div className={`inline-block px-3 py-1 ${theme.web.badgeBg} ${theme.web.badgeText} text-xs font-bold uppercase tracking-wider rounded shadow-2xs`}>
                      {doc.type === 'invoice' ? 'Tax Invoice' : doc.type === 'proforma' ? 'Proforma Invoice' : 'Delivery Challan'}
                    </div>
                    <div className={`${design.layoutType === 'creative-bold' ? 'text-2xl font-black text-indigo-700 font-mono mt-1' : 'text-lg font-bold font-mono text-slate-900 mt-2'}`}>
                      {doc.documentNumber}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Date: <span className="font-medium text-slate-700">{doc.date}</span></div>
                    <div className="text-xs text-slate-500">Due: <span className="font-medium text-slate-700">{doc.dueDate}</span></div>
                  </div>
                </div>
              )}

              {/* LOGISTICS DISPATCH BANNER (Challan or Logistics Design) */}
              {(doc.type === 'challan' || design.layoutType === 'logistics-dispatch') && (
                <div className="p-4 bg-teal-50/80 border border-teal-300 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-teal-200 pb-2">
                    <div className="flex items-center gap-2 font-bold text-teal-900">
                      <Truck className="w-4 h-4 text-teal-700" />
                      <span className="tracking-wide uppercase">Freight Dispatch & Transporter Manifest</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      doc.challanDetails?.returnable ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {doc.challanDetails?.returnable ? 'RETURNABLE CONSIGNMENT' : 'NON-RETURNABLE SUPPLY'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                    <div>
                      <span className="text-[10px] text-teal-700 block font-semibold">Vehicle Number</span>
                      <span className="font-mono font-bold text-slate-900">{doc.challanDetails?.vehicleNo || 'Not Assigned'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-teal-700 block font-semibold">Dispatch Mode</span>
                      <span className="font-medium">{doc.challanDetails?.dispatchThrough || 'Road Transport / Hand'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-teal-700 block font-semibold">Dispatch Date</span>
                      <span className="font-medium">{doc.challanDetails?.dispatchDate || doc.date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-teal-700 block font-semibold">Gate Pass Ref</span>
                      <span className="font-mono font-medium">GP-{doc.documentNumber.replace(/\D/g, '').slice(-4) || '1029'}</span>
                    </div>
                  </div>

                  {doc.challanDetails?.deliveryNote && (
                    <div className="text-slate-600 pt-1 border-t border-teal-200/60">
                      <strong>Delivery Instructions:</strong> {doc.challanDetails.deliveryNote}
                    </div>
                  )}
                </div>
              )}

              {/* DISPATCHED FROM LOCATION BANNER (If custom origin location specified) */}
              {doc.dispatchAddress?.enabled && doc.dispatchAddress.address && (
                <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-slate-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                        Dispatched From (Origin / Warehouse)
                      </span>
                      <span className="font-medium text-slate-900">
                        {doc.dispatchAddress.name ? `${doc.dispatchAddress.name} — ` : ''}
                        {doc.dispatchAddress.address}
                        {doc.dispatchAddress.city ? `, ${doc.dispatchAddress.city}` : ''}
                        {doc.dispatchAddress.state ? `, ${doc.dispatchAddress.state}` : ''}
                        {doc.dispatchAddress.pincode ? ` - ${doc.dispatchAddress.pincode}` : ''}
                      </span>
                    </div>
                  </div>
                  {doc.dispatchAddress.taxId && (
                    <div className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                      Dispatch GSTIN: {doc.dispatchAddress.taxId}
                    </div>
                  )}
                </div>
              )}

              {/* CLIENT / BILLING & SHIPPING DETAILS PANEL */}
              <div className={`grid grid-cols-1 ${doc.shippingAddress?.enabled ? 'md:grid-cols-3' : 'sm:grid-cols-2'} gap-6 p-4 rounded-lg text-xs ${
                design.layoutType === 'classic-corporate' || design.layoutType === 'tender-formal'
                  ? 'border border-slate-400 bg-white'
                  : 'border border-slate-200 bg-slate-50'
              }`}>
                <div>
                  <span className="font-bold uppercase tracking-wider text-slate-500 text-[11px] block mb-1">
                    Bill To (Buyer)
                  </span>
                  <div className="font-bold text-sm text-slate-900">{doc.clientCompany || doc.clientName}</div>
                  {doc.clientCompany && <div className="text-slate-600 mt-0.5">Attn: {doc.clientName}</div>}
                  <div className="text-slate-600">{doc.clientAddress}</div>
                  <div className="text-slate-500 mt-1">Email: {doc.clientEmail}</div>
                  <div className="text-slate-500">Phone: {doc.clientPhone}</div>
                  {doc.clientTaxId && (
                    <div className="text-slate-700 font-mono mt-1">GSTIN: {doc.clientTaxId}</div>
                  )}
                </div>

                {doc.shippingAddress?.enabled && (
                  <div className="border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4">
                    <span className="font-bold uppercase tracking-wider text-indigo-600 text-[11px] block mb-1 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      Ship To (Consignee)
                    </span>
                    <div className="font-bold text-sm text-slate-900">
                      {doc.shippingAddress.company || doc.shippingAddress.name || doc.clientCompany || doc.clientName}
                    </div>
                    {doc.shippingAddress.name && doc.shippingAddress.company && (
                      <div className="text-slate-600 mt-0.5">Attn: {doc.shippingAddress.name}</div>
                    )}
                    <div className="text-slate-600">{doc.shippingAddress.address}</div>
                    <div className="text-slate-600">
                      {[doc.shippingAddress.city, doc.shippingAddress.state, doc.shippingAddress.pincode]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                    {doc.shippingAddress.phone && (
                      <div className="text-slate-500 mt-1">Phone: {doc.shippingAddress.phone}</div>
                    )}
                    {doc.shippingAddress.taxId && (
                      <div className="text-slate-700 font-mono mt-1">GSTIN: {doc.shippingAddress.taxId}</div>
                    )}
                  </div>
                )}

                <div className={`space-y-1 ${doc.shippingAddress?.enabled ? 'border-t md:border-t-0 md:border-l border-slate-200 md:pl-4 md:text-right' : 'sm:text-right sm:border-l sm:border-slate-200 sm:pl-6'}`}>
                  <span className="font-bold uppercase tracking-wider text-slate-500 text-[11px] block mb-1">
                    Transaction Details
                  </span>
                  <div>
                    <span className="text-slate-500">Customer Tax ID:</span>{' '}
                    <span className="font-mono font-medium text-slate-800">{doc.clientTaxId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Currency:</span>{' '}
                    <span className="font-medium text-slate-800">{doc.currency}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Status: </span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${
                      doc.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                      doc.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                      doc.status === 'partial' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {doc.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Created By:</span>{' '}
                    <span className="text-slate-700">{doc.createdBy}</span>
                  </div>
                </div>
              </div>

              {/* LINE ITEMS TABLE */}
              <div className={`overflow-x-auto rounded-lg ${
                design.layoutType === 'classic-corporate' || design.layoutType === 'tender-formal'
                  ? 'border border-slate-700'
                  : `border ${theme.web.cardBorder}`
              }`}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`${theme.web.tableHeaderBg} ${theme.web.tableHeaderText}`}>
                      <th className={`py-2.5 px-3 font-semibold w-8 ${design.layoutType === 'classic-corporate' ? 'border-r border-slate-400' : ''}`}>#</th>
                      <th className={`py-2.5 px-3 font-semibold ${design.layoutType === 'classic-corporate' ? 'border-r border-slate-400' : ''}`}>Item & Description</th>
                      <th className={`py-2.5 px-3 font-semibold ${design.layoutType === 'classic-corporate' ? 'border-r border-slate-400' : ''}`}>HSN/SAC</th>
                      <th className={`py-2.5 px-3 font-semibold text-right ${design.layoutType === 'classic-corporate' ? 'border-r border-slate-400' : ''}`}>Qty</th>
                      <th className={`py-2.5 px-3 font-semibold text-right ${design.layoutType === 'classic-corporate' ? 'border-r border-slate-400' : ''}`}>Unit Price</th>
                      <th className={`py-2.5 px-3 font-semibold text-right ${design.layoutType === 'classic-corporate' ? 'border-r border-slate-400' : ''}`}>Tax</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-slate-800 ${design.layoutType === 'classic-corporate' ? 'divide-slate-300' : 'divide-slate-100'}`}>
                    {doc.items.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                        <td className={`py-3 px-3 text-slate-400 font-mono ${design.layoutType === 'classic-corporate' ? 'border-r border-slate-300' : ''}`}>{idx + 1}</td>
                        <td className={`py-3 px-3 font-medium text-slate-900 ${design.layoutType === 'classic-corporate' ? 'border-r border-slate-300' : ''}`}>{item.description}</td>
                        <td className={`py-3 px-3 font-mono text-slate-500 ${design.layoutType === 'classic-corporate' ? 'border-r border-slate-300' : ''}`}>{item.hsnCode || '-'}</td>
                        <td className={`py-3 px-3 text-right ${design.layoutType === 'classic-corporate' ? 'border-r border-slate-300' : ''}`}>{item.quantity} {item.unit || 'pcs'}</td>
                        <td className={`py-3 px-3 text-right ${design.layoutType === 'classic-corporate' ? 'border-r border-slate-300' : ''}`}>{formatCurrency(item.unitPrice, doc.currency, currencies)}</td>
                        <td className={`py-3 px-3 text-right ${design.layoutType === 'classic-corporate' ? 'border-r border-slate-300' : ''}`}>{item.taxRate}%</td>
                        <td className="py-3 px-3 text-right font-semibold">{formatCurrency(item.total, doc.currency, currencies)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* COMPACT-GRID DESIGN: SPECIALIZED GST TAX BREAKDOWN MATRIX */}
              {design.layoutType === 'compact-grid' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Tax Breakdown Matrix (GST HSN Summary)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border border-slate-200">
                      <thead className="bg-slate-200/70 font-semibold text-slate-700">
                        <tr>
                          <th className="p-1.5">Tax Type</th>
                          <th className="p-1.5 text-right">Taxable Value</th>
                          <th className="p-1.5 text-right">CGST</th>
                          <th className="p-1.5 text-right">SGST</th>
                          <th className="p-1.5 text-right">Total Tax</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        <tr>
                          <td className="p-1.5">GST @ {doc.taxRate || 18}%</td>
                          <td className="p-1.5 text-right font-mono">{formatCurrency(doc.subtotal - doc.discountTotal, doc.currency, currencies)}</td>
                          <td className="p-1.5 text-right font-mono">{formatCurrency(doc.cgstAmount || doc.taxAmount / 2, doc.currency, currencies)}</td>
                          <td className="p-1.5 text-right font-mono">{formatCurrency(doc.sgstAmount || doc.taxAmount / 2, doc.currency, currencies)}</td>
                          <td className="p-1.5 text-right font-bold text-slate-900">{formatCurrency(doc.taxAmount, doc.currency, currencies)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* BANKING & TOTALS SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Bank & Payment Instructions */}
                <div className={`p-4 rounded-lg text-xs space-y-1.5 ${
                  design.layoutType === 'classic-corporate' ? 'border border-slate-400 bg-white' : 'bg-slate-50 border border-slate-200'
                }`}>
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                    Payment Remittance Details
                  </span>
                  <p className="text-slate-600"><strong>Bank Name:</strong> {company.bankDetails.bankName}</p>
                  <p className="text-slate-600"><strong>Account Name:</strong> {company.bankDetails.accountName}</p>
                  <p className="text-slate-600"><strong>Account Number:</strong> {company.bankDetails.accountNumber}</p>
                  <p className="text-slate-600"><strong>IFSC / SWIFT:</strong> {company.bankDetails.ifscSwift}</p>
                  <p className="text-slate-600"><strong>UPI Handle:</strong> {company.bankDetails.upiId}</p>
                </div>

                {/* Total Calculation Card */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-900">{formatCurrency(doc.subtotal, doc.currency, currencies)}</span>
                  </div>
                  {doc.discountTotal > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                      <span>Discount</span>
                      <span className="font-medium text-rose-600">- {formatCurrency(doc.discountTotal, doc.currency, currencies)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                    <span>
                      {doc.taxType === 'gst' ? 'GST Tax Total' : doc.taxType === 'vat' ? 'VAT Tax Total' : 'Sales Tax'}
                    </span>
                    <span className="font-medium text-slate-900">{formatCurrency(doc.taxAmount, doc.currency, currencies)}</span>
                  </div>
                  {doc.shippingCharges > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                      <span>Shipping & Freight</span>
                      <span className="font-medium text-slate-900">{formatCurrency(doc.shippingCharges, doc.currency, currencies)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between py-2.5 px-3 ${theme.web.accentBg} text-white rounded-lg font-bold text-sm shadow-2xs`}>
                    <span>Grand Total</span>
                    <span>{formatCurrency(doc.grandTotal, doc.currency, currencies)}</span>
                  </div>

                  {doc.paidAmount > 0 && (
                    <div className="flex justify-between py-1 text-xs text-slate-600 font-medium pt-1">
                      <span>Amount Paid:</span>
                      <span className="text-emerald-700 font-semibold">{formatCurrency(doc.paidAmount, doc.currency, currencies)}</span>
                    </div>
                  )}
                  {balanceDue > 0 && (
                    <div className="flex justify-between py-1 text-xs font-bold text-slate-900">
                      <span>Outstanding Balance:</span>
                      <span className="text-rose-700">{formatCurrency(balanceDue, doc.currency, currencies)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment History Table */}
              {doc.payments && doc.payments.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Recorded Payments</h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="p-2">Date</th>
                          <th className="p-2">Method</th>
                          <th className="p-2">Reference</th>
                          <th className="p-2">Recorded By</th>
                          <th className="p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {doc.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="p-2 text-slate-600">{p.date}</td>
                            <td className="p-2 uppercase font-medium">{p.method.replace('_', ' ')}</td>
                            <td className="p-2 font-mono text-slate-500">{p.reference}</td>
                            <td className="p-2 text-slate-600">{p.recordedBy}</td>
                            <td className="p-2 text-right font-semibold text-emerald-700">
                              {formatCurrency(p.amount, doc.currency, currencies)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Terms & Authorized Signature */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block mb-1">
                    Terms & Conditions
                  </span>
                  <p className="text-slate-600 whitespace-pre-line text-[11px] leading-relaxed">
                    {doc.terms || company.terms}
                  </p>
                </div>
                <div className="sm:text-right flex flex-col justify-end items-start sm:items-end pt-4 sm:pt-0">
                  <span className="font-bold text-slate-800 text-xs">For {company.name}</span>
                  <div className="relative flex items-center justify-end my-1 min-h-[60px] w-48">
                    {/* Official Stamp */}
                    {doc.includeStamp !== false && (doc.stampUrl || company.stampUrl) && (
                      <img
                        src={doc.stampUrl || company.stampUrl}
                        alt="Company Stamp"
                        className="w-16 h-16 object-contain opacity-85 -mr-4 pointer-events-none z-0"
                      />
                    )}
                    {/* Authorized Signature */}
                    {doc.includeSignature !== false && (doc.signatureUrl || company.signatureUrl) ? (
                      <img
                        src={doc.signatureUrl || company.signatureUrl}
                        alt="Authorized Signature"
                        className="h-12 max-w-[140px] object-contain relative z-10"
                      />
                    ) : (
                      <div className="w-36 border-b border-slate-300 border-dashed h-8"></div>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-800">
                    {doc.authorizedSignatoryName || company.authorizedSignatoryName || 'Authorized Signatory'}
                  </div>
                  {(doc.authorizedSignatoryDesignation || company.authorizedSignatoryDesignation) && (
                    <div className="text-[10px] text-slate-500">
                      {doc.authorizedSignatoryDesignation || company.authorizedSignatoryDesignation}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
