import { CompanyProfile, CurrencyConfig, Document, DocumentType } from '../types';
import { formatAmountToWords, getStateDisplay } from '../utils/numberToWords';

/**
 * Shared branding colors in multiple formats (Hex, RGB for jsPDF, and Tailwind classes).
 */
export const DOCUMENT_THEME = {
  colors: {
    primary: {
      hex: '#2563eb',
      rgb: [37, 99, 235] as [number, number, number],
      tailwindText: 'text-blue-600',
      tailwindBg: 'bg-blue-600',
    },
    textMain: {
      hex: '#0f172a',
      rgb: [15, 23, 42] as [number, number, number],
      tailwindText: 'text-slate-950',
    },
    textBody: {
      hex: '#334155',
      rgb: [51, 65, 85] as [number, number, number],
      tailwindText: 'text-slate-700',
    },
    textMuted: {
      hex: '#64748b',
      rgb: [100, 116, 139] as [number, number, number],
      tailwindText: 'text-slate-500',
    },
    textSecondary: {
      hex: '#475569',
      rgb: [71, 85, 105] as [number, number, number],
      tailwindText: 'text-slate-600',
    },
    borderStandard: {
      hex: '#cbd5e1',
      rgb: [203, 213, 225] as [number, number, number],
      tailwindBorder: 'border-slate-300',
    },
    borderSubtle: {
      hex: '#e2e8f0',
      rgb: [226, 232, 240] as [number, number, number],
      tailwindBorder: 'border-slate-200',
    },
    bgLight: {
      hex: '#f8fafc',
      rgb: [248, 250, 252] as [number, number, number],
      tailwindBg: 'bg-slate-50',
    },
    bgHeader: {
      hex: '#f1f5f9',
      rgb: [241, 245, 249] as [number, number, number],
      tailwindBg: 'bg-slate-100',
    },
    amberBrand: {
      hex: '#d97706',
      rgb: [217, 119, 6] as [number, number, number],
      bgHex: '#fef3c7',
      bgRgb: [254, 243, 199] as [number, number, number],
      borderRgb: [245, 158, 11] as [number, number, number],
    },
  },
  dimensions: {
    pageWidthMm: 210,
    pageHeightMm: 297,
    marginMm: 10,
    contentWidthMm: 190,
  },
  fonts: {
    pdfFont: 'helvetica',
    webFont: 'font-sans',
    monoFont: 'font-mono',
  },
};

/**
 * Standard 9-column layout definition for merchandise & invoice tables.
 */
export interface DocumentTableColumn {
  key: string;
  title: string;
  pdfWidthMm: number;
  align: 'left' | 'center' | 'right';
  tailwindWidthClass: string;
  tailwindAlignClass: string;
}

export function getDocumentTableColumns(isInterState: boolean, docType: DocumentType): DocumentTableColumn[] {
  const descTitle =
    docType === 'challan'
      ? 'Description of Merchandise Goods'
      : docType === 'invoice'
      ? 'Description of Goods / Services'
      : 'Description of Quotation Items';

  return [
    {
      key: 'sno',
      title: '#',
      pdfWidthMm: 8,
      align: 'center',
      tailwindWidthClass: 'w-8',
      tailwindAlignClass: 'text-center',
    },
    {
      key: 'desc',
      title: descTitle,
      pdfWidthMm: 54,
      align: 'left',
      tailwindWidthClass: 'w-auto',
      tailwindAlignClass: 'text-left',
    },
    {
      key: 'hsn',
      title: 'HSN/SAC',
      pdfWidthMm: 17,
      align: 'center',
      tailwindWidthClass: 'w-24',
      tailwindAlignClass: 'text-center',
    },
    {
      key: 'qty',
      title: 'Qty',
      pdfWidthMm: 13,
      align: 'center',
      tailwindWidthClass: 'w-12',
      tailwindAlignClass: 'text-center',
    },
    {
      key: 'uom',
      title: 'UOM',
      pdfWidthMm: 12,
      align: 'center',
      tailwindWidthClass: 'w-14',
      tailwindAlignClass: 'text-center',
    },
    {
      key: 'rate',
      title: 'Rate',
      pdfWidthMm: 19,
      align: 'right',
      tailwindWidthClass: 'w-20',
      tailwindAlignClass: 'text-right',
    },
    {
      key: 'taxval',
      title: 'Taxable Val',
      pdfWidthMm: 21,
      align: 'right',
      tailwindWidthClass: 'w-24',
      tailwindAlignClass: 'text-right',
    },
    {
      key: 'tax',
      title: isInterState ? 'IGST' : 'Tax',
      pdfWidthMm: 18,
      align: 'right',
      tailwindWidthClass: 'w-24',
      tailwindAlignClass: 'text-right',
    },
    {
      key: 'total',
      title: 'Total',
      pdfWidthMm: 28,
      align: 'right',
      tailwindWidthClass: 'w-24',
      tailwindAlignClass: 'text-right',
    },
  ];
}

/**
 * Standard Document Type Specifications
 */
export interface DocumentTypeConfig {
  documentTitle: string;
  divisionText: string;
  subtitleText: string;
  defaultCopyLabel: string;
  defaultPurpose: string;
  watermarkText: string;
  legalDeclaration: string;
  col1Label: string;
  col2Label: string;
  col3Label: string;
  col4Label: string;
  sellerCardTitle: string;
  buyerCardTitle: string;
  footerNotice: string;
}

export function getDocumentTypeConfig(
  doc: Document,
  company: CompanyProfile,
  overrides?: { copyLabel?: string; purposeText?: string; watermarkText?: string }
): DocumentTypeConfig {
  if (doc.type === 'challan') {
    return {
      documentTitle: 'DELIVERY CHALLAN',
      divisionText: company.department || 'CORPORATE MERCHANDISING DIVISION',
      subtitleText: '(Goods transport for Job Work, Inter-Branch Transfer, Branding & Consignment Dispatch)',
      defaultCopyLabel: overrides?.copyLabel || 'ORIGINAL FOR CONSIGNEE',
      defaultPurpose: overrides?.purposeText || doc.challanDetails?.purpose || 'STOCK TRANSFER',
      watermarkText: overrides?.watermarkText || 'DELIVERY CHALLAN',
      legalDeclaration:
        'Certified that particulars given above are true and correct and goods are dispatched under Rule 55 of CGST Rules, 2017 without sale.',
      col1Label: 'CHALLAN NUMBER:',
      col2Label: 'CHALLAN DATE & TIME:',
      col3Label: 'E-WAY BILL NO:',
      col4Label: 'VEHICLE NUMBER:',
      sellerCardTitle: 'CONSIGNOR (DISPATCH LOCATION)',
      buyerCardTitle: 'CONSIGNEE (RECIPIENT)',
      footerNotice:
        'This is a computer-generated delivery challan issued for corporate merchandising operations. Standard A4 format.',
    };
  }

  if (doc.type === 'proforma') {
    return {
      documentTitle: 'PROFORMA INVOICE',
      divisionText: 'COMMERCIAL PROFORMA / QUOTATION DIVISION',
      subtitleText: '(Commercial Quotation / Pre-Shipment Proforma Document)',
      defaultCopyLabel: overrides?.copyLabel || 'CUSTOMER COPY',
      defaultPurpose: overrides?.purposeText || 'COMMERCIAL QUOTATION',
      watermarkText: overrides?.watermarkText || 'PROFORMA',
      legalDeclaration:
        'This proforma invoice is an official quotation. Prices, taxes, and dispatch terms are subject to final order confirmation.',
      col1Label: 'PROFORMA NUMBER:',
      col2Label: 'PROFORMA DATE & TIME:',
      col3Label: 'VALIDITY PERIOD:',
      col4Label: 'REF / ORDER NO:',
      sellerCardTitle: 'SUPPLIER (DISPATCH LOCATION)',
      buyerCardTitle: 'PROSPECTIVE BUYER (BILLED TO)',
      footerNotice:
        'This is a computer-generated proforma invoice issued for corporate merchandising operations. Standard A4 format.',
    };
  }

  // Default: Tax Invoice
  return {
    documentTitle: 'TAX INVOICE',
    divisionText: 'TAX INVOICE / CORPORATE BILLING DIVISION',
    subtitleText: '(Issued under Section 31 of CGST Act, 2017 & Tax Invoice Rules)',
    defaultCopyLabel: overrides?.copyLabel || 'ORIGINAL FOR RECIPIENT',
    defaultPurpose: overrides?.purposeText || 'OUTWARD TAXABLE SUPPLY',
    watermarkText: overrides?.watermarkText || 'TAX INVOICE',
    legalDeclaration:
      'Certified that particulars given above are true and correct and this invoice depicts the actual price of the goods or services described under Section 31 of CGST Act, 2017.',
    col1Label: 'INVOICE NUMBER:',
    col2Label: 'INVOICE DATE & TIME:',
    col3Label: 'DUE DATE:',
    col4Label: 'VEHICLE / REF:',
    sellerCardTitle: 'SELLER (DISPATCH LOCATION)',
    buyerCardTitle: 'BUYER (BILLED TO)',
    footerNotice:
      'This is a computer-generated tax invoice issued for corporate operations. Standard A4 format.',
  };
}

/**
 * Resolved ViewModel containing all computed properties and labels
 * shared identically by both the on-screen preview and the PDF generator.
 */
export interface ResolvedDocumentData {
  config: DocumentTypeConfig;
  consignorState: { name: string; code: string };
  consigneeState: { name: string; code: string };
  monogram: string;
  formattedDateTime: string;
  totalQuantity: number;
  isInterState: boolean;
  halfTax: number;
  cgstVal: number;
  sgstVal: number;
  halfRate: string;
  currencySymbol: string;
  pdfCurrencySymbol: string;
  amountInWords: string;
  signatoryName: string;
  panStr: string;
  sellerTitle: string;
  sellerAddr: string;
  sellerCity: string;
  sellerGstin: string;
  sellerContact: string;
  buyerTitle: string;
  buyerAddr: string;
  buyerCity: string;
  buyerGstin: string;
  tableColumns: DocumentTableColumn[];
  transportMode: string;
  transporterName: string;
  lrGrText: string;
  driverText: string;
  remarksText: string;
}

export function resolveDocumentTemplateData(
  doc: Document,
  company: CompanyProfile,
  currencies: CurrencyConfig[] = [],
  overrides?: { copyLabel?: string; purposeText?: string; watermarkText?: string }
): ResolvedDocumentData {
  const config = getDocumentTypeConfig(doc, company, overrides);

  const consignorState = getStateDisplay(
    doc.dispatchAddress?.state || company.city,
    doc.dispatchAddress?.taxId || company.taxId,
    doc.dispatchAddress?.stateCode
  );

  const consigneeState = getStateDisplay(
    doc.shippingAddress?.state || doc.clientAddress,
    doc.shippingAddress?.taxId || doc.clientTaxId,
    doc.shippingAddress?.stateCode
  );

  const monogram =
    company.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'SC';

  const formattedDateTime = doc.date ? `${doc.date} (01:09 PM)` : '2026-09-04 (01:09 PM)';
  const totalQuantity = doc.items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  const isInterState = Boolean(doc.igstAmount && doc.igstAmount > 0);
  const halfTax = doc.taxAmount / 2;
  const cgstVal = doc.cgstAmount ?? halfTax;
  const sgstVal = doc.sgstAmount ?? halfTax;
  const halfRate = doc.taxRate ? (doc.taxRate / 2).toFixed(1) : '9.0';

  const currCode = doc.currency || company.defaultCurrency || 'INR';
  const foundCurr = currencies.find((c) => c.code.toUpperCase() === currCode.toUpperCase());
  const currencySymbol = currCode.toUpperCase() === 'INR' ? '₹' : foundCurr ? foundCurr.symbol : currCode;
  const pdfCurrencySymbol = currCode.toUpperCase() === 'INR' ? 'Rs.' : (foundCurr?.symbol === '₹' ? 'Rs.' : (foundCurr?.symbol || currCode));

  const amountInWords = formatAmountToWords(doc.grandTotal, currCode);

  const signatoryName =
    doc.authorizedSignatoryName ||
    company.authorizedSignatoryName ||
    'Sunil Kumar';

  const panStr =
    company.taxId && company.taxId.length >= 12
      ? company.taxId.substring(2, 12)
      : 'AAGCS6232B';

  const sellerTitle = doc.dispatchAddress?.name || company.name || 'Sutraa Creations Private Limited';
  const sellerAddr = doc.dispatchAddress?.address || company.address || 'D-39 Sector 2 Noida Uttar Pradesh';
  const sellerCity = `${doc.dispatchAddress?.city || company.city || 'Noida'} - ${doc.dispatchAddress?.pincode || '201301'}, ${consignorState.name}`;
  const sellerGstin = doc.dispatchAddress?.taxId || company.taxId || '27AAGCS6232B1ZM';
  const sellerContact = doc.dispatchAddress?.phone
    ? `${doc.dispatchAddress.name || 'Dispatch Manager'} (${doc.dispatchAddress.phone})`
    : `Sunil Kumar (${company.phone || '7840069490'})`;

  const buyerTitle = doc.shippingAddress?.company || doc.clientCompany || doc.clientName || 'Sutraa Creations Private Limited';
  const buyerAddr = doc.shippingAddress?.address || doc.clientAddress || 'B-4, Ashok Guruprasad CHS Ltd, Hanuman Road, Vile Parle (E)';
  const buyerCity = `${doc.shippingAddress?.city || 'Mumbai'} - ${doc.shippingAddress?.pincode || '400057'}, ${consigneeState.name}`;
  const buyerGstin = doc.shippingAddress?.taxId || doc.clientTaxId || '27AAGCS6232B1ZM';

  const tableColumns = getDocumentTableColumns(isInterState, doc.type);

  const transportMode = doc.challanDetails?.dispatchThrough || 'Road';
  const transporterName = doc.challanDetails?.deliveryNote || '-';
  const lrGrText = doc.challanDetails?.lrNo || doc.challanDetails?.receivedBy || '-';
  const driverText = doc.challanDetails?.driverName || 'Direct Delivery';

  const remarksText =
    doc.challanDetails?.remarks ||
    `${config.defaultPurpose} - Goods described above are dispatched for corporate merchandising operations.`;

  return {
    config,
    consignorState,
    consigneeState,
    monogram,
    formattedDateTime,
    totalQuantity,
    isInterState,
    halfTax,
    cgstVal,
    sgstVal,
    halfRate,
    currencySymbol,
    pdfCurrencySymbol,
    amountInWords,
    signatoryName,
    panStr,
    sellerTitle,
    sellerAddr,
    sellerCity,
    sellerGstin,
    sellerContact,
    buyerTitle,
    buyerAddr,
    buyerCity,
    buyerGstin,
    tableColumns,
    transportMode,
    transporterName,
    lrGrText,
    driverText,
    remarksText,
  };
}
