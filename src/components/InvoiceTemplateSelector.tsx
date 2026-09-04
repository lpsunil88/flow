import React from 'react';
import { InvoiceTemplate } from '../types';
import { Sparkles, Layers, Minimize2, Check, FileText } from 'lucide-react';

interface InvoiceTemplateSelectorProps {
  selectedTemplate: InvoiceTemplate;
  onSelectTemplate: (template: InvoiceTemplate) => void;
  disabled?: boolean;
}

interface TemplateOption {
  id: InvoiceTemplate;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  features: string[];
  accentColor: string;
  badgeClass: string;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'Modern',
    name: 'Modern',
    badge: 'Contemporary',
    tagline: 'Vibrant & Contemporary',
    description: 'Sleek executive banner with bold brand accents, modern rounded cards, and high-impact totals.',
    features: ['Crisp Helvetica sans-serif', 'Vibrant header banner', 'Solid accent total block'],
    accentColor: 'indigo',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'Classic',
    name: 'Classic',
    badge: 'Formal B2B',
    tagline: 'Formal & Corporate',
    description: 'Traditional legal format featuring a double-line page border, serif typography, structured cell gridlines, and official seal.',
    features: ['Elegant Times-Roman serif', 'Double page border frame', 'Full table gridlines & stamp box'],
    accentColor: 'slate',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  {
    id: 'Minimal',
    name: 'Minimal',
    badge: 'Airy Clean',
    tagline: 'Airy & Clean Minimalist',
    description: 'Uncluttered Scandinavian layout with generous whitespace, delicate hairline dividers, and pure typographic hierarchy.',
    features: ['Frameless airy table', 'Subtle hairline dividers', 'Clean understated totals'],
    accentColor: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
];

export const InvoiceTemplateSelector: React.FC<InvoiceTemplateSelectorProps> = ({
  selectedTemplate,
  onSelectTemplate,
  disabled = false,
}) => {
  return (
    <div className="space-y-3" id="invoice-template-selector">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Invoice Template & PDF Visual Style
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                PDF Layout
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Select the visual presentation style for generated client PDF documents
            </p>
          </div>
        </div>

        {/* Selected badge indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 border border-slate-200">
          <span className="text-[11px] text-slate-400 font-normal">Active Style:</span>
          <span className="text-indigo-600 font-bold">{selectedTemplate}</span>
        </div>
      </div>

      {/* 3 Template Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TEMPLATE_OPTIONS.map((opt) => {
          const isSelected = selectedTemplate === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectTemplate(opt.id)}
              className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between group cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div>
                {/* Header with Title and Selected Checkmark */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold ${
                        opt.id === 'Modern'
                          ? 'bg-indigo-600'
                          : opt.id === 'Classic'
                          ? 'bg-slate-800'
                          : 'bg-emerald-600'
                      }`}
                    >
                      {opt.name.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">{opt.name}</span>
                  </div>

                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-xs">
                      <Check className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${opt.badgeClass}`}
                    >
                      {opt.badge}
                    </span>
                  )}
                </div>

                {/* Wireframe Illustration */}
                <div
                  className={`my-2 p-2 rounded-lg font-mono text-[8px] space-y-1 select-none border transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/40 border-indigo-200 text-indigo-900'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  {opt.id === 'Modern' && (
                    <div className="space-y-1">
                      {/* Bold top banner */}
                      <div className="h-3.5 bg-indigo-600 rounded text-white px-1.5 flex items-center justify-between text-[7px] font-bold">
                        <span>COMPANY LOGO</span>
                        <span>TAX INVOICE</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <div className="h-3 bg-indigo-100/70 rounded px-1 flex items-center text-[6.5px]">Bill To</div>
                        <div className="h-3 bg-indigo-100/70 rounded px-1 flex items-center text-[6.5px]">Details</div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="h-2 bg-indigo-200/50 rounded-xs" />
                        <div className="h-2 bg-slate-100 rounded-xs" />
                      </div>
                      <div className="flex justify-end">
                        <div className="h-3 w-16 bg-indigo-600 rounded text-white text-[6.5px] font-bold flex items-center justify-center">
                          TOTAL: ₹₹₹
                        </div>
                      </div>
                    </div>
                  )}

                  {opt.id === 'Classic' && (
                    <div className="p-0.5 border-2 border-slate-700 rounded-xs space-y-1 bg-white">
                      {/* Double border simulated */}
                      <div className="border border-slate-300 p-1 space-y-1">
                        <div className="flex justify-between items-center text-[7px] font-bold text-slate-800 border-b border-slate-300 pb-0.5">
                          <span className="font-serif">COMPANY & CO.</span>
                          <span className="font-serif text-[6.5px] border border-slate-400 px-0.5">TAX INVOICE</span>
                        </div>
                        {/* Gridlines */}
                        <div className="border border-slate-300 grid grid-cols-3 divide-x divide-slate-300 text-[6px] text-center">
                          <div className="bg-slate-100 font-bold">ITEM</div>
                          <div className="bg-slate-100 font-bold">QTY</div>
                          <div className="bg-slate-100 font-bold">PRICE</div>
                          <div>Parts</div>
                          <div>10</div>
                          <div>₹5,000</div>
                        </div>
                        <div className="flex justify-between items-center text-[6.5px] border-t border-slate-300 pt-0.5 font-serif">
                          <span>Bank & SWIFT</span>
                          <span className="font-bold border-b border-double border-slate-700">Total: ₹₹₹</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {opt.id === 'Minimal' && (
                    <div className="space-y-1 bg-white p-1 rounded-xs border border-dashed border-slate-200">
                      {/* Clean frameless layout */}
                      <div className="flex justify-between items-center text-[7px] text-slate-700 pb-1 border-b border-slate-200">
                        <span className="font-semibold tracking-wider">Minimalist</span>
                        <span className="text-[6.5px] text-slate-400">#INV-001</span>
                      </div>
                      <div className="py-0.5 space-y-0.5 text-[6.5px] text-slate-600">
                        <div className="flex justify-between border-b border-slate-100 pb-0.5">
                          <span>Design Retainer</span>
                          <span>₹12,000</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-0.5">
                          <span>Cloud Deployment</span>
                          <span>₹8,500</span>
                        </div>
                      </div>
                      <div className="flex justify-end pt-0.5 text-[7px] font-bold text-slate-800 border-t border-slate-800">
                        <span>Grand Total: ₹20,500</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] font-medium text-slate-700 mb-1">{opt.tagline}</div>
                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  {opt.description}
                </p>
              </div>

              {/* Feature bullets */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                {opt.features.map((feat, i) => (
                  <span
                    key={i}
                    className="text-[9.5px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
