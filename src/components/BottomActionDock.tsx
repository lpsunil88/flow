import React from 'react';
import { DocumentType, StaffUser } from '../types';
import { FileText, FileSpreadsheet, Truck, Plus, ShieldAlert, Sparkles } from 'lucide-react';

interface BottomActionDockProps {
  currentUser: StaffUser;
  onCreateDocument: (type: DocumentType) => void;
  isEditingOrCreating?: boolean;
}

export const BottomActionDock: React.FC<BottomActionDockProps> = ({
  currentUser,
  onCreateDocument,
  isEditingOrCreating = false,
}) => {
  // If user is currently inside the document editor, don't obstruct the editor actions
  if (isEditingOrCreating) return null;

  const isAuditor = currentUser.role === 'auditor';

  return (
    <aside
      aria-label="Bottom document creation bar"
      className="fixed bottom-14 md:bottom-5 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-xl animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/90 shadow-2xl rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-2 ring-1 ring-white/10">
        
        {/* Left Label / Badge */}
        <div className="hidden sm:flex items-center gap-2 pl-2 text-slate-300">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <span>Create</span>
            </div>
            <div className="text-[9px] text-slate-400">Quick Actions</div>
          </div>
        </div>

        {/* 3 Dedicated Creation Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
          
          {/* Button 1: Tax Invoice */}
          <button
            type="button"
            disabled={isAuditor}
            onClick={() => onCreateDocument('invoice')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              isAuditor
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-indigo-600/30 hover:scale-[1.02]'
            }`}
            title={isAuditor ? 'Auditor role is read-only' : 'Create new GST / Tax Invoice'}
          >
            <FileText className="w-4 h-4 shrink-0 text-indigo-200" />
            <span className="truncate">Invoice</span>
          </button>

          {/* Button 2: Proforma Invoice */}
          <button
            type="button"
            disabled={isAuditor}
            onClick={() => onCreateDocument('proforma')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              isAuditor
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white shadow-amber-600/30 hover:scale-[1.02]'
            }`}
            title={isAuditor ? 'Auditor role is read-only' : 'Create new Proforma Invoice / Quotation'}
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0 text-amber-200" />
            <span className="truncate">Proforma</span>
          </button>

          {/* Button 3: Delivery Challan */}
          <button
            type="button"
            disabled={isAuditor}
            onClick={() => onCreateDocument('challan')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              isAuditor
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white shadow-teal-600/30 hover:scale-[1.02]'
            }`}
            title={isAuditor ? 'Auditor role is read-only' : 'Create new Delivery Challan / Dispatch Note'}
          >
            <Truck className="w-4 h-4 shrink-0 text-teal-200" />
            <span className="truncate">Challan</span>
          </button>

        </div>

        {/* Auditor Notice if applicable */}
        {isAuditor && (
          <div className="hidden lg:flex items-center gap-1 text-[10px] text-amber-400 px-2 py-1 bg-amber-950/40 rounded border border-amber-800/50">
            <ShieldAlert className="w-3 h-3" />
            <span>Auditor (Read-Only)</span>
          </div>
        )}

      </div>
    </aside>
  );
};
