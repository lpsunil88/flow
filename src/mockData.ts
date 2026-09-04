import { Client, CompanyProfile, CurrencyConfig, Document, Item, ProductList, StaffUser } from './types';

export const INITIAL_CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 1.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', exchangeRate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', exchangeRate: 0.78 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', exchangeRate: 83.5 },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', exchangeRate: 3.67 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', exchangeRate: 1.36 },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', exchangeRate: 1.52 },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', exchangeRate: 1.34 },
];

export const INITIAL_COMPANIES: CompanyProfile[] = [
  {
    id: 'comp-1',
    name: 'My Company',
    taxId: '',
    logoUrl: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    website: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      ifscSwift: '',
      upiId: '',
      qrCodeText: '',
    },
    defaultCurrency: 'USD',
    defaultTaxType: 'gst',
    defaultTaxRate: 18,
    isGstInterState: false,
    invoicePrefix: 'INV-',
    proformaPrefix: 'PI-',
    challanPrefix: 'DC-',
    terms: '1. Payment is due within 15 days of invoice date.\n2. Please mention the invoice number in the payment reference.\n3. Goods once sold are not returnable without prior authorization.',
    invoiceTheme: 'modern-indigo',
    proformaTheme: 'amber-quartz',
    challanTheme: 'teal-logistics',
    defaultInvoiceTemplate: 'Modern',
    defaultInvoiceDesign: 'executive-split',
    defaultProformaDesign: 'modern-minimal',
    defaultChallanDesign: 'logistics-dispatch',
  },
];

export const INITIAL_COMPANY: CompanyProfile = INITIAL_COMPANIES[0];

export const INITIAL_PRODUCT_LISTS: ProductList[] = [];

export const INITIAL_ITEMS: Item[] = [];

export const INITIAL_STAFF: StaffUser[] = [
  {
    id: 'user-admin',
    name: 'Administrator',
    email: 'lpsunilkumar8@gmail.com',
    role: 'admin',
    avatarColor: 'bg-indigo-600',
    password: 'admin',
    pin: '1234',
    phone: '',
    department: 'Executive Leadership',
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
  },
];

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_DOCUMENTS: Document[] = [];
