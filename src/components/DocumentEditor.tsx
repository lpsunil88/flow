import React, { useState, useEffect } from 'react';
import { Client, CompanyProfile, CurrencyConfig, Document, DocumentType, LineItem, StaffUser, Item, ProductList, InvoiceTemplate } from '../types';
import { formatCurrency } from '../services/pdfGenerator';
import { DOCUMENT_DESIGNS, DocumentDesign, getDesignForDocument } from '../services/themeEngine';
import { 
  Plus, Trash2, ArrowLeft, Save, CloudUpload, FileText, Truck, Receipt, Check, 
  Package, Palette, Search, Sparkles, Loader2, X, Building2, ListFilter, ShieldCheck 
} from 'lucide-react';

interface DocumentEditorProps {
  initialDocument?: Document | null;
  defaultType?: DocumentType;
  clients: Client[];
  company: CompanyProfile;
  currencies: CurrencyConfig[];
  currentUser: StaffUser;
  driveAccessToken: string | null;
  itemsCatalog?: Item[];
  productLists?: ProductList[];
  onAddClient?: (client: Client) => void;
  onSave: (doc: Document, andSyncDrive: boolean) => void;
  onCancel: () => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  initialDocument,
  defaultType = 'invoice',
  clients,
  company,
  currencies,
  currentUser,
  driveAccessToken,
  itemsCatalog = [],
  productLists = [],
  onAddClient,
  onSave,
  onCancel,
}) => {
  const [docType, setDocType] = useState<DocumentType>(initialDocument?.type || defaultType);
  const [docNumber, setDocNumber] = useState(
    initialDocument?.documentNumber ||
      (docType === 'invoice'
        ? `${company.invoicePrefix}${Math.floor(100 + Math.random() * 900)}`
        : docType === 'proforma'
        ? `${company.proformaPrefix}${Math.floor(100 + Math.random() * 900)}`
        : `${company.challanPrefix}${Math.floor(100 + Math.random() * 900)}`)
  );

  const [date, setDate] = useState(initialDocument?.date || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    initialDocument?.dueDate ||
      new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const [selectedClientId, setSelectedClientId] = useState(initialDocument?.clientId || (clients[0]?.id || ''));
  const [currency, setCurrency] = useState(initialDocument?.currency || company.defaultCurrency);
  const [taxType, setTaxType] = useState<'gst' | 'vat' | 'sales_tax' | 'none'>(
    initialDocument?.taxType || company.defaultTaxType
  );
  const [shippingCharges, setShippingCharges] = useState(initialDocument?.shippingCharges || 0);
  const [notes, setNotes] = useState(initialDocument?.notes || 'Thank you for your valued business.');
  const [terms, setTerms] = useState(initialDocument?.terms || company.terms);

  // Visual Template Style Selection ('Modern' | 'Classic' | 'Minimal')
  const initialInvoiceTemplate: InvoiceTemplate =
    initialDocument?.invoiceTemplate ||
    initialDocument?.template ||
    (initialDocument?.designId === 'classic-corporate' || initialDocument?.designId === 'tender-formal'
      ? 'Classic'
      : initialDocument?.designId === 'modern-minimal' || initialDocument?.designId === 'compact-grid'
      ? 'Minimal'
      : company.defaultInvoiceTemplate || 'Modern');

  const [invoiceTemplate] = useState<InvoiceTemplate>(initialInvoiceTemplate);

  // Document Design Selection
  const defaultDesignForType =
    docType === 'invoice'
      ? (initialInvoiceTemplate === 'Classic' ? 'classic-corporate' : initialInvoiceTemplate === 'Minimal' ? 'modern-minimal' : company.defaultInvoiceDesign || company.invoiceTheme || 'executive-split')
      : docType === 'proforma'
      ? company.defaultProformaDesign || company.proformaTheme || 'design-modern-minimal'
      : company.defaultChallanDesign || company.challanTheme || 'design-logistics-dispatch';

  const [designId, setDesignId] = useState<string>(
    initialDocument?.designId || initialDocument?.theme || defaultDesignForType
  );

  // Update designId when docType changes if it wasn't manually customized
  useEffect(() => {
    if (!initialDocument?.designId && !initialDocument?.theme) {
      if (docType === 'invoice') {
        setDesignId(company.defaultInvoiceDesign || company.invoiceTheme || 'design-classic-corporate');
      } else if (docType === 'proforma') {
        setDesignId(company.defaultProformaDesign || company.proformaTheme || 'design-modern-minimal');
      } else {
        setDesignId(company.defaultChallanDesign || company.challanTheme || 'design-logistics-dispatch');
      }
    }
  }, [docType, company]);

  const currentDesign = getDesignForDocument(docType, designId);

  // Challan details state
  const [vehicleNo, setVehicleNo] = useState(initialDocument?.challanDetails?.vehicleNo || '');
  const [dispatchThrough, setDispatchThrough] = useState(initialDocument?.challanDetails?.dispatchThrough || 'Road Transport');
  const [returnable, setReturnable] = useState(initialDocument?.challanDetails?.returnable || false);
  const [deliveryNote, setDeliveryNote] = useState(initialDocument?.challanDetails?.deliveryNote || '');

  // Item Catalog Picker Modal state
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogListId, setSelectedCatalogListId] = useState<string>('all');

  // Line items state
  const [items, setItems] = useState<LineItem[]>(
    initialDocument?.items || [
      {
        id: `item-${Date.now()}`,
        description: 'Professional Consulting / Supply Item',
        hsnCode: '998311',
        quantity: 1,
        unit: 'Unit',
        unitPrice: 1000,
        taxRate: company.defaultTaxRate,
        discount: 0,
        amount: 1000,
        taxAmount: 180,
        total: 1180,
      },
    ]
  );

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  // Recalculate line item total when values change
  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        const baseAmount = Math.max(0, updated.quantity * updated.unitPrice - (updated.discount || 0));
        const itemTax = taxType === 'none' ? 0 : (baseAmount * (updated.taxRate || 0)) / 100;
        return {
          ...updated,
          amount: baseAmount,
          taxAmount: itemTax,
          total: baseAmount + itemTax,
        };
      })
    );
  };

  const addItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: '',
      hsnCode: '',
      quantity: 1,
      unit: 'Pcs',
      unitPrice: 0,
      taxRate: taxType === 'none' ? 0 : company.defaultTaxRate,
      discount: 0,
      amount: 0,
      taxAmount: 0,
      total: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const addItemFromCatalog = (catalogItem: Item) => {
    const baseAmount = catalogItem.unitPrice;
    const itemTax = taxType === 'none' ? 0 : (baseAmount * catalogItem.taxRate) / 100;

    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: catalogItem.name + (catalogItem.description ? ` - ${catalogItem.description}` : ''),
      hsnCode: catalogItem.hsnCode || '',
      quantity: 1,
      unit: catalogItem.unit || 'Unit',
      unitPrice: catalogItem.unitPrice,
      taxRate: taxType === 'none' ? 0 : catalogItem.taxRate,
      discount: 0,
      amount: baseAmount,
      taxAmount: itemTax,
      total: baseAmount + itemTax,
    };
    setItems((prev) => [...prev, newItem]);
    setShowCatalogModal(false);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const discountTotal = items.reduce((acc, item) => acc + (item.discount || 0), 0);
  const taxAmount = items.reduce((acc, item) => acc + item.taxAmount, 0);
  const grandTotal = items.reduce((acc, item) => acc + item.total, 0) + Number(shippingCharges || 0);

  const handleSave = (andSyncDrive: boolean) => {
    if (!selectedClient) {
      alert('Please select or create a client first.');
      return;
    }
    if (items.some((it) => !it.description.trim())) {
      alert('Please provide descriptions for all line items.');
      return;
    }

    const doc: Document = {
      id: initialDocument?.id || `doc-${Date.now()}`,
      companyId: company.id,
      designId: designId,
      theme: currentDesign.theme.id,
      invoiceTemplate: invoiceTemplate,
      template: invoiceTemplate,
      type: docType,
      documentNumber: docNumber.trim(),
      date,
      dueDate,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientCompany: selectedClient.company,
      clientEmail: selectedClient.email,
      clientPhone: selectedClient.phone,
      clientAddress: selectedClient.address,
      clientTaxId: selectedClient.taxId,
      items,
      subtotal,
      discountTotal,
      taxType,
      taxRate: company.defaultTaxRate,
      taxAmount,
      shippingCharges: Number(shippingCharges || 0),
      grandTotal,
      currency,
      status: initialDocument?.status || 'unpaid',
      paidAmount: initialDocument?.paidAmount || 0,
      payments: initialDocument?.payments || [],
      notes,
      terms,
      challanDetails:
        docType === 'challan'
          ? {
              vehicleNo,
              dispatchThrough,
              dispatchDate: date,
              returnable,
              deliveryNote,
            }
          : undefined,
      remindersSent: initialDocument?.remindersSent || [],
      createdAt: initialDocument?.createdAt || new Date().toISOString(),
      createdBy: initialDocument?.createdBy || currentUser.name,
      driveFileId: initialDocument?.driveFileId,
      driveViewLink: initialDocument?.driveViewLink,
    };

    onSave(doc, andSyncDrive);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Editor Header */}
      <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold">
              {initialDocument ? 'Edit Document' : 'Create New Document'}
            </h2>
            <p className="text-xs text-slate-400">
              Configure billing lines, tax configuration, delivery challan details, and client details
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Document</span>
          </button>
          {driveAccessToken && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              title="Save locally and automatically upload PDF to Google Drive"
            >
              <CloudUpload className="w-4 h-4" />
              <span className="hidden sm:inline">Save & Sync to Drive</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Document Type Selector Tabs */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Document Nature
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setDocType('invoice');
                if (!initialDocument) setDocNumber(`${company.invoicePrefix}${Math.floor(100 + Math.random() * 900)}`);
              }}
              className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-all ${
                docType === 'invoice'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 text-slate-900'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Receipt className={`w-5 h-5 mt-0.5 ${docType === 'invoice' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <div className="font-bold text-xs">Standard Tax Invoice</div>
                <div className="text-[11px] text-slate-500">Official commercial invoice with tax breakdown & receivables tracking</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setDocType('proforma');
                if (!initialDocument) setDocNumber(`${company.proformaPrefix}${Math.floor(100 + Math.random() * 900)}`);
              }}
              className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-all ${
                docType === 'proforma'
                  ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20 text-slate-900'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <FileText className={`w-5 h-5 mt-0.5 ${docType === 'proforma' ? 'text-amber-600' : 'text-slate-400'}`} />
              <div>
                <div className="font-bold text-xs">Proforma Invoice</div>
                <div className="text-[11px] text-slate-500">Preliminary quote/estimate convertible to final tax invoice upon advance</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setDocType('challan');
                if (!initialDocument) setDocNumber(`${company.challanPrefix}${Math.floor(100 + Math.random() * 900)}`);
              }}
              className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-all ${
                docType === 'challan'
                  ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20 text-slate-900'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Truck className={`w-5 h-5 mt-0.5 ${docType === 'challan' ? 'text-teal-600' : 'text-slate-400'}`} />
              <div>
                <div className="font-bold text-xs">Delivery Challan</div>
                <div className="text-[11px] text-slate-500">Goods dispatch slip with vehicle, courier, and returnable terms</div>
              </div>
            </button>
          </div>
        </div>

        {/* Core Metadata Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document #</label>
            <input
              type="text"
              required
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Client / Customer</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company ? `${c.company} (${c.name})` : c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Issue Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {docType === 'challan' ? 'Expected Return/Delivery' : 'Payment Due Date'}
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Multi-Currency & Tax Engine Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Billing Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} ({curr.symbol}) - {curr.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tax Regime</label>
            <select
              value={taxType}
              onChange={(e) => setTaxType(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            >
              <option value="gst">GST (Goods & Services Tax with HSN)</option>
              <option value="vat">VAT (Value Added Tax)</option>
              <option value="sales_tax">Sales Tax / General Tax</option>
              <option value="none">Zero Tax / Tax Exempt</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Shipping / Freight ({currency})</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={shippingCharges}
              onChange={(e) => setShippingCharges(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Challan Logistics Fields (if Challan selected) */}
        {docType === 'challan' && (
          <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-lg text-xs space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-teal-900">
              <Truck className="w-4 h-4 text-teal-700" />
              <span>Challan Logistics & Movement Info</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Vehicle / Truck No.</label>
                <input
                  type="text"
                  placeholder="e.g. MH-12-AB-1234 or CA-89021"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Dispatch Mode / Courier</label>
                <input
                  type="text"
                  placeholder="e.g. BlueDart, FedEx, Self-Pickup, Freight"
                  value={dispatchThrough}
                  onChange={(e) => setDispatchThrough(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md"
                />
              </div>
              <div className="flex items-center pt-5">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={returnable}
                    onChange={(e) => setReturnable(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <span className="font-semibold text-slate-800">Returnable Challan (Demo / Job Work)</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Delivery / Inspection Remarks</label>
              <input
                type="text"
                placeholder="e.g. Delivered in sealed wooden crate. Requires inward signoff."
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md"
              />
            </div>
          </div>
        )}

        {/* Line Items Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Line Items & Services</h3>
            <div className="flex items-center gap-2">
              {itemsCatalog && itemsCatalog.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200 transition-colors shadow-2xs"
                  title="Select and insert items from your Item Master Inventory"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Add from Catalog</span>
                </button>
              )}
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Line</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-3 font-semibold">Item & Description</th>
                  <th className="py-2.5 px-3 font-semibold w-24">HSN/SAC</th>
                  <th className="py-2.5 px-3 font-semibold w-20">Qty</th>
                  <th className="py-2.5 px-3 font-semibold w-20">Unit</th>
                  <th className="py-2.5 px-3 font-semibold w-28">Rate ({currency})</th>
                  <th className="py-2.5 px-3 font-semibold w-24">Tax %</th>
                  <th className="py-2.5 px-3 font-semibold w-24">Disc. ({currency})</th>
                  <th className="py-2.5 px-3 font-semibold text-right w-28">Amount</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Item name or service description"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="HSN/SAC"
                        value={item.hsnCode || ''}
                        onChange={(e) => updateLineItem(item.id, { hsnCode: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, { quantity: parseFloat(e.target.value) || 1 })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-center"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={item.unit || 'Unit'}
                        onChange={(e) => updateLineItem(item.id, { unit: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      >
                        <option value="Unit">Unit</option>
                        <option value="Pcs">Pcs</option>
                        <option value="Hours">Hours</option>
                        <option value="Box">Box</option>
                        <option value="Sets">Sets</option>
                        <option value="Kg">Kg</option>
                        <option value="Month">Month</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-right font-medium"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={item.taxRate}
                        onChange={(e) => updateLineItem(item.id, { taxRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                        disabled={taxType === 'none'}
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="8.5">8.5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => updateLineItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-right"
                      />
                    </td>
                    <td className="p-2 text-right font-semibold text-slate-900 font-mono">
                      {formatCurrency(item.total, currency, currencies)}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculation & Terms Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment / Delivery Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Terms & Conditions</label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-sans"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCurrency(subtotal, currency, currencies)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Discount Total</span>
                <span className="font-semibold text-rose-600">- {formatCurrency(discountTotal, currency, currencies)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Calculated Tax ({taxType.toUpperCase()})</span>
              <span className="font-semibold text-slate-900">{formatCurrency(taxAmount, currency, currencies)}</span>
            </div>
            {Number(shippingCharges) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Shipping Charges</span>
                <span className="font-semibold text-slate-900">{formatCurrency(shippingCharges, currency, currencies)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
              <span>Grand Total</span>
              <span className="text-base text-indigo-900">{formatCurrency(grandTotal, currency, currencies)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Item Catalog Picker Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Select from Item Master Inventory</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by item name, SKU, or HSN/SAC code..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              {productLists.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-[11px] font-semibold text-slate-500 shrink-0 flex items-center gap-1">
                    <ListFilter className="w-3 h-3 text-indigo-500" /> Catalog:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCatalogListId('all')}
                    className={`px-2 py-1 rounded text-[11px] font-medium shrink-0 transition ${
                      selectedCatalogListId === 'all'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Catalogs ({itemsCatalog.length})
                  </button>
                  {productLists.map((p) => {
                    const count = itemsCatalog.filter(it => it.productListIds?.includes(p.id) || p.itemIds?.includes(it.id)).length;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedCatalogListId(p.id)}
                        className={`px-2 py-1 rounded text-[11px] font-medium shrink-0 transition ${
                          selectedCatalogListId === p.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p.name} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 max-h-80 overflow-y-auto divide-y divide-slate-100">
              {itemsCatalog
                .filter((it) => {
                  if (selectedCatalogListId !== 'all') {
                    const pl = productLists.find(p => p.id === selectedCatalogListId);
                    const isInList = (it.productListIds && it.productListIds.includes(selectedCatalogListId)) ||
                                     (pl && pl.itemIds && pl.itemIds.includes(it.id));
                    if (!isInList) return false;
                  }
                  if (!catalogSearch.trim()) return true;
                  const q = catalogSearch.toLowerCase();
                  return (
                    it.name.toLowerCase().includes(q) ||
                    (it.sku && it.sku.toLowerCase().includes(q)) ||
                    (it.hsnCode && it.hsnCode.toLowerCase().includes(q))
                  );
                })
                .map((it) => (
                  <div
                    key={it.id}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{it.name}</div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        {it.sku && <span className="font-mono">SKU: {it.sku}</span>}
                        {it.hsnCode && <span>• HSN: {it.hsnCode}</span>}
                        <span>• Tax: {it.taxRate}%</span>
                        <span>• Unit: {it.unit}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          it.stock > 10 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          Stock: {it.stock}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-xs text-slate-900">
                        {formatCurrency(it.unitPrice, currency, currencies)}
                      </span>
                      <button
                        type="button"
                        onClick={() => addItemFromCatalog(it)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                      >
                        Add to Doc
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
