import React, { useState } from 'react';
import { CompanyProfile, CurrencyConfig, Document, StaffUser } from '../types';
import { formatCurrency, downloadDocumentPdf, generateDocumentPdfBlob } from '../services/pdfGenerator';
import { uploadPdfToDrive } from '../services/googleDrive';
import { getThemeForDocument, INVOICE_THEMES, PROFORMA_THEMES, CHALLAN_THEMES } from '../services/themeEngine';
import { 
  X, Download, CloudUpload, ExternalLink, Send, CreditCard, 
  FileCheck, Truck, Printer, CheckCircle2, AlertCircle, RefreshCw, Palette, Building2 
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

  // Available themes for this document type
  const availableThemes =
    doc.type === 'invoice'
      ? INVOICE_THEMES
      : doc.type === 'proforma'
      ? PROFORMA_THEMES
      : CHALLAN_THEMES;

  const defaultTheme =
    doc.theme ||
    (doc.type === 'invoice'
      ? company.invoiceTheme
      : doc.type === 'proforma'
      ? company.proformaTheme
      : company.challanTheme);

  const theme = getThemeForDocument(doc.type, defaultTheme);

  const handleThemeChange = (newThemeId: string) => {
    const updated = { ...doc, theme: newThemeId };
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
            {/* Live Theme Switcher */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded-lg text-xs border border-slate-700">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] text-slate-300 font-medium">Theme:</span>
              <select
                value={theme.id}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
              >
                {availableThemes.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.name}
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
          <div className={`max-w-3xl mx-auto bg-white p-6 sm:p-10 shadow-sm border ${theme.web.cardBorder} rounded-lg text-slate-800 space-y-6`}>
            
            {/* Sheet Header with Company Logo */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
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
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{company.name}</h1>
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
                <div className="mt-2 text-lg font-bold font-mono text-slate-900">{doc.documentNumber}</div>
                <div className="text-xs text-slate-500 mt-1">Date: <span className="font-medium text-slate-700">{doc.date}</span></div>
                <div className="text-xs text-slate-500">Due: <span className="font-medium text-slate-700">{doc.dueDate}</span></div>
              </div>
            </div>

            {/* Delivery Challan Logistics Banner */}
            {doc.type === 'challan' && doc.challanDetails && (
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-teal-900 mb-1">
                  <Truck className="w-4 h-4 text-teal-700" />
                  <span>DISPATCH & LOGISTICS DETAILS</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700">
                  <div><strong>Vehicle No:</strong> {doc.challanDetails.vehicleNo || 'N/A'}</div>
                  <div><strong>Dispatch Mode:</strong> {doc.challanDetails.dispatchThrough || 'Hand / Direct'}</div>
                  <div>
                    <strong>Challan Nature:</strong>{' '}
                    <span className={`font-semibold ${doc.challanDetails.returnable ? 'text-blue-700' : 'text-slate-800'}`}>
                      {doc.challanDetails.returnable ? 'Returnable (Demo/Trial)' : 'Non-Returnable (Supply)'}
                    </span>
                  </div>
                </div>
                {doc.challanDetails.deliveryNote && (
                  <div className="text-slate-600 pt-1">
                    <strong>Delivery Note:</strong> {doc.challanDetails.deliveryNote}
                  </div>
                )}
              </div>
            )}

            {/* Addresses & Client Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="font-bold uppercase tracking-wider text-slate-500 text-[11px] block mb-1">Bill To / Consignee</span>
                <div className="font-bold text-sm text-slate-900">{doc.clientCompany || doc.clientName}</div>
                <div className="text-slate-600 mt-0.5">Attn: {doc.clientName}</div>
                <div className="text-slate-600">{doc.clientAddress}</div>
                <div className="text-slate-500 mt-1">Email: {doc.clientEmail}</div>
                <div className="text-slate-500">Phone: {doc.clientPhone}</div>
              </div>

              <div className="sm:text-right sm:border-l sm:border-slate-200 sm:pl-6 space-y-1">
                <span className="font-bold uppercase tracking-wider text-slate-500 text-[11px] block mb-1">Billing Details</span>
                <div><span className="text-slate-500">Client Tax ID / GSTIN:</span> <span className="font-mono font-medium text-slate-800">{doc.clientTaxId || 'N/A'}</span></div>
                <div><span className="text-slate-500">Currency:</span> <span className="font-medium text-slate-800">{doc.currency}</span></div>
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
                <div><span className="text-slate-500">Created By:</span> <span className="text-slate-700">{doc.createdBy}</span></div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className={`overflow-x-auto border ${theme.web.cardBorder} rounded-lg`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`${theme.web.tableHeaderBg} ${theme.web.tableHeaderText}`}>
                    <th className="py-2.5 px-3 font-semibold w-8">#</th>
                    <th className="py-2.5 px-3 font-semibold">Item & Description</th>
                    <th className="py-2.5 px-3 font-semibold">HSN/SAC</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Qty</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Unit Price</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Tax</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {doc.items.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                      <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{item.description}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{item.hsnCode || '-'}</td>
                      <td className="py-3 px-3 text-right">{item.quantity} {item.unit || 'pcs'}</td>
                      <td className="py-3 px-3 text-right">{formatCurrency(item.unitPrice, doc.currency, currencies)}</td>
                      <td className="py-3 px-3 text-right">{item.taxRate}%</td>
                      <td className="py-3 px-3 text-right font-semibold">{formatCurrency(item.total, doc.currency, currencies)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculation & Banking Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Bank & Payment Instructions */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                  Payment Instructions
                </span>
                <p className="text-slate-600"><strong>Bank Name:</strong> {company.bankDetails.bankName}</p>
                <p className="text-slate-600"><strong>Account Name:</strong> {company.bankDetails.accountName}</p>
                <p className="text-slate-600"><strong>Account Number:</strong> {company.bankDetails.accountNumber}</p>
                <p className="text-slate-600"><strong>IFSC / SWIFT:</strong> {company.bankDetails.ifscSwift}</p>
                <p className="text-slate-600"><strong>UPI ID:</strong> {company.bankDetails.upiId}</p>
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
                    <span>Shipping & Handling</span>
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
                    <span className="text-emerald-700">{formatCurrency(doc.paidAmount, doc.currency, currencies)}</span>
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
                <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block mb-1">Terms & Conditions</span>
                <p className="text-slate-600 whitespace-pre-line text-[11px] leading-relaxed">
                  {doc.terms || company.terms}
                </p>
              </div>
              <div className="sm:text-right flex flex-col justify-end items-start sm:items-end pt-4 sm:pt-0">
                <span className="font-bold text-slate-800 text-xs">For {company.name}</span>
                <div className="w-36 h-12 border-b border-slate-300 mt-2"></div>
                <span className="text-[11px] text-slate-500 mt-1">Authorized Signatory</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
