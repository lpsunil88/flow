export type DocumentType = 'invoice' | 'proforma' | 'challan';

export type PaymentStatus = 'draft' | 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export type PaymentMethod = 'bank_transfer' | 'upi' | 'cash' | 'credit_card' | 'cheque' | 'other';

export type UserRole = 'admin' | 'manager' | 'staff' | 'auditor';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarColor: string;
  password?: string;
  pin?: string;
  phone?: string;
  department?: string;
  createdAt?: string;
  status?: 'active' | 'inactive';
}

export interface ShippingAddress {
  enabled?: boolean;
  name?: string; // Consignee / Receiver Person Name
  company?: string; // Consignee Company Name
  address?: string; // Delivery Street Address
  city?: string;
  state?: string;
  stateCode?: string;
  pincode?: string;
  country?: string;
  phone?: string;
  taxId?: string; // Consignee GSTIN
}

export interface DispatchAddress {
  enabled?: boolean;
  name?: string; // Warehouse / Plant / Dispatch Center Name
  address?: string; // Dispatch Street Address
  city?: string;
  state?: string;
  stateCode?: string;
  pincode?: string;
  country?: string;
  phone?: string;
  taxId?: string; // Dispatch Location GSTIN
}

export interface Client {
  id: string;
  companyId?: string; // Optional company association for multi-company isolation
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  country?: string;
  taxId: string; // GSTIN / VAT ID / Tax Reg
  currency: string;
  notes?: string;
  shippingAddress?: ShippingAddress;
  totalBilled: number;
  outstandingBalance: number;
  createdAt: string;
}

export interface LineItem {
  id: string;
  description: string;
  hsnCode?: string; // HSN / SAC Code
  quantity: number;
  unit: string; // Pcs, Hours, Kg, Box, Service, etc.
  unitPrice: number;
  taxRate: number; // percentage (e.g. 18 for 18%)
  discount: number; // percentage or fixed amount
  amount: number; // qty * unitPrice - discount
  taxAmount: number;
  total: number; // amount + taxAmount
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  notes?: string;
  recordedBy: string;
}

export interface ChallanDetails {
  vehicleNo?: string;
  dispatchDate?: string;
  dispatchThrough?: string; // Courier, Freight, Hand Delivery
  deliveryNote?: string;
  returnable: boolean;
  receivedBy?: string;
}

export interface Document {
  id: string;
  type: DocumentType;
  documentNumber: string; // e.g. INV-2026-001, PI-001, DC-001
  date: string;
  dueDate: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientTaxId: string;
  items: LineItem[];
  subtotal: number;
  discountTotal: number;
  taxType: 'gst' | 'vat' | 'sales_tax' | 'none';
  taxRate: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  taxAmount: number;
  shippingCharges: number;
  grandTotal: number;
  currency: string;
  status: PaymentStatus;
  paidAmount: number;
  payments: PaymentRecord[];
  notes?: string;
  terms?: string;
  challanDetails?: ChallanDetails;
  driveFileId?: string;
  driveViewLink?: string;
  lastSyncedWithDrive?: string;
  remindersSent: {
    id: string;
    date: string;
    channel: 'whatsapp' | 'email';
    templateName: string;
    sentTo: string;
  }[];
  createdAt: string;
  createdBy: string;
  proformaConvertedInvoiceId?: string;
  sourceProformaId?: string;
  sourceChallanId?: string;
  companyId?: string;
  theme?: string;
  designId?: string;
  invoiceTemplate?: InvoiceTemplate;
  template?: InvoiceTemplate;
  shippingAddress?: ShippingAddress;
  dispatchAddress?: DispatchAddress;
  stampUrl?: string;
  signatureUrl?: string;
  authorizedSignatoryName?: string;
  authorizedSignatoryDesignation?: string;
  includeStamp?: boolean;
  includeSignature?: boolean;
}

export type InvoiceTemplate = 'Modern' | 'Classic' | 'Minimal';

export interface ProductList {
  id: string;
  name: string; // e.g. "Standard Catalog", "Wholesale & Volume", "Export / Overseas", "IT Services & AMC"
  description?: string;
  companyId?: string; // Scoped to a specific company or null for all companies
  currency: string;
  isDefault?: boolean;
  itemCount?: number;
  itemIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Item {
  id: string;
  name: string;
  sku?: string;
  description: string;
  hsnCode: string;
  unit: string;
  unitPrice: number;
  purchasePrice?: number;
  taxRate: number;
  category: string;
  stockQuantity?: number;
  companyId?: string;
  productListIds?: string[]; // IDs of Product Lists / Catalogs this item is assigned to
  createdAt?: string;
  updatedAt?: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  exchangeRate: number; // vs USD
}

export interface CompanyProfile {
  id: string;
  name: string;
  taxId: string;
  logoUrl?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  website: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscSwift: string;
    upiId: string;
    qrCodeText?: string;
  };
  defaultCurrency: string;
  defaultTaxType: 'gst' | 'vat' | 'sales_tax';
  defaultTaxRate: number;
  isGstInterState: boolean;
  invoicePrefix: string;
  proformaPrefix: string;
  challanPrefix: string;
  terms: string;
  invoiceTheme?: string;
  proformaTheme?: string;
  challanTheme?: string;
  defaultInvoiceDesign?: string;
  defaultProformaDesign?: string;
  defaultChallanDesign?: string;
  defaultInvoiceTemplate?: InvoiceTemplate;
  stampUrl?: string; // Company Official Stamp/Seal Data URL or link
  signatureUrl?: string; // Authorized Signatory Signature Data URL or link
  authorizedSignatoryName?: string; // e.g. "Sunil Kumar"
  authorizedSignatoryDesignation?: string; // e.g. "Authorized Signatory", "Director"
  defaultDispatchAddress?: DispatchAddress;
}

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
  size?: string;
}
