import React, { useState } from 'react';
import { CompanyProfile, CurrencyConfig, Document } from '../types';
import { formatCurrency } from '../services/pdfGenerator';
import { MessageSquare, Mail, Copy, Check, Send, X, Clock, AlertTriangle } from 'lucide-react';

interface ReminderModalProps {
  document: Document;
  company: CompanyProfile;
  currencies: CurrencyConfig[];
  onClose: () => void;
  onReminderSent: (docId: string, reminder: { channel: 'whatsapp' | 'email'; templateName: string; sentTo: string }) => void;
}

const TEMPLATES = [
  {
    id: 'friendly_due',
    name: 'Gentle Payment Due Reminder',
    tone: 'Friendly',
    subject: (doc: Document) => `Payment Reminder: ${doc.documentNumber} is due soon`,
    body: (doc: Document, company: CompanyProfile, currencies: CurrencyConfig[]) => {
      const balance = doc.grandTotal - doc.paidAmount;
      return `Dear ${doc.clientName},\n\nThis is a friendly reminder that invoice ${doc.documentNumber} for ${formatCurrency(balance, doc.currency, currencies)} from ${company.name} is due on ${doc.dueDate}.\n\nPlease ensure the payment is processed at your earliest convenience. Bank details:\nBank: ${company.bankDetails.bankName}\nA/C: ${company.bankDetails.accountNumber}\nIFSC/SWIFT: ${company.bankDetails.ifscSwift}\n\nThank you for your business!\n\nBest regards,\n${company.name}\n${company.phone}`;
    },
  },
  {
    id: 'overdue_firm',
    name: 'Overdue Notice (Firm)',
    tone: 'Important',
    subject: (doc: Document) => `OVERDUE NOTICE: Invoice ${doc.documentNumber}`,
    body: (doc: Document, company: CompanyProfile, currencies: CurrencyConfig[]) => {
      const balance = doc.grandTotal - doc.paidAmount;
      return `Dear ${doc.clientName},\n\nWe noticed that payment for invoice ${doc.documentNumber} for ${formatCurrency(balance, doc.currency, currencies)} was due on ${doc.dueDate} and is currently outstanding.\n\nKindly process the remittance today to keep your account in good standing. If payment has already been sent, please share the transaction reference with us.\n\nBank: ${company.bankDetails.bankName}\nA/C No: ${company.bankDetails.accountNumber}\nUPI ID: ${company.bankDetails.upiId}\n\nRegards,\nFinance Team, ${company.name}`;
    },
  },
  {
    id: 'urgent_final',
    name: 'Final Overdue Escalation',
    tone: 'Urgent',
    subject: (doc: Document) => `URGENT: Final Reminder for Invoice ${doc.documentNumber}`,
    body: (doc: Document, company: CompanyProfile, currencies: CurrencyConfig[]) => {
      const balance = doc.grandTotal - doc.paidAmount;
      return `Attention: Accounts Payable / ${doc.clientName},\n\nThis is a final reminder regarding unpaid invoice ${doc.documentNumber} (${formatCurrency(balance, doc.currency, currencies)}), which has exceeded its scheduled terms since ${doc.dueDate}.\n\nPlease remit the payment immediately to avoid suspension of ongoing services and potential late financing fees.\n\nImmediate Payment Details:\nAccount: ${company.bankDetails.accountNumber} (${company.bankDetails.bankName})\nSWIFT: ${company.bankDetails.ifscSwift}\n\nSincerely,\n${company.name} Accounts Department`;
    },
  },
  {
    id: 'receipt_ack',
    name: 'Payment Receipt Acknowledgement',
    tone: 'Positive',
    subject: (doc: Document) => `Payment Received: Invoice ${doc.documentNumber} Thank You`,
    body: (doc: Document, company: CompanyProfile, currencies: CurrencyConfig[]) => {
      return `Dear ${doc.clientName},\n\nThank you! We have successfully received your payment of ${formatCurrency(doc.paidAmount, doc.currency, currencies)} for invoice ${doc.documentNumber}.\n\nWe appreciate your prompt settlement and look forward to our continued collaboration.\n\nWarm regards,\n${company.name}`;
    },
  },
];

export const ReminderModal: React.FC<ReminderModalProps> = ({
  document: doc,
  company,
  currencies,
  onClose,
  onReminderSent,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    doc.status === 'overdue' ? 'overdue_firm' : doc.status === 'paid' ? 'receipt_ack' : 'friendly_due'
  );
  const [copied, setCopied] = useState(false);

  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];
  const subject = currentTemplate.subject(doc);
  const body = currentTemplate.body(doc, company, currencies);

  const balanceDue = Math.max(0, doc.grandTotal - doc.paidAmount);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(doc.clientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    onReminderSent(doc.id, {
      channel: 'email',
      templateName: currentTemplate.name,
      sentTo: doc.clientEmail,
    });
  };

  const handleSendWhatsApp = () => {
    // Clean phone number
    const cleanPhone = (doc.clientPhone || '').replace(/[^0-9]/g, '');
    const waText = encodeURIComponent(`*${subject}*\n\n${body}`);
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : `https://wa.me/?text=${waText}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    onReminderSent(doc.id, {
      channel: 'whatsapp',
      templateName: currentTemplate.name,
      sentTo: doc.clientPhone || 'WhatsApp Contact',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Send className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Send Payment Reminder</h3>
              <p className="text-xs text-slate-300">
                {doc.documentNumber} • {doc.clientCompany || doc.clientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Quick Summary Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <span className="text-slate-500">Amount Due: </span>
              <span className="font-bold text-slate-900">{formatCurrency(balanceDue, doc.currency, currencies)}</span>
            </div>
            <div>
              <span className="text-slate-500">Due Date: </span>
              <span className="font-medium text-slate-800">{doc.dueDate}</span>
            </div>
            <div>
              <span className="text-slate-500">Status: </span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                doc.status === 'overdue' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {doc.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Reminder Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                  type="button"
                  className={`p-3 text-left border rounded-lg transition-all text-xs ${
                    selectedTemplateId === tmpl.id
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>{tmpl.name}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">{tmpl.tone}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Message Preview
              </label>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Message'}
              </button>
            </div>
            <div className="p-3.5 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono space-y-2 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              <div className="text-slate-400 font-sans border-b border-slate-700 pb-1">
                <strong>Subject:</strong> {subject}
              </div>
              <div>{body}</div>
            </div>
          </div>

          {/* Channel Dispatch Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleSendWhatsApp}
              type="button"
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Send via WhatsApp ({doc.clientPhone || 'Client'})
            </button>

            <button
              onClick={handleSendEmail}
              type="button"
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Mail className="w-4 h-4" />
              Send via Email ({doc.clientEmail})
            </button>
          </div>

          {/* Reminder History */}
          {doc.remindersSent && doc.remindersSent.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Previously sent reminders ({doc.remindersSent.length}):</span>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto text-xs">
                {doc.remindersSent.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-slate-600 bg-slate-50 px-2 py-1 rounded">
                    <span>{r.templateName} via {r.channel.toUpperCase()} to {r.sentTo}</span>
                    <span className="text-[10px] text-slate-400">{new Date(r.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
