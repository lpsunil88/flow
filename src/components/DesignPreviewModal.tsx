import React, { useState } from 'react';
import { CompanyProfile, Document, DocumentType, LineItem } from '../types';
import { DocumentDesign, DOCUMENT_DESIGNS } from '../services/themeEngine';
import { 
  X, Check, LayoutTemplate, FileText, Truck, Receipt, 
  Sparkles, CheckCircle2, ShieldCheck, Printer, ArrowRight 
} from 'lucide-react';

const formatCurrency = (amount: number, code: string = 'INR') => {
  const sym = code === 'INR' ? '₹' : code === 'USD' ? '$' : code === 'EUR' ? '€' : `${code} `;
  return `${sym} ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface DesignPreviewModalProps {
  design: DocumentDesign;
  company: CompanyProfile;
  initialDocType?: DocumentType;
  onClose: () => void;
  onSelectDesign?: (design: DocumentDesign) => void;
  onSetAsDefault?: (type: DocumentType, designId: string) => void;
  isDefaultInvoice?: boolean;
  isDefaultProforma?: boolean;
  isDefaultChallan?: boolean;
}

export const DesignPreviewModal: React.FC<DesignPreviewModalProps> = ({
  design: initialDesign,
  company,
  initialDocType = 'invoice',
  onClose,
  onSelectDesign,
  onSetAsDefault,
  isDefaultInvoice = false,
  isDefaultProforma = false,
  isDefaultChallan = false,
}) => {
  const [selectedDesign, setSelectedDesign] = useState<DocumentDesign>(initialDesign);
  const [docType, setDocType] = useState<DocumentType>(initialDocType);

  // Sample items for realistic layout demonstration
  const sampleItems: LineItem[] = [
    {
      id: 'item-1',
      description: 'Enterprise Cloud ERP Suite & API Integration (Annual License)',
      quantity: 1,
      unit: 'License',
      unitPrice: 125000,
      discount: 5000,
      taxRate: 18,
      amount: 120000,
      taxAmount: 21600,
      total: 141600,
      hsnCode: '998314',
    },
    {
      id: 'item-2',
      description: 'Custom High-Performance API Gateway & Security Hardening Module',
      quantity: 2,
      unit: 'Units',
      unitPrice: 35000,
      discount: 0,
      taxRate: 18,
      amount: 70000,
      taxAmount: 12600,
      total: 82600,
      hsnCode: '998313',
    },
    {
      id: 'item-3',
      description: '24/7 Dedicated Priority Technical Support & Maintenance SLA',
      quantity: 12,
      unit: 'Months',
      unitPrice: 7500,
      discount: 0,
      taxRate: 18,
      amount: 90000,
      taxAmount: 16200,
      total: 106200,
      hsnCode: '998717',
    },
  ];

  const subtotal = sampleItems.reduce((sum, it) => sum + it.amount, 0);
  const taxAmount = sampleItems.reduce((sum, it) => sum + it.taxAmount, 0);
  const shippingCharges = 1500;
  const grandTotal = subtotal + taxAmount + shippingCharges;

  const sampleDoc: Document = {
    id: 'sample-doc-preview',
    type: docType,
    documentNumber: docType === 'invoice' ? `${company.invoicePrefix}2026-088` : docType === 'proforma' ? `${company.proformaPrefix}2026-042` : `${company.challanPrefix}2026-019`,
    date: '2026-03-15',
    dueDate: '2026-03-30',
    clientId: 'client-sample',
    clientName: 'Sunil Kumar',
    clientCompany: 'Apex Industrial Solutions Pvt Ltd',
    clientEmail: 'sunil@apexindustries.in',
    clientPhone: '+91 98765 43210',
    clientAddress: 'Plot 48-B, Industrial Technology Park, Phase 2, Whitefield',
    clientTaxId: '29AAACA1234F1Z8',
    items: sampleItems,
    subtotal,
    discountTotal: 5000,
    taxType: 'gst',
    taxRate: 18,
    cgstAmount: taxAmount / 2,
    sgstAmount: taxAmount / 2,
    taxAmount,
    shippingCharges,
    grandTotal,
    currency: company.defaultCurrency || 'INR',
    status: 'unpaid',
    paidAmount: 0,
    payments: [],
    remindersSent: [],
    notes: 'Thank you for partnering with us. Please reference invoice number during wire transfer.',
    terms: company.terms || 'Payment due within 15 days of invoice date. 18% p.a. interest chargeable on overdue remittances.',
    challanDetails: {
      vehicleNo: 'KA-01-MJ-4920',
      dispatchThrough: 'SafeExpress Secure Logistics',
      dispatchDate: '2026-03-15',
      returnable: false,
      deliveryNote: 'Urgent technical consignment for data center commissioning',
      receivedBy: '',
    },
    createdAt: new Date().toISOString(),
    createdBy: 'Administrator',
    designId: selectedDesign.id,
    theme: selectedDesign.theme.id,
  };

  const primaryRgb = selectedDesign.theme.primaryColor.join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {selectedDesign.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {selectedDesign.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Layout Type: <code className="text-slate-300 font-mono">{selectedDesign.layoutType}</code> • {selectedDesign.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Switch to other designs */}
            <select
              value={selectedDesign.id}
              onChange={(e) => {
                const found = DOCUMENT_DESIGNS.find(d => d.id === e.target.value);
                if (found) setSelectedDesign(found);
              }}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DOCUMENT_DESIGNS.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.badge})
                </option>
              ))}
            </select>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subheader: Document Type Switcher & Default Assign Actions */}
        <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Doc Type Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setDocType('invoice')}
              className={`px-3 py-1 rounded font-semibold transition ${
                docType === 'invoice' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tax Invoice
            </button>
            <button
              onClick={() => setDocType('proforma')}
              className={`px-3 py-1 rounded font-semibold transition ${
                docType === 'proforma' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Proforma Quote
            </button>
            <button
              onClick={() => setDocType('challan')}
              className={`px-3 py-1 rounded font-semibold transition ${
                docType === 'challan' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Delivery Challan
            </button>
          </div>

          {/* Set as default action buttons */}
          {onSetAsDefault && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 hidden sm:inline">Set as Company Default:</span>
              <button
                onClick={() => onSetAsDefault('invoice', selectedDesign.id)}
                className={`px-2.5 py-1 rounded font-semibold transition flex items-center gap-1 border ${
                  isDefaultInvoice && selectedDesign.id === initialDesign.id
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <Check className="w-3 h-3" />
                <span>Invoice</span>
              </button>
              <button
                onClick={() => onSetAsDefault('proforma', selectedDesign.id)}
                className={`px-2.5 py-1 rounded font-semibold transition flex items-center gap-1 border ${
                  isDefaultProforma && selectedDesign.id === initialDesign.id
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <Check className="w-3 h-3" />
                <span>Proforma</span>
              </button>
              <button
                onClick={() => onSetAsDefault('challan', selectedDesign.id)}
                className={`px-2.5 py-1 rounded font-semibold transition flex items-center gap-1 border ${
                  isDefaultChallan && selectedDesign.id === initialDesign.id
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <Check className="w-3 h-3" />
                <span>Challan</span>
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Preview Canvas */}
        <div className="p-4 sm:p-8 overflow-y-auto max-h-[72vh] bg-slate-950 font-sans flex justify-center">
          
          {/* THERMAL POS RETAIL SLIP */}
          {selectedDesign.layoutType === 'thermal-slip' ? (
            <div className="w-full max-w-sm bg-white p-6 shadow-2xl border-2 border-dashed border-slate-400 font-mono text-xs text-slate-800 space-y-4 rounded-sm">
              <div className="text-center pb-3 border-b border-dashed border-slate-400">
                <h1 className="text-base font-bold uppercase tracking-wider">{company.name}</h1>
                <p className="text-[11px] text-slate-600 mt-0.5">{company.address}, {company.city}</p>
                <p className="text-[11px] text-slate-600">GSTIN: {company.taxId}</p>
                <p className="text-[11px] text-slate-600">Tel: {company.phone}</p>
                <div className="mt-2 py-1 bg-slate-100 font-bold uppercase text-[11px] tracking-widest border-y border-dashed border-slate-300">
                  {docType === 'invoice' ? '*** TAX INVOICE ***' : docType === 'proforma' ? '*** ESTIMATE / QUOTE ***' : '*** DISPATCH SLIP ***'}
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-600 pb-2 border-b border-dashed border-slate-300">
                <div>
                  <div>Doc: <strong>{sampleDoc.documentNumber}</strong></div>
                  <div>Date: {sampleDoc.date}</div>
                </div>
                <div className="text-right">
                  <div>Cust: {sampleDoc.clientName}</div>
                  <div>Tax ID: {sampleDoc.clientTaxId}</div>
                </div>
              </div>

              <div className="space-y-2 pb-3 border-b border-dashed border-slate-400">
                <div className="flex justify-between font-bold text-[11px] uppercase border-b border-dashed border-slate-300 pb-1">
                  <span>Item / Qty</span>
                  <span>Total</span>
                </div>
                {sampleDoc.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-semibold text-[11px]">{item.description}</div>
                    <div className="flex justify-between text-slate-600 text-[10px]">
                      <span>{item.quantity} x {formatCurrency(item.unitPrice, sampleDoc.currency)} (HSN {item.hsnCode})</span>
                      <span className="font-bold text-slate-900">{formatCurrency(item.total, sampleDoc.currency)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right text-[11px] pb-3 border-b border-dashed border-slate-400">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(sampleDoc.subtotal, sampleDoc.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Total (18%):</span>
                  <span>{formatCurrency(sampleDoc.taxAmount, sampleDoc.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Freight / Delivery:</span>
                  <span>{formatCurrency(sampleDoc.shippingCharges, sampleDoc.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-dashed border-slate-400">
                  <span>GRAND TOTAL:</span>
                  <span>{formatCurrency(sampleDoc.grandTotal, sampleDoc.currency)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-2 space-y-1">
                <p>Thank you for your business!</p>
                <p className="font-mono">{company.bankDetails.upiId ? `UPI: ${company.bankDetails.upiId}` : 'Computer Generated Document'}</p>
                <div className="pt-2 text-[9px] tracking-widest text-slate-400">=========================</div>
              </div>
            </div>
          ) : (
            /* FULL A4 SHEET LAYOUT */
            <div className={`w-full max-w-3xl bg-white shadow-2xl text-slate-800 transition-all ${
              selectedDesign.layoutType === 'classic-corporate'
                ? 'p-8 border-4 border-double border-slate-800 rounded-sm'
                : 'rounded-xl overflow-hidden'
            }`}>
              
              {/* EXECUTIVE SPLIT TOP BANNER */}
              {selectedDesign.layoutType === 'executive-split' && (
                <div className="bg-slate-950 text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt={company.name} className="h-12 w-auto object-contain bg-white rounded-lg p-1" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg text-white">
                        {company.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h1 className="text-xl font-bold tracking-tight">{company.name}</h1>
                      <p className="text-xs text-slate-400">{company.address}, {company.city}</p>
                      <p className="text-xs text-slate-400 font-mono">GSTIN / Tax ID: {company.taxId}</p>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-1">
                      {docType === 'invoice' ? 'Tax Invoice' : docType === 'proforma' ? 'Proforma Invoice' : 'Delivery Challan'}
                    </span>
                    <div className="text-lg font-mono font-bold">{sampleDoc.documentNumber}</div>
                    <div className="text-xs text-slate-400">Date: {sampleDoc.date}</div>
                  </div>
                </div>
              )}

              {/* CREATIVE BOLD TOP ACCENT */}
              {selectedDesign.layoutType === 'creative-bold' && (
                <div
                  className="p-6 sm:p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  style={{ backgroundColor: `rgb(${primaryRgb})` }}
                >
                  <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">{company.name}</h1>
                    <p className="text-xs text-white/80">{company.address}, {company.city}</p>
                    <p className="text-xs text-white/80">GSTIN: {company.taxId}</p>
                  </div>
                  <div className="sm:text-right bg-black/20 p-3 rounded-xl backdrop-blur-xs border border-white/20">
                    <div className="text-xs uppercase font-bold tracking-wider text-white/90">
                      {docType === 'invoice' ? 'OFFICIAL INVOICE' : docType === 'proforma' ? 'PROFORMA ESTIMATE' : 'DISPATCH CHALLAN'}
                    </div>
                    <div className="text-lg font-mono font-black">{sampleDoc.documentNumber}</div>
                    <div className="text-xs text-white/80">Issue Date: {sampleDoc.date}</div>
                  </div>
                </div>
              )}

              {/* STANDARD / CLASSIC / MODERN / GST MATRIX HEADER */}
              {selectedDesign.layoutType !== 'executive-split' && selectedDesign.layoutType !== 'creative-bold' && (
                <div className="p-6 sm:p-8 pb-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex items-start gap-3">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt={company.name} className="h-12 w-auto object-contain" />
                    ) : (
                      <div
                        className="h-12 w-12 rounded-xl text-white flex items-center justify-center font-bold text-lg"
                        style={{ backgroundColor: `rgb(${primaryRgb})` }}
                      >
                        {company.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h1 className="text-lg font-bold text-slate-900">{company.name}</h1>
                      <p className="text-xs text-slate-500">{company.address}, {company.city}</p>
                      <p className="text-xs text-slate-500 font-mono">Tax ID / GSTIN: {company.taxId}</p>
                      <p className="text-xs text-slate-500">Email: {company.email} • Tel: {company.phone}</p>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <h2
                      className="text-xl font-bold uppercase tracking-wide"
                      style={{ color: `rgb(${primaryRgb})` }}
                    >
                      {docType === 'invoice' ? 'Tax Invoice' : docType === 'proforma' ? 'Proforma Invoice' : 'Delivery Challan'}
                    </h2>
                    <div className="text-sm font-mono font-bold text-slate-800 mt-1">{sampleDoc.documentNumber}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Date: {sampleDoc.date}</div>
                    <div className="text-xs text-slate-500">Due: {sampleDoc.dueDate}</div>
                  </div>
                </div>
              )}

              {/* CLIENT BILL TO / SHIP TO METADATA BLOCK */}
              <div className="p-6 sm:p-8 py-4 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 border-b border-slate-200 text-xs">
                <div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-400 mb-1">
                    Bill To / Consignee
                  </h3>
                  <div className="font-bold text-slate-900 text-sm">{sampleDoc.clientCompany}</div>
                  <div className="text-slate-600 font-medium">{sampleDoc.clientName}</div>
                  <div className="text-slate-500 mt-0.5">{sampleDoc.clientAddress}</div>
                  <div className="text-slate-500 font-mono mt-1">GSTIN: {sampleDoc.clientTaxId}</div>
                  <div className="text-slate-500">{sampleDoc.clientEmail} • {sampleDoc.clientPhone}</div>
                </div>

                {/* Logistics details or Payment instructions */}
                {selectedDesign.layoutType === 'logistics-dispatch' || docType === 'challan' ? (
                  <div className="bg-teal-50/50 p-3 rounded-lg border border-teal-200">
                    <h3 className="font-bold text-teal-900 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-teal-600" />
                      <span>Logistics & Freight Details</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <div>Vehicle No: <strong className="font-mono">{sampleDoc.challanDetails?.vehicleNo}</strong></div>
                      <div>Carrier: <strong>{sampleDoc.challanDetails?.dispatchThrough}</strong></div>
                      <div>Dispatch Date: <strong>{sampleDoc.challanDetails?.dispatchDate}</strong></div>
                      <div>Returnable: <strong className="text-amber-700">No (Commercial Sale)</strong></div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-400 mb-1">
                      Bank & Wire Remittance
                    </h3>
                    <div className="font-medium text-slate-700">{company.bankDetails.bankName}</div>
                    <div className="text-slate-600">A/C Name: {company.bankDetails.accountName}</div>
                    <div className="font-mono text-slate-600">A/C No: {company.bankDetails.accountNumber}</div>
                    <div className="font-mono text-slate-600">IFSC / SWIFT: {company.bankDetails.ifscSwift}</div>
                    {company.bankDetails.upiId && (
                      <div className="font-mono text-indigo-600 font-semibold mt-0.5">UPI ID: {company.bankDetails.upiId}</div>
                    )}
                  </div>
                )}
              </div>

              {/* LINE ITEMS TABLE */}
              <div className="p-6 sm:p-8 py-4">
                
                {/* GST TAX MATRIX TABLE LAYOUT */}
                {selectedDesign.layoutType === 'tender-formal' || selectedDesign.layoutType === 'classic-corporate' ? (
                  <table className="w-full text-xs text-left border border-slate-300">
                    <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2 border-r border-slate-300 text-center w-8">#</th>
                        <th className="p-2 border-r border-slate-300">Item Description</th>
                        <th className="p-2 border-r border-slate-300 text-center w-16">HSN/SAC</th>
                        <th className="p-2 border-r border-slate-300 text-center w-12">Qty</th>
                        <th className="p-2 border-r border-slate-300 text-right w-20">Rate</th>
                        <th className="p-2 border-r border-slate-300 text-right w-16">Tax %</th>
                        <th className="p-2 text-right w-24">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {sampleDoc.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-medium text-slate-800">{it.description}</td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-500">{it.hsnCode}</td>
                          <td className="p-2 border-r border-slate-200 text-center font-semibold">{it.quantity}</td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono">{formatCurrency(it.unitPrice, sampleDoc.currency)}</td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono">{it.taxRate}%</td>
                          <td className="p-2 text-right font-bold font-mono text-slate-900">{formatCurrency(it.total, sampleDoc.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : selectedDesign.layoutType === 'compact-grid' ? (
                  /* COMPACT TECHNICAL GRID TABLE */
                  <table className="w-full text-[11px] text-left border-2 border-slate-800">
                    <thead className="bg-slate-900 text-white uppercase text-[9px] font-bold">
                      <tr>
                        <th className="p-1.5 border border-slate-700 text-center w-8">#</th>
                        <th className="p-1.5 border border-slate-700">Part / Item Description</th>
                        <th className="p-1.5 border border-slate-700 text-center w-14">HSN</th>
                        <th className="p-1.5 border border-slate-700 text-center w-10">Qty</th>
                        <th className="p-1.5 border border-slate-700 text-right w-20">Unit Rate</th>
                        <th className="p-1.5 border border-slate-700 text-right w-24">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleDoc.items.map((it, idx) => (
                        <tr key={idx} className="border-b border-slate-300">
                          <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                          <td className="p-1.5 border-r border-slate-300 font-medium">{it.description}</td>
                          <td className="p-1.5 border-r border-slate-300 text-center font-mono">{it.hsnCode}</td>
                          <td className="p-1.5 border-r border-slate-300 text-center font-bold">{it.quantity}</td>
                          <td className="p-1.5 border-r border-slate-300 text-right font-mono">{formatCurrency(it.unitPrice, sampleDoc.currency)}</td>
                          <td className="p-1.5 text-right font-mono font-bold">{formatCurrency(it.total, sampleDoc.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  /* MODERN / MINIMAL / CREATIVE TABLE */
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-2.5">Description</th>
                        <th className="py-2.5 text-center w-12">Qty</th>
                        <th className="py-2.5 text-right w-24">Price</th>
                        <th className="py-2.5 text-right w-24">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sampleDoc.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 pr-2">
                            <div className="font-semibold text-slate-800">{it.description}</div>
                            <div className="text-[10px] text-slate-400 font-mono">HSN: {it.hsnCode} • Tax: {it.taxRate}%</div>
                          </td>
                          <td className="py-3 text-center font-medium text-slate-700">{it.quantity}</td>
                          <td className="py-3 text-right font-mono text-slate-600">{formatCurrency(it.unitPrice, sampleDoc.currency)}</td>
                          <td className="py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(it.total, sampleDoc.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* TOTALS & SIGNATURE FOOTER BLOCK */}
              <div className="p-6 sm:p-8 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                <div className="space-y-3 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Terms & Conditions</h4>
                    <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">{sampleDoc.terms}</p>
                  </div>
                  <div className="pt-4">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">For {company.name}</div>
                    <div className="mt-8 pt-1 border-t border-slate-300 w-44 text-[10px] font-bold text-slate-700 text-center">
                      Authorized Signatory
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono">{formatCurrency(sampleDoc.subtotal, sampleDoc.currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (9%):</span>
                    <span className="font-mono">{formatCurrency(sampleDoc.cgstAmount || 0, sampleDoc.currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (9%):</span>
                    <span className="font-mono">{formatCurrency(sampleDoc.sgstAmount || 0, sampleDoc.currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Freight / Shipping:</span>
                    <span className="font-mono">{formatCurrency(sampleDoc.shippingCharges, sampleDoc.currency)}</span>
                  </div>
                  <div
                    className="flex justify-between font-bold text-base pt-2 border-t border-slate-200"
                    style={{ color: `rgb(${primaryRgb})` }}
                  >
                    <span>Grand Total:</span>
                    <span className="font-mono">{formatCurrency(sampleDoc.grandTotal, sampleDoc.currency)}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>
              All 8 layout templates are fully compliant with PDF vector rendering & printing.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-xs transition"
          >
            Done Previewing
          </button>
        </div>

      </div>
    </div>
  );
};
