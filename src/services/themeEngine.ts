export interface DocumentTheme {
  id: string;
  name: string;
  forType: 'invoice' | 'proforma' | 'challan' | 'all';
  primaryColor: [number, number, number]; // RGB
  accentColor: [number, number, number];
  headerBg: [number, number, number];
  headerTextColor: [number, number, number];
  tableHeaderBg: [number, number, number];
  tableHeaderTextColor: [number, number, number];
  badgeBg: [number, number, number];
  badgeTextColor: [number, number, number];
  fontFamily: 'helvetica' | 'times' | 'courier';
  // Web preview class tokens
  web: {
    primaryText: string;
    accentBg: string;
    badgeBg: string;
    badgeText: string;
    tableHeaderBg: string;
    tableHeaderText: string;
    cardBorder: string;
    highlightBg: string;
    accentBorder: string;
  };
}

export const INVOICE_THEMES: DocumentTheme[] = [
  {
    id: 'modern-indigo',
    name: 'Modern Indigo',
    forType: 'invoice',
    primaryColor: [79, 70, 229], // indigo-600
    accentColor: [99, 102, 241], // indigo-500
    headerBg: [248, 250, 252], // slate-50
    headerTextColor: [15, 23, 42], // slate-900
    tableHeaderBg: [79, 70, 229], // indigo-600
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [79, 70, 229],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'helvetica',
    web: {
      primaryText: 'text-indigo-950',
      accentBg: 'bg-indigo-600',
      badgeBg: 'bg-indigo-600',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-indigo-700',
      tableHeaderText: 'text-white',
      cardBorder: 'border-indigo-100',
      highlightBg: 'bg-indigo-50/60',
      accentBorder: 'border-indigo-600',
    },
  },
  {
    id: 'classic-corporate',
    name: 'Classic Corporate Navy',
    forType: 'invoice',
    primaryColor: [15, 23, 42], // slate-900
    accentColor: [180, 83, 9], // amber-700
    headerBg: [241, 245, 249], // slate-100
    headerTextColor: [15, 23, 42],
    tableHeaderBg: [15, 23, 42],
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [15, 23, 42],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'times',
    web: {
      primaryText: 'text-slate-900',
      accentBg: 'bg-slate-900',
      badgeBg: 'bg-slate-900',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-slate-900',
      tableHeaderText: 'text-white',
      cardBorder: 'border-slate-300',
      highlightBg: 'bg-slate-50',
      accentBorder: 'border-slate-800',
    },
  },
  {
    id: 'emerald-executive',
    name: 'Emerald Executive',
    forType: 'invoice',
    primaryColor: [5, 150, 105], // emerald-600
    accentColor: [16, 185, 129],
    headerBg: [240, 253, 244], // emerald-50
    headerTextColor: [6, 78, 59], // emerald-900
    tableHeaderBg: [6, 95, 70], // emerald-800
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [5, 150, 105],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'helvetica',
    web: {
      primaryText: 'text-emerald-950',
      accentBg: 'bg-emerald-700',
      badgeBg: 'bg-emerald-600',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-emerald-800',
      tableHeaderText: 'text-white',
      cardBorder: 'border-emerald-200',
      highlightBg: 'bg-emerald-50/60',
      accentBorder: 'border-emerald-600',
    },
  },
  {
    id: 'minimal-monochrome',
    name: 'Minimal Monochrome',
    forType: 'invoice',
    primaryColor: [30, 41, 59], // slate-800
    accentColor: [71, 85, 105],
    headerBg: [255, 255, 255],
    headerTextColor: [0, 0, 0],
    tableHeaderBg: [30, 41, 59],
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [0, 0, 0],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'helvetica',
    web: {
      primaryText: 'text-black',
      accentBg: 'bg-black',
      badgeBg: 'bg-black',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-slate-800',
      tableHeaderText: 'text-white',
      cardBorder: 'border-slate-200',
      highlightBg: 'bg-slate-50',
      accentBorder: 'border-black',
    },
  },
];

export const PROFORMA_THEMES: DocumentTheme[] = [
  {
    id: 'amber-quartz',
    name: 'Amber Quartz Quote',
    forType: 'proforma',
    primaryColor: [217, 119, 6], // amber-600
    accentColor: [245, 158, 11],
    headerBg: [254, 252, 232], // yellow-50
    headerTextColor: [120, 53, 15], // amber-900
    tableHeaderBg: [180, 83, 9], // amber-700
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [217, 119, 6],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'helvetica',
    web: {
      primaryText: 'text-amber-950',
      accentBg: 'bg-amber-600',
      badgeBg: 'bg-amber-600',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-amber-700',
      tableHeaderText: 'text-white',
      cardBorder: 'border-amber-200',
      highlightBg: 'bg-amber-50/60',
      accentBorder: 'border-amber-600',
    },
  },
  {
    id: 'royal-navy',
    name: 'Royal Proforma Blue',
    forType: 'proforma',
    primaryColor: [30, 58, 138], // blue-900
    accentColor: [37, 99, 235],
    headerBg: [239, 246, 255], // blue-50
    headerTextColor: [30, 58, 138],
    tableHeaderBg: [30, 58, 138],
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [37, 99, 235],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'helvetica',
    web: {
      primaryText: 'text-blue-950',
      accentBg: 'bg-blue-700',
      badgeBg: 'bg-blue-600',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-blue-900',
      tableHeaderText: 'text-white',
      cardBorder: 'border-blue-200',
      highlightBg: 'bg-blue-50/60',
      accentBorder: 'border-blue-600',
    },
  },
  {
    id: 'sunset-coral',
    name: 'Sunset Terracotta',
    forType: 'proforma',
    primaryColor: [225, 29, 72], // rose-600
    accentColor: [244, 63, 94],
    headerBg: [255, 241, 242], // rose-50
    headerTextColor: [136, 19, 55],
    tableHeaderBg: [190, 18, 60],
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [225, 29, 72],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'helvetica',
    web: {
      primaryText: 'text-rose-950',
      accentBg: 'bg-rose-600',
      badgeBg: 'bg-rose-600',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-rose-800',
      tableHeaderText: 'text-white',
      cardBorder: 'border-rose-200',
      highlightBg: 'bg-rose-50/60',
      accentBorder: 'border-rose-600',
    },
  },
  {
    id: 'emerald-estimate',
    name: 'Emerald Formal Quotation',
    forType: 'proforma',
    primaryColor: [5, 122, 85], // emerald-700
    accentColor: [16, 185, 129],
    headerBg: [240, 253, 244], // emerald-50
    headerTextColor: [6, 78, 59],
    tableHeaderBg: [5, 122, 85],
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [5, 122, 85],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'helvetica',
    web: {
      primaryText: 'text-emerald-950',
      accentBg: 'bg-emerald-700',
      badgeBg: 'bg-emerald-700',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-emerald-800',
      tableHeaderText: 'text-white',
      cardBorder: 'border-emerald-200',
      highlightBg: 'bg-emerald-50/70',
      accentBorder: 'border-emerald-700',
    },
  },
  {
    id: 'amethyst-prestige',
    name: 'Amethyst Executive Quote',
    forType: 'proforma',
    primaryColor: [109, 40, 217], // violet-700
    accentColor: [139, 92, 246],
    headerBg: [245, 243, 255], // violet-50
    headerTextColor: [76, 29, 149],
    tableHeaderBg: [109, 40, 217],
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [109, 40, 217],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'helvetica',
    web: {
      primaryText: 'text-purple-950',
      accentBg: 'bg-purple-700',
      badgeBg: 'bg-purple-700',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-purple-800',
      tableHeaderText: 'text-white',
      cardBorder: 'border-purple-200',
      highlightBg: 'bg-purple-50/70',
      accentBorder: 'border-purple-700',
    },
  },
  {
    id: 'slate-minimal',
    name: 'Slate Minimalist Estimate',
    forType: 'proforma',
    primaryColor: [30, 41, 59], // slate-800
    accentColor: [71, 85, 105],
    headerBg: [248, 250, 252], // slate-50
    headerTextColor: [15, 23, 42],
    tableHeaderBg: [30, 41, 59],
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [30, 41, 59],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'helvetica',
    web: {
      primaryText: 'text-slate-900',
      accentBg: 'bg-slate-800',
      badgeBg: 'bg-slate-800',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-slate-800',
      tableHeaderText: 'text-white',
      cardBorder: 'border-slate-300',
      highlightBg: 'bg-slate-50',
      accentBorder: 'border-slate-800',
    },
  },
  {
    id: 'cobalt-tech',
    name: 'Cobalt Tech Quotation',
    forType: 'proforma',
    primaryColor: [37, 99, 235], // blue-600
    accentColor: [59, 130, 246],
    headerBg: [239, 246, 255], // blue-50
    headerTextColor: [29, 78, 216],
    tableHeaderBg: [29, 78, 216],
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [37, 99, 235],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'helvetica',
    web: {
      primaryText: 'text-blue-950',
      accentBg: 'bg-blue-600',
      badgeBg: 'bg-blue-600',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-blue-700',
      tableHeaderText: 'text-white',
      cardBorder: 'border-blue-200',
      highlightBg: 'bg-blue-50/70',
      accentBorder: 'border-blue-600',
    },
  },
  {
    id: 'crimson-heritage',
    name: 'Crimson Heritage Quote',
    forType: 'proforma',
    primaryColor: [159, 18, 57], // rose-800
    accentColor: [190, 18, 60],
    headerBg: [255, 241, 242], // rose-50
    headerTextColor: [136, 19, 55],
    tableHeaderBg: [159, 18, 57],
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [159, 18, 57],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'times',
    web: {
      primaryText: 'text-rose-950',
      accentBg: 'bg-rose-800',
      badgeBg: 'bg-rose-800',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-rose-900',
      tableHeaderText: 'text-white',
      cardBorder: 'border-rose-300',
      highlightBg: 'bg-rose-50/70',
      accentBorder: 'border-rose-800',
    },
  },
];

export const CHALLAN_THEMES: DocumentTheme[] = [
  {
    id: 'teal-logistics',
    name: 'Teal Dispatch & Freight',
    forType: 'challan',
    primaryColor: [13, 148, 136], // teal-600
    accentColor: [20, 184, 166],
    headerBg: [240, 253, 250], // teal-50
    headerTextColor: [19, 78, 74],
    tableHeaderBg: [15, 118, 110], // teal-700
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [13, 148, 136],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'helvetica',
    web: {
      primaryText: 'text-teal-950',
      accentBg: 'bg-teal-600',
      badgeBg: 'bg-teal-600',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-teal-700',
      tableHeaderText: 'text-white',
      cardBorder: 'border-teal-200',
      highlightBg: 'bg-teal-50/70',
      accentBorder: 'border-teal-600',
    },
  },
  {
    id: 'industrial-steel',
    name: 'Industrial Steel Grey',
    forType: 'challan',
    primaryColor: [51, 65, 85], // slate-700
    accentColor: [71, 85, 105],
    headerBg: [241, 245, 249],
    headerTextColor: [15, 23, 42],
    tableHeaderBg: [30, 41, 59],
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [51, 65, 85],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'helvetica',
    web: {
      primaryText: 'text-slate-900',
      accentBg: 'bg-slate-700',
      badgeBg: 'bg-slate-700',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-slate-800',
      tableHeaderText: 'text-white',
      cardBorder: 'border-slate-300',
      highlightBg: 'bg-slate-100',
      accentBorder: 'border-slate-700',
    },
  },
  {
    id: 'forest-green',
    name: 'Forest Cargo Green',
    forType: 'challan',
    primaryColor: [22, 101, 52], // green-800
    accentColor: [34, 197, 94],
    headerBg: [240, 253, 244],
    headerTextColor: [20, 83, 45],
    tableHeaderBg: [22, 101, 52],
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [22, 101, 52],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'helvetica',
    web: {
      primaryText: 'text-green-950',
      accentBg: 'bg-green-700',
      badgeBg: 'bg-green-700',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-green-800',
      tableHeaderText: 'text-white',
      cardBorder: 'border-green-200',
      highlightBg: 'bg-green-50/70',
      accentBorder: 'border-green-700',
    },
  },
  {
    id: 'safety-orange',
    name: 'Safety Orange Dispatch',
    forType: 'challan',
    primaryColor: [234, 88, 12], // orange-600
    accentColor: [249, 115, 22],
    headerBg: [255, 247, 237], // orange-50
    headerTextColor: [154, 52, 18],
    tableHeaderBg: [194, 65, 12], // orange-700
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [234, 88, 12],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'helvetica',
    web: {
      primaryText: 'text-orange-950',
      accentBg: 'bg-orange-600',
      badgeBg: 'bg-orange-600',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-orange-700',
      tableHeaderText: 'text-white',
      cardBorder: 'border-orange-200',
      highlightBg: 'bg-orange-50/80',
      accentBorder: 'border-orange-600',
    },
  },
  {
    id: 'ocean-freight',
    name: 'Deep Ocean Cargo',
    forType: 'challan',
    primaryColor: [14, 116, 144], // cyan-700
    accentColor: [6, 182, 212],
    headerBg: [236, 254, 255], // cyan-50
    headerTextColor: [22, 78, 99],
    tableHeaderBg: [14, 116, 144],
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [14, 116, 144],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'helvetica',
    web: {
      primaryText: 'text-cyan-950',
      accentBg: 'bg-cyan-700',
      badgeBg: 'bg-cyan-700',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-cyan-800',
      tableHeaderText: 'text-white',
      cardBorder: 'border-cyan-200',
      highlightBg: 'bg-cyan-50/70',
      accentBorder: 'border-cyan-700',
    },
  },
  {
    id: 'express-crimson',
    name: 'Express Courier & Cargo Red',
    forType: 'challan',
    primaryColor: [220, 38, 38], // red-600
    accentColor: [239, 68, 68],
    headerBg: [254, 242, 242], // red-50
    headerTextColor: [153, 27, 27],
    tableHeaderBg: [185, 28, 28], // red-700
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [220, 38, 38],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'helvetica',
    web: {
      primaryText: 'text-red-950',
      accentBg: 'bg-red-600',
      badgeBg: 'bg-red-600',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-red-700',
      tableHeaderText: 'text-white',
      cardBorder: 'border-red-200',
      highlightBg: 'bg-red-50/70',
      accentBorder: 'border-red-600',
    },
  },
  {
    id: 'charcoal-warehouse',
    name: 'Charcoal Warehouse Technical',
    forType: 'challan',
    primaryColor: [39, 39, 42], // zinc-800
    accentColor: [82, 82, 91],
    headerBg: [244, 244, 245], // zinc-100
    headerTextColor: [24, 24, 27],
    tableHeaderBg: [39, 39, 42],
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [24, 24, 27],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'courier',
    web: {
      primaryText: 'text-zinc-900',
      accentBg: 'bg-zinc-800',
      badgeBg: 'bg-zinc-900',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-zinc-800',
      tableHeaderText: 'text-white',
      cardBorder: 'border-zinc-300',
      highlightBg: 'bg-zinc-100',
      accentBorder: 'border-zinc-800',
    },
  },
  {
    id: 'military-olive',
    name: 'Heavy Freight Olive',
    forType: 'challan',
    primaryColor: [63, 98, 18], // lime-800
    accentColor: [101, 163, 13],
    headerBg: [247, 254, 231], // lime-50
    headerTextColor: [54, 83, 20],
    tableHeaderBg: [63, 98, 18],
    tableHeaderTextColor: [255, 255, 255],
    badgeBg: [63, 98, 18],
    badgeTextColor: [255, 255, 255],
    fontFamily: 'helvetica',
    web: {
      primaryText: 'text-lime-950',
      accentBg: 'bg-lime-800',
      badgeBg: 'bg-lime-800',
      badgeText: 'text-white',
      tableHeaderBg: 'bg-lime-900',
      tableHeaderText: 'text-white',
      cardBorder: 'border-lime-300',
      highlightBg: 'bg-lime-50/70',
      accentBorder: 'border-lime-800',
    },
  },
];

export const ALL_THEMES = [...INVOICE_THEMES, ...PROFORMA_THEMES, ...CHALLAN_THEMES];

export type DesignLayoutType =
  | 'modern-minimal'
  | 'classic-corporate'
  | 'executive-split'
  | 'compact-grid'
  | 'creative-bold'
  | 'logistics-dispatch'
  | 'thermal-slip'
  | 'tender-formal';

export interface DocumentDesign {
  id: string;
  name: string;
  category: 'invoice' | 'proforma' | 'challan' | 'all';
  layoutType: DesignLayoutType;
  description: string;
  badge: string;
  idealFor: string;
  previewFeatures: string[];
  theme: DocumentTheme;
}

export const DOCUMENT_DESIGNS: DocumentDesign[] = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimalist',
    category: 'all',
    layoutType: 'modern-minimal',
    badge: 'Popular',
    description: 'Clean edge architecture with floating header, subtle border dividers, and streamlined modern typography.',
    idealFor: 'Tech startups, agencies, digital products, consulting & freelancers',
    previewFeatures: [
      'Frameless airy item rows with soft dividers',
      'Floating header with sleek company logo branding',
      'Right-aligned modern summary card with soft shading',
      'Subtle payment instructions and clean metadata'
    ],
    theme: INVOICE_THEMES[0], // modern-indigo
  },
  {
    id: 'classic-corporate',
    name: 'Classic Corporate',
    category: 'all',
    layoutType: 'classic-corporate',
    badge: 'B2B Standard',
    description: 'Traditional formal structure with double-lined borders, framed client/seller boxes, table gridlines, and official authorized signatory seal block.',
    idealFor: 'B2B enterprises, manufacturing, legal, accounting & institutional contracts',
    previewFeatures: [
      'Boxed border panels for Seller and Consignee details',
      'Structured gridlines on every table cell and header',
      'Dedicated Authorized Signatory & Company Stamp box',
      'Comprehensive terms & banking wire details block'
    ],
    theme: INVOICE_THEMES[1], // classic-corporate
  },
  {
    id: 'executive-split',
    name: 'Executive Premium',
    category: 'all',
    layoutType: 'executive-split',
    badge: 'Premium',
    description: 'Striking full-width colored header banner, dual-tone card containers, prominent document badge, and structured banking QR box.',
    idealFor: 'High-ticket services, executive consulting, luxury commerce & premium B2B',
    previewFeatures: [
      'Bold full-width top header band with white contrast typography',
      'Dual-column client & billing information cards',
      'Highlighted Total Balance Due banner',
      'Structured banking details with digital payment handle'
    ],
    theme: INVOICE_THEMES[2], // emerald-executive
  },
  {
    id: 'compact-grid',
    name: 'Compact Tax & GST Ledger',
    category: 'all',
    layoutType: 'compact-grid',
    badge: 'Multi-Item / GST',
    description: 'High-density tabular ledger featuring HSN/SAC codes, taxable values, and itemized CGST + SGST tax breakdown matrices.',
    idealFor: 'Wholesalers, distributors, hardware, FMCG, multi-item invoices & GST compliance',
    previewFeatures: [
      'High-density table for multi-line inventories (10+ items)',
      'Dedicated HSN/SAC code, unit rate & discount columns',
      'Split CGST + SGST or IGST tax breakdown matrix at footer',
      'Standardized tax invoice declaration text'
    ],
    theme: INVOICE_THEMES[3], // minimal-monochrome
  },
  {
    id: 'creative-bold',
    name: 'Creative Studio',
    category: 'all',
    layoutType: 'creative-bold',
    badge: 'Design Forward',
    description: 'Contemporary format featuring bold typography, left-accent highlight strip, modern status pills, and rounded cards.',
    idealFor: 'Designers, architecture firms, marketing agencies & media studios',
    previewFeatures: [
      'Oversized bold display typography for document number & totals',
      'Left-aligned vertical accent strip for visual prominence',
      'Pill tags for statuses, dates, and currencies',
      'Clean sans-serif aesthetic with generous negative space'
    ],
    theme: PROFORMA_THEMES[2], // sunset-coral
  },
  {
    id: 'logistics-dispatch',
    name: 'Logistics Dispatch & Gate Pass',
    category: 'challan',
    layoutType: 'logistics-dispatch',
    badge: 'Logistics & Cargo',
    description: 'Official dispatch slip format engineered for Delivery Challans and material gate passes, featuring vehicle numbers, transporter details, and receiver acknowledgement.',
    idealFor: 'Warehouse dispatches, freight transport, goods delivery, trial units & consignment transfer',
    previewFeatures: [
      'Transporter details, vehicle number & dispatch mode banner',
      'Returnable vs Non-Returnable goods compliance disclaimer',
      'Specialized delivery note & material remarks section',
      'Gate Pass stamp and Receiver Signature sign-off boxes'
    ],
    theme: CHALLAN_THEMES[0], // teal-logistics
  },
  {
    id: 'thermal-slip',
    name: 'Thermal POS Retail Slip',
    category: 'all',
    layoutType: 'thermal-slip',
    badge: 'POS & Counter',
    description: 'Compact 80mm-style retail receipt layout with monospace typography, dashed divider lines, and compact item summaries.',
    idealFor: 'Retail counters, service centers, quick sales & compact transaction slips',
    previewFeatures: [
      'Narrow centered monospace receipt formatting',
      'Dashed receipt border separators (cutlines)',
      'Compact itemized table with quick totals',
      'Direct UPI payment handle & transaction timestamp'
    ],
    theme: CHALLAN_THEMES[1], // industrial-steel
  },
  {
    id: 'tender-formal',
    name: 'Government & Tender Standard',
    category: 'all',
    layoutType: 'tender-formal',
    badge: 'Public Sector',
    description: 'Official formal serif format adhering to tender, public procurement, and government contractor compliance standards.',
    idealFor: 'Government tenders, defense contractors, educational institutions & public works',
    previewFeatures: [
      'Formal serif typography with formal procurement headers',
      'Purchase Order (PO) and Work Order cross-referencing',
      'Statutory compliance certifications & tax declarations',
      'Designated official seal and signature endorsement blocks'
    ],
    theme: INVOICE_THEMES[1], // classic-corporate
  },
];

export function getDesignForDocument(
  docType: 'invoice' | 'proforma' | 'challan',
  designIdOrThemeId?: string,
  companyDefaultDesign?: string,
  companyDefaultTheme?: string
): DocumentDesign {
  const targetId = designIdOrThemeId || companyDefaultDesign || companyDefaultTheme;

  if (targetId) {
    // 1. Direct design id match
    const directDesign = DOCUMENT_DESIGNS.find((d) => d.id === targetId || d.layoutType === targetId);
    if (directDesign) return directDesign;

    // 2. If an old theme ID was passed, find corresponding theme or design
    const matchedTheme = ALL_THEMES.find((t) => t.id === targetId);
    if (matchedTheme) {
      const designWithTheme = DOCUMENT_DESIGNS.find((d) => d.theme.id === matchedTheme.id);
      if (designWithTheme) return designWithTheme;
    }
  }

  // Fallback defaults per document type
  if (docType === 'challan') {
    return DOCUMENT_DESIGNS.find((d) => d.id === 'logistics-dispatch') || DOCUMENT_DESIGNS[5];
  }
  if (docType === 'proforma') {
    return DOCUMENT_DESIGNS.find((d) => d.id === 'creative-bold') || DOCUMENT_DESIGNS[0];
  }
  return DOCUMENT_DESIGNS[0]; // Modern Minimalist
}

export function getThemeForDocument(
  docType: 'invoice' | 'proforma' | 'challan',
  themeId?: string,
  companyDefaultTheme?: string
): DocumentTheme {
  const targetId = themeId || companyDefaultTheme;
  if (targetId) {
    const found = ALL_THEMES.find((t) => t.id === targetId);
    if (found) return found;

    // Check if it's a design id
    const foundDesign = DOCUMENT_DESIGNS.find((d) => d.id === targetId || d.layoutType === targetId);
    if (foundDesign) return foundDesign.theme;
  }

  // Default fallback per document type
  if (docType === 'proforma') return PROFORMA_THEMES[0];
  if (docType === 'challan') return CHALLAN_THEMES[0];
  return INVOICE_THEMES[0];
}
