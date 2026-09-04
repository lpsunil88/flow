import { jsPDF } from 'jspdf';
import { CompanyProfile, CurrencyConfig, Document } from '../types';

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

// Convert a number into Indian English words
function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    let str = '';
    if (n > 9999999) {
      str += inWords(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    if (n > 99999) {
      str += inWords(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    if (n > 999) {
      str += inWords(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    if (n > 99) {
      str += inWords(Math.floor(n / 100)) + ' Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (str !== '') str += 'and ';
      if (n < 20) str += a[n];
      else {
        str += b[Math.floor(n / 10)];
        if (n % 10 > 0) str += ' ' + a[n % 10];
      }
    }
    return str.trim();
  }

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let result = inWords(integerPart) + ' Rupees';
  if (decimalPart > 0) {
    result += ' and ' + inWords(decimalPart) + ' Paise';
  }
  return result + ' Only';
}

export function generateDocumentPdf(doc: Document, company: CompanyProfile, currencies: CurrencyConfig[]): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const docFont = 'helvetica';

  let y = margin;

  // 1. Outer Border
  pdf.setDrawColor(30, 41, 59); // slate-800
  pdf.setLineWidth(0.4);
  pdf.rect(margin, margin, contentWidth, pageHeight - margin * 2, 'S');

  // 2. Header Section
  const headerHeight = 36;
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.rect(margin, y, contentWidth, headerHeight, 'F');
  pdf.line(margin, y + headerHeight, margin + contentWidth, y + headerHeight);

  let textX = margin + 4;
  const hasLogo = Boolean(company.logoUrl);

  if (hasLogo) {
    try {
      pdf.addImage(company.logoUrl!, 'PNG', margin + 3, y + 3, 24, 24);
      textX = margin + 30;
    } catch {
      try {
        pdf.addImage(company.logoUrl!, 'JPEG', margin + 3, y + 3, 24, 24);
        textX = margin + 30;
      } catch {
        textX = margin + 4;
      }
    }
  }

  // Company Name & Info (Left)
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(15, 23, 42);
  pdf.text(company.name || 'SUTRAA CREATIONS PRIVATE LIMITED', textX, y + 7);

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  const companyAddr = `${company.address || ''}, ${company.city || ''}, ${company.country || ''}`.trim();
  pdf.text(companyAddr, textX, y + 12);
  pdf.text(`GSTIN: ${company.taxId || 'N/A'} | Phone: ${company.phone || 'N/A'}`, textX, y + 17);
  pdf.text(`Email: ${company.email || 'N/A'} | Web: ${company.website || 'N/A'}`, textX, y + 22);
  if (company.state) {
    pdf.text(`State: ${company.state} ${company.stateCode ? `(Code: ${company.stateCode})` : ''}`, textX, y + 27);
  }

  // Right Header: Document Type Badge & Particulars
  const docTypeLabel =
    doc.type === 'invoice'
      ? 'TAX INVOICE'
      : doc.type === 'proforma'
      ? 'PROFORMA INVOICE'
      : 'DELIVERY CHALLAN';

  const badgeBg = doc.type === 'invoice' ? [37, 99, 235] : doc.type === 'proforma' ? [217, 119, 6] : [16, 185, 129];
  pdf.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
  pdf.rect(pageWidth - margin - 52, y + 3, 48, 7, 'F');
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text(docTypeLabel, pageWidth - margin - 28, y + 7.5, { align: 'center' });

  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(10.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(doc.documentNumber, pageWidth - margin - 4, y + 16, { align: 'right' });

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Date: ${doc.date}`, pageWidth - margin - 4, y + 21, { align: 'right' });
  pdf.text(`Due Date: ${doc.dueDate}`, pageWidth - margin - 4, y + 26, { align: 'right' });
  pdf.text(`Original for Recipient`, pageWidth - margin - 4, y + 31, { align: 'right' });

  y += headerHeight;

  // 3. Optional Dispatch / Challan Logistics Bar
  if (doc.type === 'challan' && doc.challanDetails) {
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, y, contentWidth, 10, 'F');
    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin, y + 10, margin + contentWidth, y + 10);

    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(30, 41, 59);
    pdf.text('LOGISTICS DISPATCH PARTICULARS:', margin + 4, y + 4.5);

    pdf.setFont(docFont, 'normal');
    const vehicleText = doc.challanDetails.vehicleNo ? `Vehicle: ${doc.challanDetails.vehicleNo}` : 'Vehicle: Standard Cargo';
    const modeText = doc.challanDetails.dispatchThrough ? `Via: ${doc.challanDetails.dispatchThrough}` : 'Via: Road Transport';
    const returnText = doc.challanDetails.returnable ? 'Type: Returnable' : 'Type: Non-Returnable';
    pdf.text(`${vehicleText}   |   ${modeText}   |   ${returnText}`, margin + 4, y + 8);
    y += 10;
  }

  // 4. Buyer & Consignee Statutory Details Grid
  const hasShipping = Boolean(doc.shippingAddress?.enabled && (doc.shippingAddress.name || doc.shippingAddress.company || doc.shippingAddress.address));
  const buyerBoxW = hasShipping ? contentWidth / 2 : contentWidth;
  const buyerBoxH = 26;

  pdf.setDrawColor(203, 213, 225);
  pdf.setFillColor(255, 255, 255);
  pdf.rect(margin, y, buyerBoxW, buyerBoxH, 'F');
  pdf.line(margin, y + buyerBoxH, margin + contentWidth, y + buyerBoxH);

  if (hasShipping) {
    pdf.line(margin + buyerBoxW, y, margin + buyerBoxW, y + buyerBoxH);
  }

  // Left Box: Billed To
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('BILLED TO (BUYER):', margin + 4, y + 4.5);

  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(doc.clientCompany || doc.clientName, margin + 4, y + 9);

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Attn: ${doc.clientName} | Phone: ${doc.clientPhone}`, margin + 4, y + 13);
  pdf.text(`Address: ${doc.clientAddress}`, margin + 4, y + 17);
  pdf.text(`GSTIN / Tax ID: ${doc.clientTaxId || 'Unregistered / N/A'}`, margin + 4, y + 21);

  // Right Box: Shipped To (if enabled)
  if (hasShipping) {
    const rightX = margin + buyerBoxW + 4;
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text('SHIPPED TO (CONSIGNEE):', rightX, y + 4.5);

    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    const shipCompany = doc.shippingAddress?.company || doc.shippingAddress?.name || doc.clientCompany || doc.clientName;
    pdf.text(shipCompany, rightX, y + 9);

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Contact: ${doc.shippingAddress?.name || doc.clientName} | Phone: ${doc.shippingAddress?.phone || doc.clientPhone}`, rightX, y + 13);
    const shipAddr = [doc.shippingAddress?.address, doc.shippingAddress?.city, doc.shippingAddress?.state].filter(Boolean).join(', ');
    pdf.text(`Delivery Location: ${shipAddr || doc.clientAddress}`, rightX, y + 17);
    pdf.text(`Consignee GSTIN: ${doc.shippingAddress?.taxId || doc.clientTaxId || 'N/A'}`, rightX, y + 21);
  }

  y += buyerBoxH;

  // 5. Line Items Table Header
  const colX = {
    sno: margin,
    desc: margin + 10,
    hsn: margin + 85,
    qty: margin + 110,
    rate: margin + 128,
    tax: margin + 152,
    total: margin + contentWidth,
  };

  const tableHeaderH = 7.5;
  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin, y, contentWidth, tableHeaderH, 'F');
  pdf.setDrawColor(203, 213, 225);
  pdf.line(margin, y + tableHeaderH, margin + contentWidth, y + tableHeaderH);

  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(30, 41, 59);

  pdf.text('#', colX.sno + 3, y + 5);
  pdf.text('Description of Goods / Services', colX.desc + 2, y + 5);
  pdf.text('HSN/SAC', colX.hsn + 2, y + 5);
  pdf.text('Qty', colX.qty + 8, y + 5, { align: 'right' });
  pdf.text('Rate', colX.rate + 12, y + 5, { align: 'right' });
  pdf.text('Tax', colX.tax + 12, y + 5, { align: 'right' });
  pdf.text('Amount', colX.total - 3, y + 5, { align: 'right' });

  y += tableHeaderH;

  // 6. Line Items Rows
  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(15, 23, 42);

  const rowHeight = 7.5;
  doc.items.forEach((item, index) => {
    if (index % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    pdf.text(String(index + 1), colX.sno + 3, y + 5);

    const descText = item.description.length > 45 ? item.description.substring(0, 42) + '...' : item.description;
    pdf.text(descText, colX.desc + 2, y + 5);

    pdf.text(item.hsnCode || '-', colX.hsn + 2, y + 5);
    pdf.text(`${item.quantity} ${item.unit || ''}`.trim(), colX.qty + 8, y + 5, { align: 'right' });
    pdf.text(formatCurrency(item.unitPrice, doc.currency, currencies), colX.rate + 12, y + 5, { align: 'right' });
    pdf.text(`${item.taxRate}%`, colX.tax + 12, y + 5, { align: 'right' });
    pdf.text(formatCurrency(item.total, doc.currency, currencies), colX.total - 3, y + 5, { align: 'right' });

    y += rowHeight;
  });

  // Table bottom border
  pdf.setDrawColor(203, 213, 225);
  pdf.line(margin, y, margin + contentWidth, y);

  // 7. Totals & Financial Breakdown Section
  const totalsSectionH = 45;
  const splitX = margin + contentWidth * 0.58;

  // Amount In Words & Bank Details (Left side)
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('TOTAL AMOUNT IN WORDS:', margin + 4, y + 6);

  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  const words = numberToWords(doc.grandTotal);
  const wordsLines = pdf.splitTextToSize(words, splitX - margin - 8);
  pdf.text(wordsLines, margin + 4, y + 11);

  // Bank Details
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('BANK ACCOUNT PAYMENT DETAILS:', margin + 4, y + 23);

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(15, 23, 42);
  if (company.bankDetails) {
    pdf.text(`Bank: ${company.bankDetails.bankName || 'N/A'} (A/C: ${company.bankDetails.accountNumber || 'N/A'})`, margin + 4, y + 28);
    pdf.text(`IFSC: ${company.bankDetails.ifscSwift || 'N/A'} | Branch: ${company.bankDetails.branch || 'Main Branch'}`, margin + 4, y + 33);
    if (company.bankDetails.upiId) {
      pdf.text(`UPI Digital VPA: ${company.bankDetails.upiId}`, margin + 4, y + 38);
    }
  } else {
    pdf.text('Direct Electronic Bank Wire / NEFT / RTGS Transfer Available', margin + 4, y + 28);
  }

  // Right Side: Financial Breakdown
  pdf.line(splitX, y, splitX, y + totalsSectionH);
  pdf.line(margin, y + totalsSectionH, margin + contentWidth, y + totalsSectionH);

  let rightY = y + 6;
  const labelX = splitX + 4;
  const valueX = margin + contentWidth - 4;

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);

  pdf.text('Taxable Subtotal:', labelX, rightY);
  pdf.text(formatCurrency(doc.subtotal, doc.currency, currencies), valueX, rightY, { align: 'right' });
  rightY += 5;

  if (doc.taxType === 'gst') {
    if (doc.cgstAmount || doc.sgstAmount) {
      const halfRate = doc.taxRate ? (doc.taxRate / 2).toFixed(1) : '9';
      pdf.text(`CGST (${halfRate}%):`, labelX, rightY);
      pdf.text(formatCurrency(doc.cgstAmount || 0, doc.currency, currencies), valueX, rightY, { align: 'right' });
      rightY += 5;

      pdf.text(`SGST (${halfRate}%):`, labelX, rightY);
      pdf.text(formatCurrency(doc.sgstAmount || 0, doc.currency, currencies), valueX, rightY, { align: 'right' });
      rightY += 5;
    } else if (doc.igstAmount) {
      pdf.text(`IGST (${doc.taxRate}%):`, labelX, rightY);
      pdf.text(formatCurrency(doc.igstAmount, doc.currency, currencies), valueX, rightY, { align: 'right' });
      rightY += 5;
    } else if (doc.taxAmount > 0) {
      pdf.text(`GST (${doc.taxRate}%):`, labelX, rightY);
      pdf.text(formatCurrency(doc.taxAmount, doc.currency, currencies), valueX, rightY, { align: 'right' });
      rightY += 5;
    }
  } else if (doc.taxAmount > 0) {
    pdf.text(`Tax (${doc.taxRate}%):`, labelX, rightY);
    pdf.text(formatCurrency(doc.taxAmount, doc.currency, currencies), valueX, rightY, { align: 'right' });
    rightY += 5;
  }

  if (doc.shippingCharges > 0) {
    pdf.text('Shipping & Handling:', labelX, rightY);
    pdf.text(formatCurrency(doc.shippingCharges, doc.currency, currencies), valueX, rightY, { align: 'right' });
    rightY += 5;
  }

  // Grand Total Highlight
  pdf.setFillColor(241, 245, 249);
  pdf.rect(splitX, rightY - 1, contentWidth * 0.42, 7.5, 'F');
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Grand Total:', labelX, rightY + 4);
  pdf.text(formatCurrency(doc.grandTotal, doc.currency, currencies), valueX, rightY + 4, { align: 'right' });
  rightY += 9;

  if (doc.paidAmount > 0) {
    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(16, 185, 129);
    pdf.text('Paid Amount:', labelX, rightY);
    pdf.text(formatCurrency(doc.paidAmount, doc.currency, currencies), valueX, rightY, { align: 'right' });
    rightY += 4.5;

    const balanceDue = Math.max(0, doc.grandTotal - doc.paidAmount);
    pdf.setFont(docFont, 'bold');
    pdf.setTextColor(220, 38, 38);
    pdf.text('Balance Due:', labelX, rightY);
    pdf.text(formatCurrency(balanceDue, doc.currency, currencies), valueX, rightY, { align: 'right' });
  }

  y += totalsSectionH;

  // 8. Declarations & Authorized Signatory Block
  const bottomSectionH = 34;
  const sigSplitX = margin + contentWidth * 0.58;

  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(71, 85, 105);
  pdf.text('DECLARATION & TERMS:', margin + 4, y + 5);

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(100, 116, 139);
  const termsText = doc.terms || company.terms || 'Certified that goods described in this document are genuine. Discrepancies if any must be reported within 48 hours.';
  const termsLines = pdf.splitTextToSize(termsText, sigSplitX - margin - 8);
  pdf.text(termsLines.slice(0, 3), margin + 4, y + 9);

  // Receiver's Signature (left of signatory block)
  pdf.setDrawColor(203, 213, 225);
  pdf.line(margin + 4, y + 26, margin + 42, y + 26);
  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text("Receiver's Signature", margin + 23, y + 29.5, { align: 'center' });

  // Authorized Signatory (Right)
  pdf.line(sigSplitX, y, sigSplitX, y + bottomSectionH);

  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`FOR ${company.name || 'SUTRAA CREATIONS PRIVATE LIMITED'}`, pageWidth - margin - 4, y + 5, { align: 'right' });

  // Draw stamp if present
  const stampUrl = doc.includeStamp !== false ? (doc.stampUrl || company.stampUrl) : null;
  const signatureUrl = doc.includeSignature !== false ? (doc.signatureUrl || company.signatureUrl) : null;

  if (stampUrl) {
    try {
      pdf.addImage(stampUrl, 'PNG', sigSplitX + 8, y + 7, 18, 18);
    } catch {
      try {
        pdf.addImage(stampUrl, 'JPEG', sigSplitX + 8, y + 7, 18, 18);
      } catch (e) {
        console.warn('Could not add stamp to PDF', e);
      }
    }
  }

  if (signatureUrl) {
    try {
      pdf.addImage(signatureUrl, 'PNG', pageWidth - margin - 38, y + 8, 34, 14);
    } catch {
      try {
        pdf.addImage(signatureUrl, 'JPEG', pageWidth - margin - 38, y + 8, 34, 14);
      } catch (e) {
        console.warn('Could not add signature to PDF', e);
      }
    }
  }

  pdf.line(pageWidth - margin - 48, y + 26, pageWidth - margin - 4, y + 26);
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(30, 41, 59);
  const signatoryName = doc.authorizedSignatoryName || company.authorizedSignatoryName || 'Authorized Signatory';
  pdf.text(signatoryName, pageWidth - margin - 26, y + 29.5, { align: 'center' });

  // 9. Computer-Generated Notice Footer
  pdf.setFont(docFont, 'italic');
  pdf.setFontSize(6.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text(
    `This is a computer-generated document issued for corporate operations. Standard A4 format.`,
    pageWidth / 2,
    pageHeight - margin - 2,
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
