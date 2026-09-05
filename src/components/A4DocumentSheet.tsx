import React from 'react';
import { CompanyProfile, CurrencyConfig, Document, DocumentLayoutTemplate } from '../types';
import {
  DOCUMENT_THEME,
  resolveDocumentTemplateData,
} from '../services/documentTemplate';

interface A4DocumentSheetProps {
  document: Document;
  company: CompanyProfile;
  currencies?: CurrencyConfig[];
  watermarkText?: string;
  copyLabel?: string;
  purposeText?: string;
  layoutTemplate?: DocumentLayoutTemplate;
}

export const A4DocumentSheet: React.FC<A4DocumentSheetProps> = ({
  document: doc,
  company,
  currencies = [],
  watermarkText,
  copyLabel,
  purposeText,
  layoutTemplate,
}) => {
  const t = resolveDocumentTemplateData(doc, company, currencies, {
    watermarkText,
    copyLabel,
    purposeText,
    layoutTemplate,
  });

  const { colors, fonts } = DOCUMENT_THEME;
  const layout = t.layoutTemplate || 'modern';

  return (
    <div
      id="a4-printable-sheet"
      className={`a4-sheet-container w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white text-slate-900 shadow-xl border ${colors.borderSubtle.tailwindBorder} p-8 sm:p-10 relative ${layout === 'classic' ? 'font-serif' : fonts.webFont} text-xs box-border print:border-none print:shadow-none print:p-6 print:w-[210mm] print:max-w-[210mm] print:m-0 print:box-border`}
      style={{
        boxSizing: 'border-box',
      }}
    >
      {/* Subtle Background Watermark */}
      <div
        className="pointer-events-none select-none absolute inset-0 flex items-center justify-center opacity-[0.04] z-0 overflow-hidden"
        aria-hidden="true"
      >
        <span className="text-slate-900 font-black text-8xl md:text-9xl uppercase tracking-widest rotate-[-30deg]">
          {t.config.watermarkText}
        </span>
      </div>

      <div className="relative z-10 flex flex-col justify-between flex-1 min-h-0">
        {/* TOP SECTION */}
        <div>
          {/* Top Document Category & Title Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <div className={`text-[11px] font-bold ${layout === 'classic' ? 'text-slate-900 uppercase tracking-widest' : layout === 'minimalist' ? 'text-slate-400 tracking-wider uppercase' : `${colors.primary.tailwindText} tracking-wider uppercase`}`}>
                {t.config.divisionText}
              </div>
              <h1 className={`text-2xl font-black text-slate-950 tracking-tight leading-none mt-0.5 ${layout === 'classic' ? 'uppercase font-serif tracking-normal' : ''}`}>
                {t.config.documentTitle}
              </h1>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                {t.config.subtitleText}
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {t.config.defaultCopyLabel}
              </div>
              <div className="text-[11.5px] text-slate-800 mt-0.5">
                <span className="text-slate-500 font-medium">Purpose: </span>
                <strong className="font-bold text-slate-950">{t.config.defaultPurpose}</strong>
              </div>
            </div>
          </div>

          {/* Divider between banner and company header */}
          {layout === 'classic' ? (
            <div className="my-2.5">
              <div className="h-[2px] bg-slate-950 w-full" />
              <div className="h-[1px] bg-slate-950 w-full mt-[1.5px]" />
            </div>
          ) : layout === 'minimalist' ? (
            <div className="h-[1px] bg-slate-200 w-full mt-2 mb-3" />
          ) : (
            <div className="h-[2.5px] bg-slate-950 w-full mt-2 mb-3" />
          )}

          {/* Company Profile Header */}
          <div className="space-y-1">
            <div className="flex items-start gap-3">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className={`w-10 h-10 object-contain ${layout === 'classic' ? 'rounded-none' : 'rounded'} border border-slate-200 p-0.5 shrink-0 bg-white`}
                />
              ) : (
                <div className={`w-10 h-10 ${layout === 'classic' ? 'rounded-none' : 'rounded'} border border-amber-300 bg-amber-50 text-amber-500 font-bold text-lg flex items-center justify-center shrink-0`}>
                  {t.monogram}
                </div>
              )}

              <div>
                <h2 className="text-base font-black text-slate-950 leading-tight">
                  {company.name || 'Sutraa Creations Private Limited'}
                </h2>
                <div className="text-[11px] text-slate-600 font-medium">
                  {company.name || 'Sutraa Creations Private Limited'}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-700 leading-snug pt-1">
              <div>
                <strong className="font-semibold text-slate-900">Regd. Office:</strong>{' '}
                {company.address || 'B-4, Ashok Guruprasad CHS Hanuman Road'},{' '}
                {company.city || 'Vileparle East, Mumbai - 400057, Maharashtra'}
              </div>

              <div className="flex flex-wrap gap-x-4 pt-0.5">
                <span>
                  <strong className="font-semibold text-slate-900">GSTIN:</strong>{' '}
                  <span className={fonts.monoFont}>{company.taxId || '27AAGCS6232B1ZM'}</span>
                </span>
                <span>
                  <strong className="font-semibold text-slate-900">PAN:</strong>{' '}
                  <span className={fonts.monoFont}>{t.panStr}</span>
                </span>
                <span>
                  <strong className="font-semibold text-slate-900">CIN:</strong>{' '}
                  <span className={fonts.monoFont}>{company.cin || 'U18109MH2020PTC345678'}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 text-slate-700 pt-0.5">
                <span>
                  <strong className="font-semibold text-slate-900">Phone:</strong>{' '}
                  {company.phone || '+917840069490'}
                </span>
                <span>•</span>
                <span>
                  <strong className="font-semibold text-slate-900">Email:</strong>{' '}
                  {company.email || 'sunil@sutraa.in'}
                </span>
                <span>•</span>
                <span>
                  <strong className="font-semibold text-slate-900">State:</strong>{' '}
                  {t.consignorState.name} ({t.consignorState.code})
                </span>
              </div>
            </div>
          </div>

          {/* Thin separator line */}
          <div className="h-[1px] bg-slate-200 w-full my-2.5" />

          {/* 4-Column Metadata Info Strip */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] ${
            layout === 'classic'
              ? 'border-y border-slate-400 py-2 bg-slate-100/70'
              : layout === 'minimalist'
              ? 'border-y border-slate-200 py-2'
              : 'border border-slate-200 rounded-lg p-2.5 bg-slate-50'
          }`}>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t.config.col1Label}
              </div>
              <div className={`font-bold text-slate-950 ${fonts.monoFont} mt-0.5`}>
                {doc.documentNumber || 'SCPL/26-27/DC-0004'}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t.config.col2Label}
              </div>
              <div className="font-semibold text-slate-900 mt-0.5">
                {t.formattedDateTime}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t.config.col3Label}
              </div>
              <div className="font-semibold text-slate-900 mt-0.5">
                {doc.type === 'challan'
                  ? doc.challanDetails?.deliveryNote || 'N/A'
                  : doc.dueDate || doc.date || 'N/A'}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t.config.col4Label}
              </div>
              <div className="font-semibold text-slate-900 mt-0.5">
                {doc.challanDetails?.vehicleNo || 'N/A'}
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-transparent w-full my-2" />

          {/* Row 1: Seller / Consignor (Dispatch Location) & Buyer (Billed To) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2.5">
            {/* Seller / Consignor Card */}
            <div className={`${
              layout === 'classic'
                ? 'border border-slate-400 rounded-none p-2.5 bg-white text-[11px] space-y-1 min-h-[112px] flex flex-col justify-between'
                : layout === 'minimalist'
                ? 'border-t border-slate-300 pt-2 bg-transparent text-[11px] space-y-1 min-h-[105px] flex flex-col justify-between'
                : `border ${colors.borderStandard.tailwindBorder} rounded-lg p-2.5 bg-white text-[11px] space-y-1 shadow-2xs min-h-[112px] flex flex-col justify-between`
            }`}>
              <div className="space-y-1">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-[10px] font-bold text-slate-700">
                  <span className="uppercase tracking-wider">
                    {t.config.sellerCardTitle}
                  </span>
                  <span className={`${fonts.monoFont} text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[9.5px]`}>
                    STATE: {t.consignorState.code}
                  </span>
                </div>

                <div className="font-bold text-slate-950 text-[11.5px] pt-0.5">
                  {t.sellerTitle}
                </div>

                <div className="text-slate-600 leading-snug whitespace-pre-line break-words">
                  {t.sellerAddr}
                </div>
                <div className="text-slate-600 font-medium">
                  {t.sellerCity}
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-100 space-y-0.5 text-[10.5px]">
                <div className="text-slate-900">
                  <strong className="font-semibold text-slate-700">GSTIN:</strong>{' '}
                  <span className={fonts.monoFont}>{t.sellerGstin}</span>
                </div>
                <div className="text-slate-700">
                  <strong className="font-semibold">Contact:</strong> {t.sellerContact}
                </div>
              </div>
            </div>

            {/* Buyer (Billed To) Card */}
            <div className={`${
              layout === 'classic'
                ? 'border border-slate-400 rounded-none p-2.5 bg-white text-[11px] space-y-1 min-h-[112px] flex flex-col justify-between'
                : layout === 'minimalist'
                ? 'border-t border-slate-300 pt-2 bg-transparent text-[11px] space-y-1 min-h-[105px] flex flex-col justify-between'
                : `border ${colors.borderStandard.tailwindBorder} rounded-lg p-2.5 bg-white text-[11px] space-y-1 shadow-2xs min-h-[112px] flex flex-col justify-between`
            }`}>
              <div className="space-y-1">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-[10px] font-bold text-slate-700">
                  <span className="uppercase tracking-wider">
                    {t.config.buyerCardTitle}
                  </span>
                  <span className={`${fonts.monoFont} text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[9.5px]`}>
                    STATE: {t.billedToState.code}
                  </span>
                </div>

                <div className="font-bold text-slate-950 text-[11.5px] pt-0.5">
                  {t.buyerTitle}
                </div>

                <div className="text-slate-600 leading-snug whitespace-pre-line break-words">
                  {t.buyerAddr}
                </div>
                <div className="text-slate-600 font-medium">
                  {t.buyerCity}
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-100 space-y-0.5 text-[10.5px]">
                <div className="text-slate-900">
                  <strong className="font-semibold text-slate-700">GSTIN:</strong>{' '}
                  <span className={fonts.monoFont}>{t.buyerGstin}</span>
                </div>
                <div className="text-slate-700 flex justify-between items-center">
                  <div>
                    <strong className="font-semibold">Place of Supply:</strong>{' '}
                    <span>{t.buyerPlaceOfSupply}</span>
                  </div>
                  {t.buyerContact && (
                    <span className="text-slate-500 text-[10px]">{t.buyerContact}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Consignee (Shipped To) & Transport / Logistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {/* Consignee (Shipped To) Card - Large, spacious box for complete address */}
            <div className={`${
              layout === 'classic'
                ? 'border border-slate-400 rounded-none p-2.5 bg-white text-[11px] space-y-1 min-h-[112px] flex flex-col justify-between'
                : layout === 'minimalist'
                ? 'border-t border-slate-300 pt-2 bg-transparent text-[11px] space-y-1 min-h-[105px] flex flex-col justify-between'
                : `border ${colors.borderStandard.tailwindBorder} rounded-lg p-2.5 bg-white text-[11px] space-y-1 shadow-2xs min-h-[112px] flex flex-col justify-between`
            }`}>
              <div className="space-y-1">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-[10px] font-bold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className="uppercase tracking-wider">
                      {t.config.shipToCardTitle}
                    </span>
                    {t.hasDistinctShipTo && (
                      <span className="text-[9px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 rounded">
                        Distinct Site
                      </span>
                    )}
                  </div>
                  <span className={`${fonts.monoFont} text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[9.5px]`}>
                    STATE: {t.shipToState.code}
                  </span>
                </div>

                <div className="font-bold text-slate-950 text-[11.5px] pt-0.5">
                  {t.shipToTitle}
                </div>

                <div className="text-slate-600 leading-snug whitespace-pre-line break-words">
                  {t.shipToAddr}
                </div>
                <div className="text-slate-600 font-medium">
                  {t.shipToCity}
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-100 space-y-0.5 text-[10.5px]">
                <div className="text-slate-900">
                  <strong className="font-semibold text-slate-700">GSTIN:</strong>{' '}
                  <span className={fonts.monoFont}>{t.shipToGstin}</span>
                </div>
                <div className="text-slate-700 flex justify-between items-center">
                  <div>
                    <strong className="font-semibold">Delivery State:</strong>{' '}
                    <span>{t.shipToPlaceOfSupply}</span>
                  </div>
                  {t.shipToContact && (
                    <span className="text-slate-500 text-[10px]">{t.shipToContact}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Transport / Logistics & Dispatch Details Card */}
            <div className={`${
              layout === 'classic'
                ? 'border border-slate-400 rounded-none p-2.5 bg-slate-50/70 text-[10.5px] space-y-1.5 min-h-[112px] flex flex-col justify-between'
                : layout === 'minimalist'
                ? 'border-t border-slate-300 pt-2 bg-transparent text-[10.5px] space-y-1.5 min-h-[105px] flex flex-col justify-between'
                : `border ${colors.borderStandard.tailwindBorder} rounded-lg p-2.5 bg-slate-50/60 text-[10.5px] space-y-1.5 shadow-2xs min-h-[112px] flex flex-col justify-between`
            }`}>
              <div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-[10px] font-bold text-slate-700">
                  <span className="uppercase tracking-wider">
                    {t.config.transportCardTitle}
                  </span>
                  <span className="text-[9.5px] text-slate-600 font-medium">
                    PURPOSE: {t.config.defaultPurpose}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1.5">
                  <div>
                    <span className="text-slate-500 block text-[9.5px] uppercase">Transport Mode</span>
                    <strong className="font-semibold text-slate-900 text-[11px]">{t.transportMode}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9.5px] uppercase">Vehicle Number</span>
                    <strong className={`${fonts.monoFont} font-semibold text-slate-900 text-[11px]`}>
                      {doc.challanDetails?.vehicleNo || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9.5px] uppercase">Transporter / Note</span>
                    <span className="font-medium text-slate-800 text-[10.5px] truncate block">
                      {t.transporterName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9.5px] uppercase">LR / GR / Tracking</span>
                    <span className={`${fonts.monoFont} font-medium text-slate-800 text-[10.5px]`}>
                      {t.lrGrText}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-600">
                <span><strong>Date & Time:</strong> {t.formattedDateTime}</span>
                <span><strong>Handling:</strong> {t.driverText}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className={`${
            layout === 'classic'
              ? 'border border-slate-400 rounded-none overflow-hidden bg-white mb-3'
              : layout === 'minimalist'
              ? 'overflow-hidden bg-transparent mb-3'
              : `border ${colors.borderStandard.tailwindBorder} rounded-lg overflow-hidden bg-white mb-3`
          }`}>
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className={`${
                  layout === 'classic'
                    ? 'border-b-2 border-slate-400 bg-slate-100 text-[10px] font-bold text-slate-900'
                    : layout === 'minimalist'
                    ? 'border-b border-slate-950 text-[10px] font-bold text-slate-900'
                    : 'border-b border-slate-300 bg-slate-50/70 text-[10px] font-bold text-slate-800'
                }`}>
                  {t.tableColumns.map((col) => (
                    <th
                      key={col.key}
                      className={`py-2 px-2 ${col.tailwindAlignClass} ${col.tailwindWidthClass} ${
                        layout === 'minimalist'
                          ? ''
                          : 'border-r last:border-r-0 border-slate-300'
                      }`}
                    >
                      {col.key === 'rate'
                        ? `Rate (${t.currencySymbol})`
                        : col.key === 'taxval'
                        ? `Taxable Val (${t.currencySymbol})`
                        : col.key === 'tax'
                        ? `${col.title} (${t.currencySymbol})`
                        : col.key === 'total'
                        ? `Total (${t.currencySymbol})`
                        : col.title}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className={layout === 'minimalist' ? 'divide-y divide-slate-100' : 'divide-y divide-slate-200'}>
                {doc.items.length === 0 ? (
                  <tr>
                    <td colSpan={t.tableColumns.length} className="py-6 text-center text-slate-400">
                      No items added to document.
                    </td>
                  </tr>
                ) : (
                  doc.items.map((item, idx) => (
                    <tr key={item.id || idx} className={layout === 'minimalist' ? 'hover:bg-slate-50/30' : 'hover:bg-slate-50/50'}>
                      <td className={`py-2.5 px-2 text-center text-slate-600 ${layout !== 'minimalist' ? 'border-r border-slate-200' : ''}`}>
                        {idx + 1}
                      </td>

                      <td className={`py-2.5 px-3 ${layout !== 'minimalist' ? 'border-r border-slate-200' : ''}`}>
                        <div className="font-bold text-slate-900">{item.description}</div>
                        {item.hsnCode && (
                          <div className={`text-[9.5px] ${fonts.monoFont} text-slate-500 mt-0.5`}>
                            HSN: {item.hsnCode}
                          </div>
                        )}
                      </td>

                      <td className={`py-2.5 px-2 text-center ${fonts.monoFont} text-slate-700 ${layout !== 'minimalist' ? 'border-r border-slate-200' : ''}`}>
                        {item.hsnCode || '-'}
                      </td>

                      <td className={`py-2.5 px-2 text-center font-semibold text-slate-900 ${layout !== 'minimalist' ? 'border-r border-slate-200' : ''}`}>
                        {item.quantity}
                      </td>

                      <td className={`py-2.5 px-2 text-center uppercase text-slate-600 font-medium ${layout !== 'minimalist' ? 'border-r border-slate-200' : ''}`}>
                        {item.unit || 'PCS'}
                      </td>

                      <td className={`py-2.5 px-2 text-right ${fonts.monoFont} text-slate-700 ${layout !== 'minimalist' ? 'border-r border-slate-200' : ''}`}>
                        {t.currencySymbol} {item.unitPrice.toFixed(2)}
                      </td>

                      <td className={`py-2.5 px-2 text-right ${fonts.monoFont} font-semibold text-slate-900 ${layout !== 'minimalist' ? 'border-r border-slate-200' : ''}`}>
                        {t.currencySymbol} {item.amount.toFixed(2)}
                      </td>

                      <td className={`py-2.5 px-2 text-right ${fonts.monoFont} text-slate-700 ${layout !== 'minimalist' ? 'border-r border-slate-200' : ''}`}>
                        {t.currencySymbol} {item.taxAmount.toFixed(2)}{' '}
                        <span className="text-[9.5px] text-slate-500">({item.taxRate}%)</span>
                      </td>

                      <td className={`py-2.5 px-2 text-right ${fonts.monoFont} font-bold text-slate-950`}>
                        {t.currencySymbol} {item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}

                {/* Subtotal row */}
                <tr className={`${
                  layout === 'classic'
                    ? 'border-t-2 border-slate-400 bg-slate-100 font-bold text-[11px] text-slate-900'
                    : layout === 'minimalist'
                    ? 'border-t-2 border-slate-950 font-bold text-[11px] text-slate-900'
                    : 'border-t-2 border-slate-300 bg-slate-50 font-bold text-[11px] text-slate-900'
                }`}>
                  <td colSpan={5} className={`py-2 px-3 text-right uppercase tracking-wider ${layout !== 'minimalist' ? 'border-r border-slate-300' : ''}`}>
                    Sub Total
                  </td>
                  <td className={layout !== 'minimalist' ? 'border-r border-slate-300' : ''}></td>
                  <td className={`py-2 px-2 text-right ${fonts.monoFont} font-bold text-slate-950 ${layout !== 'minimalist' ? 'border-r border-slate-300' : ''}`}>
                    {t.currencySymbol} {doc.subtotal.toFixed(2)}
                  </td>
                  <td className={`py-2 px-2 text-right ${fonts.monoFont} font-bold text-slate-950 ${layout !== 'minimalist' ? 'border-r border-slate-300' : ''}`}>
                    {t.currencySymbol} {doc.taxAmount.toFixed(2)}
                  </td>
                  <td className={`py-2 px-2 text-right ${fonts.monoFont} font-bold text-slate-950`}>
                    {t.currencySymbol} {doc.grandTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Items & Quantity Strip */}
          <div className={`${
            layout === 'classic'
              ? 'border border-slate-400 rounded-none px-3 py-1.5 bg-slate-50 text-[10.5px] text-slate-700 font-semibold mb-3'
              : layout === 'minimalist'
              ? 'border-y border-slate-200 px-1 py-1 text-[10.5px] text-slate-700 font-medium mb-3'
              : `border ${colors.borderStandard.tailwindBorder} rounded-lg px-3 py-1.5 bg-slate-50 text-[10.5px] text-slate-700 font-semibold mb-3 shadow-2xs`
          }`}>
            <span>TOTAL ITEMS: {doc.items.length}</span>
            <span className="mx-3 text-slate-300">|</span>
            <span>TOTAL QUANTITY: {t.totalQuantity} {doc.items[0]?.unit || 'PCS'}</span>
            <span className="mx-3 text-slate-300">|</span>
            <span className="text-slate-800">{t.isInterState ? 'INTER-STATE SUPPLY (IGST)' : 'INTRA-STATE SUPPLY (CGST + SGST)'}</span>
          </div>

          {/* Amount In Words & Financial Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 my-3">
            {/* Left 7 Columns: Words, Purpose & Bank */}
            <div className="sm:col-span-7 space-y-3">
              <div>
                <div className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">
                  AMOUNT CHARGEABLE IN WORDS:
                </div>
                <div className="font-bold italic text-[11.5px] text-slate-800 mt-0.5">
                  {t.amountInWords}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">
                  PURPOSE OF DISPATCH / REMARKS:
                </div>
                <div className="text-[11px] text-slate-700 mt-0.5 leading-relaxed">
                  {t.remarksText}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">
                  BANK ACCOUNT & PAYMENT DETAILS:
                </div>
                <div className="text-[10.5px] text-slate-700 mt-0.5 space-y-0.5">
                  {company.bankDetails?.bankName ? (
                    <>
                      <div>
                        <strong className="font-semibold text-slate-900">Bank:</strong> {company.bankDetails.bankName} (A/C: {company.bankDetails.accountNumber || 'N/A'})
                      </div>
                      <div>
                        <strong className="font-semibold text-slate-900">IFSC:</strong> {company.bankDetails.ifscSwift || 'N/A'}{' '}
                        {company.bankDetails.branch && `• Branch: ${company.bankDetails.branch}`}
                        {company.bankDetails.upiId && ` • UPI: ${company.bankDetails.upiId}`}
                      </div>
                    </>
                  ) : (
                    <div>Direct Electronic Wire / NEFT / RTGS / UPI Transfer Available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Totals Box */}
            <div className={`${
              layout === 'classic'
                ? 'sm:col-span-5 bg-white rounded-none p-2 space-y-1.5 text-[11px] border border-slate-400'
                : layout === 'minimalist'
                ? 'sm:col-span-5 bg-transparent p-1 space-y-1.5 text-[11px] border-l border-slate-200 pl-4'
                : 'sm:col-span-5 bg-white rounded-lg p-2 space-y-1.5 text-[11px] border border-slate-200'
            }`}>
              <div className="flex justify-between text-slate-700">
                <span>Total Taxable Value:</span>
                <span className={`${fonts.monoFont} font-semibold text-slate-900`}>
                  {t.currencySymbol} {doc.subtotal.toFixed(2)}
                </span>
              </div>

              {t.isInterState ? (
                <div className="flex justify-between text-slate-700">
                  <span>Total IGST ({doc.taxRate}%):</span>
                  <span className={`${fonts.monoFont} font-semibold text-slate-900`}>
                    {t.currencySymbol} {doc.taxAmount.toFixed(2)}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-slate-700">
                    <span>Total CGST ({t.halfRate}%):</span>
                    <span className={`${fonts.monoFont} font-semibold text-slate-900`}>
                      {t.currencySymbol} {t.cgstVal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Total SGST ({t.halfRate}%):</span>
                    <span className={`${fonts.monoFont} font-semibold text-slate-900`}>
                      {t.currencySymbol} {t.sgstVal.toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              {doc.shippingCharges > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Shipping & Handling:</span>
                  <span className={`${fonts.monoFont} font-semibold text-slate-900`}>
                    {t.currencySymbol} {doc.shippingCharges.toFixed(2)}
                  </span>
                </div>
              )}

              <div className={`flex justify-between items-center text-sm font-bold text-slate-950 ${
                layout === 'classic'
                  ? 'border-y-2 border-slate-950 py-1.5 mt-1 bg-slate-100 px-1'
                  : layout === 'minimalist'
                  ? 'border-t-2 border-slate-950 pt-2 mt-1 px-0'
                  : 'border-t-2 border-b-2 border-slate-950 py-1.5 mt-1 bg-slate-100/70 px-1'
              }`}>
                <span>Grand Total:</span>
                <span className={`${fonts.monoFont} text-base`}>{t.currencySymbol} {doc.grandTotal.toFixed(2)}</span>
              </div>

              {doc.paidAmount > 0 && (
                <>
                  <div className="flex justify-between text-emerald-600 pt-1">
                    <span>Paid Amount:</span>
                    <span className={`${fonts.monoFont} font-semibold`}>
                      {t.currencySymbol} {doc.paidAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Balance Due:</span>
                    <span className={`${fonts.monoFont}`}>
                      {t.currencySymbol} {Math.max(0, doc.grandTotal - doc.paidAmount).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Declarations, Terms & Signatures Box */}
          <div className={`${
            layout === 'classic'
              ? 'border border-slate-400 rounded-none p-3 bg-white grid grid-cols-1 sm:grid-cols-12 gap-4'
              : layout === 'minimalist'
              ? 'border-t border-slate-200 pt-3 bg-transparent grid grid-cols-1 sm:grid-cols-12 gap-4'
              : 'border border-slate-300 rounded-lg p-3 bg-white grid grid-cols-1 sm:grid-cols-12 gap-4 shadow-2xs'
          }`}>
            {/* Terms & Certification (7 Columns) */}
            <div className="sm:col-span-7 space-y-2 border-b sm:border-b-0 sm:border-r border-slate-200 pb-3 sm:pb-0 sm:pr-3">
              <div>
                <div className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">
                  DECLARATION & TERMS:
                </div>
                <p className="text-[10px] italic text-slate-600 leading-tight mt-0.5">
                  {t.config.legalDeclaration}
                </p>
              </div>

              <div className="text-[10px] text-slate-600 space-y-0.5">
                <div>• All matters are subject to {company.city || 'Mumbai'} Jurisdiction</div>
              </div>
            </div>

            {/* Authorized Signatory Block (5 Columns) */}
            <div className="sm:col-span-5 flex flex-col justify-between text-right pl-0 sm:pl-2">
              <div>
                <div className="text-[10.5px] font-bold text-slate-950 uppercase tracking-tight">
                  FOR {company.name || 'SUTRAA CREATIONS PRIVATE LIMITED'}
                </div>
                <div className="text-[9.5px] text-slate-500 font-medium">
                  Authorized Signatory
                </div>
              </div>

              {/* Signatures Dual Lines */}
              <div className="pt-3 flex justify-between items-end gap-3 text-center text-[9.5px] text-slate-600">
                <div className="flex-1">
                  <div className="h-10 flex items-end justify-center pb-1">
                    <span className="text-[9px] text-slate-400 italic">Signature of Goods Receiver</span>
                  </div>
                  <div className="border-t border-slate-400 pt-1 text-slate-700">
                    Receiver's Signature
                  </div>
                </div>

                <div className="flex-1 relative flex flex-col items-center">
                  <div className="h-10 relative flex items-center justify-center w-full">
                    {/* Official Stamp */}
                    {doc.includeStamp !== false && (doc.stampUrl || company.stampUrl) && (
                      <img
                        src={doc.stampUrl || company.stampUrl}
                        alt="Company Stamp"
                        className="h-12 w-12 object-contain opacity-85 absolute -left-2 -top-1 pointer-events-none z-0"
                      />
                    )}
                    {/* Authorized Signature */}
                    {doc.includeSignature !== false && (doc.signatureUrl || company.signatureUrl) ? (
                      <img
                        src={doc.signatureUrl || company.signatureUrl}
                        alt="Signature"
                        className="h-9 max-w-[110px] object-contain relative z-10"
                      />
                    ) : (
                      <div className="font-semibold text-slate-900 text-[10px]">
                        {t.signatoryName}
                      </div>
                    )}
                  </div>
                  <div className="w-full border-t border-slate-400 pt-1 text-slate-700">
                    Authorized Signatory
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-Most Computer Generated Notice */}
        <div className="text-center text-[9.5px] text-slate-500 pt-4 pb-1">
          {t.config.footerNotice}
        </div>
      </div>
    </div>
  );
};
