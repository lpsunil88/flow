import { jsPDF } from 'jspdf';
import { CompanyProfile, CurrencyConfig, Document, InvoiceTemplate } from '../types';
import { getThemeForDocument, getDesignForDocument } from './themeEngine';

export function getCurrencySymbol(code: string, currencies: CurrencyConfig[]): string {
  const found = currencies?.find((c) => c.code === code);
  return found ? found.symbol : code === 'INR' ? '₹' : code;
}

export function formatCurrency(amount: number, currencyCode: string = 'INR', currencies: CurrencyConfig[] = []): string {
  const code = currencyCode || 'INR';
  const symbol = getCurrencySymbol(code, currencies);
  const locale = code === 'INR' ? 'en-IN' : 'en-US';
  return `${symbol} ${Number(amount || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateDocumentPdf(doc: Document, company: CompanyProfile, currencies: CurrencyConfig[]): jsPDF {
  const defaultCompanyTheme =
    doc.type === 'invoice'
      ? company.invoiceTheme
      : doc.type === 'proforma'
      ? company.proformaTheme
      : company.challanTheme;

  const defaultCompanyDesign =
    doc.type === 'invoice'
      ? company.defaultInvoiceDesign
      : doc.type === 'proforma'
      ? company.defaultProformaDesign
      : company.defaultChallanDesign;

  // Determine active visual template style: 'Modern' | 'Classic' | 'Minimal'
  const templateStyle: InvoiceTemplate =
    doc.invoiceTemplate ||
    doc.template ||
    (doc.designId === 'classic-corporate' || doc.designId === 'tender-formal'
      ? 'Classic'
      : doc.designId === 'modern-minimal' || doc.designId === 'minimal-monochrome'
      ? 'Minimal'
      : company.defaultInvoiceTemplate || 'Modern');

  const isClassic = templateStyle === 'Classic';
  const isMinimal = templateStyle === 'Minimal';
  const isModern = templateStyle === 'Modern';

  const design = getDesignForDocument(
    doc.type,
    doc.designId || doc.theme,
    defaultCompanyDesign,
    defaultCompanyTheme
  );
  const theme = design.theme;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;
  const docFont = isClassic ? 'times' : 'helvetica';

  // 1. Outer Borders: Classic gets official double-line legal frame
  if (isClassic) {
    pdf.setDrawColor(51, 65, 85); // slate-700
    pdf.setLineWidth(0.8);
    pdf.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - margin * 2 + 8, 'S');
    pdf.setLineWidth(0.3);
    pdf.rect(margin - 2.5, margin - 2.5, contentWidth + 5, pageHeight - margin * 2 + 5, 'S');
  } else if (design.layoutType === 'classic-corporate' || design.layoutType === 'tender-formal') {
    pdf.setDrawColor(71, 85, 105);
    pdf.setLineWidth(0.6);
    pdf.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - margin * 2 + 8, 'S');
  }

  // 2. Header Banner Background
  if (isModern || design.layoutType === 'executive-split') {
    // Solid bold top header banner
    pdf.setFillColor(theme.primaryColor[0], theme.primaryColor[1], theme.primaryColor[2]);
    pdf.rect(margin, y, contentWidth, 38, 'F');
  } else if (isMinimal) {
    // Pure clean minimal canvas with subtle separator line
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, y, contentWidth, 36, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.4);
    pdf.line(margin, y + 36, margin + contentWidth, y + 36);
  } else if (isClassic) {
    // Formal corporate letterhead header
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, y, contentWidth, 36, 'F');
    pdf.setDrawColor(71, 85, 105);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, y, contentWidth, 36, 'S');
  } else {
    pdf.setFillColor(theme.headerBg[0], theme.headerBg[1], theme.headerBg[2]);
    pdf.rect(margin, y, contentWidth, 36, 'F');
    pdf.setDrawColor(theme.primaryColor[0], theme.primaryColor[1], theme.primaryColor[2]);
    pdf.setLineWidth(0.4);
    pdf.rect(margin, y, contentWidth, 36, 'S');
  }

  let textX = margin + 5;
  const hasLogo = Boolean(company.logoUrl);

  if (hasLogo) {
    try {
      pdf.addImage(company.logoUrl!, 'JPEG', margin + 4, y + 4, 28, 28);
      textX = margin + 36;
    } catch {
      // Monogram badge
      pdf.setFillColor(
        isModern ? 255 : theme.primaryColor[0],
        isModern ? 255 : theme.primaryColor[1],
        isModern ? 255 : theme.primaryColor[2]
      );
      if (isModern) {
        pdf.roundedRect(margin + 4, y + 4, 28, 28, 2, 2, 'F');
        pdf.setFont(docFont, 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(theme.primaryColor[0], theme.primaryColor[1], theme.primaryColor[2]);
      } else {
        pdf.roundedRect(margin + 4, y + 4, 28, 28, 2, 2, 'F');
        pdf.setFont(docFont, 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(255, 255, 255);
      }
      const initials = company.name.substring(0, 2).toUpperCase();
      pdf.text(initials, margin + 18, y + 21, { align: 'center' });
      textX = margin + 36;
    }
  }

  // Company Name & Info
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(14);
  if (isModern || design.layoutType === 'executive-split') {
    pdf.setTextColor(255, 255, 255);
  } else if (isClassic) {
    pdf.setTextColor(15, 23, 42); // slate-900
  } else {
    pdf.setTextColor(theme.primaryColor[0], theme.primaryColor[1], theme.primaryColor[2]);
  }
  pdf.text(company.name, textX, y + 8);

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(8);
  if (isModern || design.layoutType === 'executive-split') {
    pdf.setTextColor(241, 245, 249);
  } else {
    pdf.setTextColor(71, 85, 105); // slate-600
  }
  const compAddr = `${company.address}, ${company.city}, ${company.country}`;
  pdf.text(compAddr, textX, y + 14);
  pdf.text(`Tax ID / GSTIN: ${company.taxId} | Tel: ${company.phone}`, textX, y + 19);
  pdf.text(`Email: ${company.email} | Web: ${company.website}`, textX, y + 24);

  // Document Type & Number (Right side)
  const docTypeLabel =
    doc.type === 'invoice'
      ? (isClassic ? 'TAX INVOICE (ORIGINAL)' : isMinimal ? 'INVOICE' : 'TAX INVOICE')
      : doc.type === 'proforma'
      ? 'PROFORMA INVOICE'
      : 'DELIVERY CHALLAN';

  // Badge background
  if (isModern || design.layoutType === 'executive-split') {
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(pageWidth - margin - 65, y + 5, 60, 9, 2, 2, 'F');
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(theme.primaryColor[0], theme.primaryColor[1], theme.primaryColor[2]);
    pdf.text(docTypeLabel, pageWidth - margin - 35, y + 11, { align: 'center' });

    pdf.setTextColor(255, 255, 255);
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(11);
    pdf.text(doc.documentNumber, pageWidth - margin - 5, y + 20, { align: 'right' });

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(226, 232, 240);
    pdf.text(`Issue Date: ${doc.date}`, pageWidth - margin - 5, y + 26, { align: 'right' });
    pdf.text(`Due Date: ${doc.dueDate}`, pageWidth - margin - 5, y + 31, { align: 'right' });
  } else if (isMinimal) {
    // Minimal understated right-side header
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(15, 23, 42);
    pdf.text(docTypeLabel, pageWidth - margin - 5, y + 11, { align: 'right' });

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(doc.documentNumber, pageWidth - margin - 5, y + 18, { align: 'right' });

    pdf.setFontSize(8);
    pdf.text(`Date: ${doc.date}`, pageWidth - margin - 5, y + 24, { align: 'right' });
    pdf.text(`Due: ${doc.dueDate}`, pageWidth - margin - 5, y + 29, { align: 'right' });
  } else if (isClassic) {
    // Formal classic badge with border
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(71, 85, 105);
    pdf.setLineWidth(0.4);
    pdf.rect(pageWidth - margin - 65, y + 5, 60, 9, 'FD');
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(docTypeLabel, pageWidth - margin - 35, y + 11, { align: 'center' });

    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(11);
    pdf.text(doc.documentNumber, pageWidth - margin - 5, y + 20, { align: 'right' });

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Date of Issue: ${doc.date}`, pageWidth - margin - 5, y + 26, { align: 'right' });
    pdf.text(`Due Date: ${doc.dueDate}`, pageWidth - margin - 5, y + 31, { align: 'right' });
  } else {
    pdf.setFillColor(theme.badgeBg[0], theme.badgeBg[1], theme.badgeBg[2]);
    pdf.rect(pageWidth - margin - 60, y + 5, 55, 9, 'F');
    pdf.setFont(theme.fontFamily, 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(theme.badgeTextColor[0], theme.badgeTextColor[1], theme.badgeTextColor[2]);
    pdf.text(docTypeLabel, pageWidth - margin - 32.5, y + 11, { align: 'center' });

    pdf.setFont(theme.fontFamily, 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text(doc.documentNumber, pageWidth - margin - 5, y + 20, { align: 'right' });

    pdf.setFont(theme.fontFamily, 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Issue Date: ${doc.date}`, pageWidth - margin - 5, y + 26, { align: 'right' });
    pdf.text(`Due Date: ${doc.dueDate}`, pageWidth - margin - 5, y + 31, { align: 'right' });
  }

  y += 40;

  // Challan Delivery info if challan
  if (doc.type === 'challan' && doc.challanDetails) {
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, y, contentWidth, 14, 'F');
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(51, 65, 85);
    pdf.text('DISPATCH / LOGISTICS DETAILS:', margin + 4, y + 5);

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(8);
    const vehicleText = doc.challanDetails.vehicleNo ? `Vehicle: ${doc.challanDetails.vehicleNo}` : '';
    const modeText = doc.challanDetails.dispatchThrough ? `Dispatch Via: ${doc.challanDetails.dispatchThrough}` : '';
    const returnText = doc.challanDetails.returnable ? 'Type: Returnable Challan' : 'Type: Non-Returnable Challan';
    pdf.text(`${vehicleText}   |   ${modeText}   |   ${returnText}`, margin + 4, y + 10);
    y += 18;
  }

  // Bill To / Client Details Box
  if (isMinimal) {
    // Frameless open whitespace layout for Minimal style
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.text('BILLED TO', margin, y + 5);

    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text(doc.clientCompany || doc.clientName, margin, y + 11);

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Attn: ${doc.clientName}`, margin, y + 16);
    pdf.text(`${doc.clientEmail} • ${doc.clientPhone}`, margin, y + 21);
    pdf.text(doc.clientAddress, margin, y + 26);

    // Right side: Transaction details without borders
    const rightX = margin + contentWidth / 2 + 10;
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text('INVOICE PARTICULARS', rightX, y + 5);

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`GSTIN / Tax ID: ${doc.clientTaxId || 'N/A'}`, rightX, y + 11);
    pdf.text(`Currency: ${doc.currency}`, rightX, y + 16);
    pdf.text(`Payment Status: ${doc.status.toUpperCase()}`, rightX, y + 21);
    pdf.text(`Paid: ${formatCurrency(doc.paidAmount, doc.currency, currencies)}`, rightX, y + 26);

    y += 32;
  } else if (isClassic) {
    // Formal classic boxes with full borders
    pdf.setDrawColor(71, 85, 105);
    pdf.setLineWidth(0.4);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, y, contentWidth / 2 - 2, 30, 'FD');
    pdf.rect(margin + contentWidth / 2 + 2, y, contentWidth / 2 - 2, 30, 'FD');

    // Left: Bill To
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text('BUYER / CONSIGNEE DETAILS:', margin + 4, y + 6);

    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(doc.clientCompany || doc.clientName, margin + 4, y + 12);

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Attn: ${doc.clientName}`, margin + 4, y + 17);
    pdf.text(`Email: ${doc.clientEmail} | Tel: ${doc.clientPhone}`, margin + 4, y + 22);
    pdf.text(`Address: ${doc.clientAddress}`, margin + 4, y + 27);

    // Right: Transaction Details
    const rightX = margin + contentWidth / 2 + 6;
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text('INVOICE / TRANSACTION PARTICULARS:', rightX, y + 6);

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Customer GSTIN / Tax ID: ${doc.clientTaxId || 'N/A'}`, rightX, y + 12);
    pdf.text(`Billing Currency: ${doc.currency}`, rightX, y + 17);
    pdf.text(`Status: ${doc.status.toUpperCase()}`, rightX, y + 22);
    pdf.text(`Amount Paid: ${formatCurrency(doc.paidAmount, doc.currency, currencies)}`, rightX, y + 27);

    y += 34;
  } else {
    // Modern rounded cards
    pdf.setDrawColor(226, 232, 240);
    pdf.setFillColor(250, 250, 250);
    pdf.roundedRect(margin, y, contentWidth / 2 - 2, 30, 2, 2, 'FD');
    pdf.roundedRect(margin + contentWidth / 2 + 2, y, contentWidth / 2 - 2, 30, 2, 2, 'FD');

    // Left: Bill To
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('BILL TO / CLIENT:', margin + 4, y + 6);

    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(doc.clientCompany || doc.clientName, margin + 4, y + 12);

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Attn: ${doc.clientName}`, margin + 4, y + 17);
    pdf.text(`Email: ${doc.clientEmail} | Tel: ${doc.clientPhone}`, margin + 4, y + 22);
    pdf.text(`Address: ${doc.clientAddress}`, margin + 4, y + 27);

    // Right: Tax & Status Info
    const rightX = margin + contentWidth / 2 + 6;
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('TRANSACTION DETAILS:', rightX, y + 6);

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Customer Tax ID / GSTIN: ${doc.clientTaxId || 'N/A'}`, rightX, y + 12);
    pdf.text(`Billing Currency: ${doc.currency}`, rightX, y + 17);
    pdf.text(`Payment Status: ${doc.status.toUpperCase()}`, rightX, y + 22);
    pdf.text(`Amount Paid: ${formatCurrency(doc.paidAmount, doc.currency, currencies)}`, rightX, y + 27);

    y += 34;
  }

  // Table Column Positions
  const colX = {
    idx: margin,
    desc: margin + 8,
    hsn: margin + 78,
    qty: margin + 102,
    rate: margin + 122,
    tax: margin + 147,
    total: margin + 165,
  };

  // Table Headers
  if (isMinimal) {
    // Minimalist table header: soft gray tint with top and bottom hairline borders
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, y, contentWidth, 8, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, margin + contentWidth, y);
    pdf.line(margin, y + 8, margin + contentWidth, y + 8);

    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(30, 41, 59); // slate-800
  } else if (isClassic) {
    // Classic formal table header with dark background and cell borders
    pdf.setFillColor(30, 41, 59); // slate-800
    pdf.rect(margin, y, contentWidth, 8, 'F');
    pdf.setDrawColor(71, 85, 105);
    pdf.setLineWidth(0.4);
    pdf.rect(margin, y, contentWidth, 8, 'S');

    // Vertical dividers in header
    pdf.line(colX.desc - 2, y, colX.desc - 2, y + 8);
    pdf.line(colX.hsn - 2, y, colX.hsn - 2, y + 8);
    pdf.line(colX.qty - 2, y, colX.qty - 2, y + 8);
    pdf.line(colX.rate - 2, y, colX.rate - 2, y + 8);
    pdf.line(colX.tax - 2, y, colX.tax - 2, y + 8);
    pdf.line(colX.total - 2, y, colX.total - 2, y + 8);

    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);
  } else {
    // Modern table header with theme primary
    pdf.setFillColor(theme.tableHeaderBg[0], theme.tableHeaderBg[1], theme.tableHeaderBg[2]);
    pdf.rect(margin, y, contentWidth, 8, 'F');
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(theme.tableHeaderTextColor[0], theme.tableHeaderTextColor[1], theme.tableHeaderTextColor[2]);
  }

  pdf.text('#', colX.idx + 2, y + 5.5);
  pdf.text('ITEM & DESCRIPTION', colX.desc, y + 5.5);
  pdf.text('HSN/SAC', colX.hsn, y + 5.5);
  pdf.text('QTY', colX.qty, y + 5.5);
  pdf.text('UNIT PRICE', colX.rate, y + 5.5);
  pdf.text('TAX', colX.tax, y + 5.5);
  pdf.text('AMOUNT', pageWidth - margin - 3, y + 5.5, { align: 'right' });

  y += 8;

  // Table Rows
  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);

  doc.items.forEach((item, index) => {
    if (isClassic) {
      // Classic table row with alternating background and FULL cell gridlines
      if (index % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, y, contentWidth, 8, 'F');
      }
      pdf.setDrawColor(203, 213, 225);
      pdf.setLineWidth(0.3);
      // Row horizontal divider
      pdf.line(margin, y + 8, margin + contentWidth, y + 8);
      // Cell vertical gridlines
      pdf.line(margin, y, margin, y + 8);
      pdf.line(colX.desc - 2, y, colX.desc - 2, y + 8);
      pdf.line(colX.hsn - 2, y, colX.hsn - 2, y + 8);
      pdf.line(colX.qty - 2, y, colX.qty - 2, y + 8);
      pdf.line(colX.rate - 2, y, colX.rate - 2, y + 8);
      pdf.line(colX.tax - 2, y, colX.tax - 2, y + 8);
      pdf.line(colX.total - 2, y, colX.total - 2, y + 8);
      pdf.line(margin + contentWidth, y, margin + contentWidth, y + 8);
    } else if (isMinimal) {
      // Minimal frameless row with light hairline separator
      pdf.setDrawColor(241, 245, 249);
      pdf.setLineWidth(0.2);
      pdf.line(margin, y + 8, margin + contentWidth, y + 8);
    } else {
      // Modern alternating row
      if (index % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, y, contentWidth, 8, 'F');
      }
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.2);
      pdf.line(margin, y + 8, margin + contentWidth, y + 8);
    }

    pdf.text(`${index + 1}`, colX.idx + 2, y + 5.5);
    const truncatedDesc = item.description.length > 40 ? item.description.substring(0, 37) + '...' : item.description;
    pdf.text(truncatedDesc, colX.desc, y + 5.5);
    pdf.text(item.hsnCode || '-', colX.hsn, y + 5.5);
    pdf.text(`${item.quantity} ${item.unit || 'pcs'}`, colX.qty, y + 5.5);
    pdf.text(formatCurrency(item.unitPrice, doc.currency, currencies), colX.rate, y + 5.5);
    pdf.text(`${item.taxRate}%`, colX.tax, y + 5.5);
    pdf.text(formatCurrency(item.total, doc.currency, currencies), pageWidth - margin - 3, y + 5.5, { align: 'right' });

    y += 8;
  });

  y += 6;

  // Summary & Banking Section
  const summaryBoxWidth = 75;
  const summaryX = pageWidth - margin - summaryBoxWidth;

  // Left Side: Banking Details & Payment Instructions
  if (isMinimal) {
    // Minimal bank info without heavy background box
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 23, 42);
    pdf.text('PAYMENT INSTRUCTIONS:', margin, y + 6);

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Bank: ${company.bankDetails.bankName} • A/C: ${company.bankDetails.accountNumber}`, margin, y + 12);
    pdf.text(`SWIFT/IFSC: ${company.bankDetails.ifscSwift} • UPI: ${company.bankDetails.upiId}`, margin, y + 17);
    pdf.text('Kindly include invoice reference with payment.', margin, y + 22);
  } else if (isClassic) {
    // Classic formal boxed bank ledger
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, y, contentWidth - summaryBoxWidth - 6, 44, 'F');
    pdf.setDrawColor(71, 85, 105);
    pdf.setLineWidth(0.4);
    pdf.rect(margin, y, contentWidth - summaryBoxWidth - 6, 44, 'S');

    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 23, 42);
    pdf.text('BANK WIRE & SETTLEMENT INSTRUCTIONS:', margin + 4, y + 6);

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Bank: ${company.bankDetails.bankName}`, margin + 4, y + 12);
    pdf.text(`Beneficiary Account: ${company.bankDetails.accountName}`, margin + 4, y + 17);
    pdf.text(`Account No: ${company.bankDetails.accountNumber}`, margin + 4, y + 22);
    pdf.text(`IFSC / NEFT / SWIFT: ${company.bankDetails.ifscSwift}`, margin + 4, y + 27);
    pdf.text(`UPI Virtual ID: ${company.bankDetails.upiId}`, margin + 4, y + 32);
    pdf.text('Payment reference must state invoice number.', margin + 4, y + 39);
  } else {
    // Modern banking card
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, y, contentWidth - summaryBoxWidth - 6, 44, 2, 2, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, y, contentWidth - summaryBoxWidth - 6, 44, 2, 2, 'S');

    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 23, 42);
    pdf.text('BANKING & PAYMENT INSTRUCTIONS:', margin + 4, y + 6);

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Bank: ${company.bankDetails.bankName}`, margin + 4, y + 12);
    pdf.text(`Account Name: ${company.bankDetails.accountName}`, margin + 4, y + 17);
    pdf.text(`Account No: ${company.bankDetails.accountNumber}`, margin + 4, y + 22);
    pdf.text(`SWIFT / IFSC: ${company.bankDetails.ifscSwift}`, margin + 4, y + 27);
    pdf.text(`UPI ID: ${company.bankDetails.upiId}`, margin + 4, y + 32);
    pdf.text('Please include invoice number in payment remarks.', margin + 4, y + 39);
  }

  // Right Side: Totals
  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);

  pdf.text('Subtotal:', summaryX, y + 6);
  pdf.text(formatCurrency(doc.subtotal, doc.currency, currencies), pageWidth - margin, y + 6, { align: 'right' });

  if (doc.discountTotal > 0) {
    pdf.text('Discount:', summaryX, y + 12);
    pdf.text(`- ${formatCurrency(doc.discountTotal, doc.currency, currencies)}`, pageWidth - margin, y + 12, { align: 'right' });
  }

  // Tax Row
  const taxLabel = doc.taxType === 'gst' ? 'GST Total' : doc.taxType === 'vat' ? 'VAT Total' : 'Sales Tax';
  pdf.text(`${taxLabel}:`, summaryX, y + 18);
  pdf.text(formatCurrency(doc.taxAmount, doc.currency, currencies), pageWidth - margin, y + 18, { align: 'right' });

  if (doc.shippingCharges > 0) {
    pdf.text('Shipping / Freight:', summaryX, y + 24);
    pdf.text(formatCurrency(doc.shippingCharges, doc.currency, currencies), pageWidth - margin, y + 24, { align: 'right' });
  }

  // Grand Total Box according to style
  if (isMinimal) {
    // Minimal: Clean line above, bold number, double underline below
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.4);
    pdf.line(summaryX, y + 28, pageWidth - margin, y + 28);

    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text('GRAND TOTAL:', summaryX, y + 35);
    pdf.setFontSize(11);
    pdf.text(formatCurrency(doc.grandTotal, doc.currency, currencies), pageWidth - margin, y + 35, { align: 'right' });

    pdf.line(summaryX, y + 38, pageWidth - margin, y + 38);
    pdf.line(summaryX, y + 39, pageWidth - margin, y + 39);
  } else if (isClassic) {
    // Classic: Formal double-line framed box
    pdf.setFillColor(248, 250, 252);
    pdf.rect(summaryX - 3, y + 28, summaryBoxWidth + 3, 16, 'F');
    pdf.setDrawColor(71, 85, 105);
    pdf.setLineWidth(0.5);
    pdf.rect(summaryX - 3, y + 28, summaryBoxWidth + 3, 16, 'S');

    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text('GRAND TOTAL:', summaryX, y + 35);
    pdf.setFontSize(11);
    pdf.text(formatCurrency(doc.grandTotal, doc.currency, currencies), pageWidth - margin - 2, y + 36, { align: 'right' });
  } else {
    // Modern: Vibrant solid primary block
    pdf.setFillColor(theme.primaryColor[0], theme.primaryColor[1], theme.primaryColor[2]);
    pdf.roundedRect(summaryX - 3, y + 28, summaryBoxWidth + 3, 16, 2, 2, 'F');

    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text('GRAND TOTAL:', summaryX, y + 35);
    pdf.setFontSize(11);
    pdf.text(formatCurrency(doc.grandTotal, doc.currency, currencies), pageWidth - margin - 2, y + 36, { align: 'right' });
  }

  // Balance Due if partial
  if (doc.paidAmount > 0) {
    const balance = Math.max(0, doc.grandTotal - doc.paidAmount);
    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(7.5);
    if (isModern) {
      pdf.setTextColor(226, 232, 240);
      pdf.text(`Paid: ${formatCurrency(doc.paidAmount, doc.currency, currencies)} | Due: ${formatCurrency(balance, doc.currency, currencies)}`, summaryX, y + 41);
    } else {
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Paid: ${formatCurrency(doc.paidAmount, doc.currency, currencies)} | Due: ${formatCurrency(balance, doc.currency, currencies)}`, summaryX, y + 45);
    }
  }

  y += 50;

  // Terms & Conditions & Signatory
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, margin + contentWidth, y);
  y += 5;

  // Terms
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('TERMS & CONDITIONS:', margin, y + 4);

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  const termsText = doc.terms || company.terms || 'Payment due as specified on invoice.';
  const termLines = pdf.splitTextToSize(termsText, contentWidth - 65);
  pdf.text(termLines, margin, y + 9);

  // Authorized Signatory
  const sigX = pageWidth - margin - 50;
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text('For ' + company.name, sigX, y + 4);

  if (isClassic) {
    // Stamp Box for Classic style
    pdf.setDrawColor(148, 163, 184);
    pdf.rect(sigX + 10, y + 8, 28, 14, 'S');
    pdf.setFont(docFont, 'italic');
    pdf.setFontSize(6.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text('[ OFFICIAL SEAL ]', sigX + 13, y + 16);
  }

  pdf.setDrawColor(203, 213, 225);
  pdf.line(sigX, y + 26, sigX + 50, y + 26);
  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Authorized Signatory', sigX + 10, y + 30);

  // Footer Note
  pdf.setFont(docFont, 'italic');
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text(
    `This is a computer-generated document processed via Business Billing Suite (${templateStyle} Style).`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  return pdf;
}

export function downloadDocumentPdf(doc: Document, company: CompanyProfile, currencies: CurrencyConfig[]): void {
  const pdf = generateDocumentPdf(doc, company, currencies);
  const fileName = `${doc.documentNumber}_${doc.clientCompany || doc.clientName}`.replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';
  pdf.save(fileName);
}

export function generateDocumentPdfBlob(doc: Document, company: CompanyProfile, currencies: CurrencyConfig[]): Blob {
  const pdf = generateDocumentPdf(doc, company, currencies);
  return pdf.output('blob');
}

