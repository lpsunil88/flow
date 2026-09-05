import { jsPDF } from 'jspdf';
import { CompanyProfile, CurrencyConfig, Document } from '../types';
import {
  DOCUMENT_THEME,
  resolveDocumentTemplateData,
} from './documentTemplate';

export function getCurrencySymbol(code: string = 'INR', currencies: CurrencyConfig[] = []): string {
  const c = code?.toUpperCase();
  if (c === 'INR') return '₹';
  const found = currencies?.find((curr) => curr.code === c);
  return found ? found.symbol : code;
}

// PDF standard Type 1 fonts (Helvetica) cannot render unicode ₹ (U+20B9), which becomes corrupted as '¹'.
// For PDF generation, we map INR to clean 'Rs.' so amounts are crisp, clear, and professional.
export function getPdfCurrencySymbol(code: string = 'INR', currencies: CurrencyConfig[] = []): string {
  const c = code?.toUpperCase();
  if (c === 'INR') return 'Rs.';
  const found = currencies?.find((curr) => curr.code === c);
  if (!found) return code;
  if (found.symbol === '₹') return 'Rs.';
  return found.symbol;
}

export function formatCurrency(
  amount: number,
  currencyCode: string = 'INR',
  currencies: CurrencyConfig[] = []
): string {
  const code = currencyCode || 'INR';
  const symbol = getCurrencySymbol(code, currencies);
  const locale = code === 'INR' ? 'en-IN' : 'en-US';
  return `${symbol} ${Number(amount || 0).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCurrencyForPdf(
  amount: number,
  currencyCode: string = 'INR',
  currencies: CurrencyConfig[] = []
): string {
  const code = currencyCode || 'INR';
  const symbol = getPdfCurrencySymbol(code, currencies);
  const locale = code === 'INR' ? 'en-IN' : 'en-US';
  return `${symbol} ${Number(amount || 0).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function generateDocumentPdf(doc: Document, company: CompanyProfile, currencies: CurrencyConfig[] = []): jsPDF {
  const t = resolveDocumentTemplateData(doc, company, currencies);
  const { colors, dimensions, fonts } = DOCUMENT_THEME;
  const layout = t.layoutTemplate || 'modern';

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = dimensions.pageWidthMm;
  const margin = dimensions.marginMm;
  const contentWidth = dimensions.contentWidthMm;
  const docFont = fonts.pdfFont;

  let y = 8;

  // ==========================================
  // 1. TOP DOCUMENT CATEGORY & TITLE BANNER
  // ==========================================
  if (layout === 'classic') {
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(8.2);
    pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
    pdf.text(t.config.divisionText.toUpperCase(), margin, y + 3.5);

    // Big Bold Document Title (Classic uppercase)
    pdf.setFontSize(15.5);
    pdf.text(t.config.documentTitle.toUpperCase(), margin, y + 9.5);

    // Subtitle
    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
    pdf.text(t.config.subtitleText, margin, y + 13);

    // Right-aligned banner info
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
    pdf.text(t.config.defaultCopyLabel, margin + contentWidth, y + 3.5, { align: 'right' });

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
    const purposeLabelX = margin + contentWidth;
    pdf.text(`Purpose: `, purposeLabelX - pdf.getTextWidth(t.config.defaultPurpose) - 1, y + 8.5, { align: 'right' });
    pdf.setFont(docFont, 'bold');
    pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
    pdf.text(t.config.defaultPurpose, purposeLabelX, y + 8.5, { align: 'right' });

    y += 15;
    // Classic double divider line
    pdf.setDrawColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, margin + contentWidth, y);
    pdf.line(margin, y + 1.2, margin + contentWidth, y + 1.2);
    y += 3.2;
  } else if (layout === 'minimalist') {
    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
    pdf.text(t.config.divisionText.toUpperCase(), margin, y + 3.5);

    // Minimalist clean document title
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(14.5);
    pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
    pdf.text(t.config.documentTitle, margin, y + 9.5);

    // Subtitle
    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
    pdf.text(t.config.subtitleText, margin, y + 13);

    // Right-aligned banner info
    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(7.2);
    pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
    pdf.text(t.config.defaultCopyLabel, margin + contentWidth, y + 3.5, { align: 'right' });

    pdf.setFontSize(7.2);
    pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
    const purposeLabelX = margin + contentWidth;
    pdf.text(`Purpose: `, purposeLabelX - pdf.getTextWidth(t.config.defaultPurpose) - 1, y + 8.5, { align: 'right' });
    pdf.setFont(docFont, 'bold');
    pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
    pdf.text(t.config.defaultPurpose, purposeLabelX, y + 8.5, { align: 'right' });

    y += 15;
    // Hairline divider rule
    pdf.setDrawColor(colors.borderSubtle.rgb[0], colors.borderSubtle.rgb[1], colors.borderSubtle.rgb[2]);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, margin + contentWidth, y);
    y += 2.5;
  } else {
    // Modern executive
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(colors.primary.rgb[0], colors.primary.rgb[1], colors.primary.rgb[2]);
    pdf.text(t.config.divisionText, margin, y + 3.5);

    // Big Bold Document Title
    pdf.setFontSize(15);
    pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
    pdf.text(t.config.documentTitle, margin, y + 9.5);

    // Subtitle
    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
    pdf.text(t.config.subtitleText, margin, y + 13);

    // Right-aligned banner info
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
    pdf.text(t.config.defaultCopyLabel, margin + contentWidth, y + 3.5, { align: 'right' });

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
    const purposeLabelX = margin + contentWidth;
    pdf.text(`Purpose: `, purposeLabelX - pdf.getTextWidth(t.config.defaultPurpose) - 1, y + 8.5, { align: 'right' });
    pdf.setFont(docFont, 'bold');
    pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
    pdf.text(t.config.defaultPurpose, purposeLabelX, y + 8.5, { align: 'right' });

    y += 15;

    // Thick Horizontal Divider Line
    pdf.setDrawColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
    pdf.setLineWidth(0.65);
    pdf.line(margin, y, margin + contentWidth, y);
    y += 2.5;
  }

  // ==========================================
  // 2. COMPANY PROFILE HEADER
  // ==========================================
  const logoBoxSize = 12;
  let hasLogoRendered = false;

  if (company.logoUrl) {
    try {
      pdf.addImage(company.logoUrl, 'PNG', margin, y, logoBoxSize, logoBoxSize);
      hasLogoRendered = true;
    } catch {
      try {
        pdf.addImage(company.logoUrl, 'JPEG', margin, y, logoBoxSize, logoBoxSize);
        hasLogoRendered = true;
      } catch {
        hasLogoRendered = false;
      }
    }
  }

  if (!hasLogoRendered) {
    // Amber monogram box matching theme
    pdf.setFillColor(colors.amberBrand.bgRgb[0], colors.amberBrand.bgRgb[1], colors.amberBrand.bgRgb[2]);
    pdf.setDrawColor(colors.amberBrand.borderRgb[0], colors.amberBrand.borderRgb[1], colors.amberBrand.borderRgb[2]);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, y, logoBoxSize, logoBoxSize, 1.2, 1.2, 'FD');
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(colors.amberBrand.rgb[0], colors.amberBrand.rgb[1], colors.amberBrand.rgb[2]);
    pdf.text(t.monogram, margin + logoBoxSize / 2, y + 7.8, { align: 'center' });
  }

  const compTextX = margin + logoBoxSize + 3;
  const compMaxW = contentWidth - logoBoxSize - 3;

  // Company Name
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(10.5);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text(company.name || 'SUTRAA CREATIONS PRIVATE LIMITED', compTextX, y + 4);

  // Subtitle / Legal line
  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(6.8);
  pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.text(company.name || 'Sutraa Creations Private Limited', compTextX, y + 7.6);

  // Regd. Office
  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(6.8);
  pdf.setTextColor(colors.textBody.rgb[0], colors.textBody.rgb[1], colors.textBody.rgb[2]);
  const regdOfficeStr = `Regd. Office: ${company.address || 'B-4, Ashok Guruprasad CHS Hanuman Road'}, ${company.city || 'Vileparle East, Mumbai'} - ${company.pincode || '400057'}, ${t.consignorState.name}`;
  pdf.text(pdf.splitTextToSize(regdOfficeStr, compMaxW)[0], compTextX, y + 11.2);

  // Tax IDs and Contact row (full width)
  const taxIdLine = `GSTIN: ${company.taxId || '27AAGCS6232B1ZM'}    |    PAN: ${t.panStr}    |    CIN: ${company.cin || 'U18109MH2020PTC345678'}`;
  pdf.text(taxIdLine, margin, y + 15.5);

  const contactLine = `Phone: ${company.phone || '+917840069490'}    •    Email: ${company.email || 'sunil@sutraa.in'}    •    State: ${t.consignorState.name} (${t.consignorState.code})`;
  pdf.text(contactLine, margin, y + 19);

  y += 21.5;

  // Thin separator line
  pdf.setDrawColor(colors.borderSubtle.rgb[0], colors.borderSubtle.rgb[1], colors.borderSubtle.rgb[2]);
  pdf.setLineWidth(0.25);
  pdf.line(margin, y, margin + contentWidth, y);
  y += 2.5;

  // ==========================================
  // 3. 4-COLUMN METADATA INFO STRIP
  // ==========================================
  const stripH = 11;
  const colW = contentWidth / 4; // 47.5mm each

  if (layout === 'classic') {
    pdf.setFillColor(colors.bgHeader.rgb[0], colors.bgHeader.rgb[1], colors.bgHeader.rgb[2]);
    pdf.setDrawColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
    pdf.setLineWidth(0.4);
    pdf.rect(margin, y, contentWidth, stripH, 'FD');
    for (let i = 1; i < 4; i++) {
      pdf.line(margin + colW * i, y, margin + colW * i, y + stripH);
    }
  } else if (layout === 'minimalist') {
    pdf.setDrawColor(colors.borderSubtle.rgb[0], colors.borderSubtle.rgb[1], colors.borderSubtle.rgb[2]);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, margin + contentWidth, y);
    pdf.line(margin, y + stripH, margin + contentWidth, y + stripH);
  } else {
    pdf.setFillColor(colors.bgLight.rgb[0], colors.bgLight.rgb[1], colors.bgLight.rgb[2]);
    pdf.setDrawColor(colors.borderStandard.rgb[0], colors.borderStandard.rgb[1], colors.borderStandard.rgb[2]);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, y, contentWidth, stripH, 1, 1, 'FD');
    for (let i = 1; i < 4; i++) {
      pdf.line(margin + colW * i, y, margin + colW * i, y + stripH);
    }
  }

  // Col 1: Document Number
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(6.2);
  pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.text(t.config.col1Label, margin + 2.5, y + 4);
  pdf.setFontSize(7.8);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text(doc.documentNumber || 'SCPL/26-27/0001', margin + 2.5, y + 8.5);

  // Col 2: Date & Time
  pdf.setFontSize(6.2);
  pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.text(t.config.col2Label, margin + colW + 2.5, y + 4);
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.2);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text(t.formattedDateTime, margin + colW + 2.5, y + 8.5);

  // Col 3: E-Way Bill / Due Date
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(6.2);
  pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.text(t.config.col3Label, margin + colW * 2 + 2.5, y + 4);
  pdf.setFontSize(7.2);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  const col3Val =
    doc.type === 'challan'
      ? doc.challanDetails?.deliveryNote || 'N/A'
      : doc.dueDate || doc.date || 'N/A';
  pdf.text(col3Val, margin + colW * 2 + 2.5, y + 8.5);

  // Col 4: Vehicle / Ref
  pdf.setFontSize(6.2);
  pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.text(t.config.col4Label, margin + colW * 3 + 2.5, y + 4);
  pdf.setFontSize(7.2);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  const vehicleVal = doc.challanDetails?.vehicleNo || 'N/A';
  pdf.text(vehicleVal, margin + colW * 3 + 2.5, y + 8.5);

  y += stripH + 2.5;

  // ==========================================
  // 4. ROW 1: SELLER / CONSIGNOR & BUYER (BILLED TO) CARDS
  // ==========================================
  const cardW = (contentWidth - 4) / 2; // 93mm each
  const rightCardX = margin + cardW + 4;

  // Measure content lines to compute dynamic, overlap-free card heights
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.5);
  const sellerTitleLines = pdf.splitTextToSize(t.sellerTitle, cardW - 6);
  const buyerTitleLines = pdf.splitTextToSize(t.buyerTitle, cardW - 6);

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(6.4);
  const sellerAddrLines = pdf.splitTextToSize(t.sellerAddr, cardW - 6);
  const buyerAddrLines = pdf.splitTextToSize(t.buyerAddr, cardW - 6);

  const sellerNeededH = 7.5 + (sellerTitleLines.length * 3.4) + (sellerAddrLines.length * 3.0) + 3.0 + 3.0 + 3.0 + 3;
  const buyerNeededH = 7.5 + (buyerTitleLines.length * 3.4) + (buyerAddrLines.length * 3.0) + 3.0 + 3.0 + 3.0 + 3;
  const row1H = Math.max(sellerNeededH, buyerNeededH, 31);

  if (layout === 'classic') {
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
    pdf.setLineWidth(0.4);
    pdf.rect(margin, y, cardW, row1H, 'FD');
    pdf.rect(rightCardX, y, cardW, row1H, 'FD');

    // Header bars
    pdf.setFillColor(colors.bgHeader.rgb[0], colors.bgHeader.rgb[1], colors.bgHeader.rgb[2]);
    pdf.rect(margin, y, cardW, 5, 'FD');
    pdf.rect(rightCardX, y, cardW, 5, 'FD');
  } else if (layout === 'minimalist') {
    pdf.setDrawColor(colors.borderSubtle.rgb[0], colors.borderSubtle.rgb[1], colors.borderSubtle.rgb[2]);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y + 5, margin + cardW, y + 5);
    pdf.line(rightCardX, y + 5, rightCardX + cardW, y + 5);
  } else {
    // Modern executive cards
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(colors.borderStandard.rgb[0], colors.borderStandard.rgb[1], colors.borderStandard.rgb[2]);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, y, cardW, row1H, 1.2, 1.2, 'FD');
    pdf.roundedRect(rightCardX, y, cardW, row1H, 1.2, 1.2, 'FD');

    // Header bars
    pdf.setFillColor(colors.bgLight.rgb[0], colors.bgLight.rgb[1], colors.bgLight.rgb[2]);
    pdf.rect(margin, y, cardW, 5, 'F');
    pdf.rect(rightCardX, y, cardW, 5, 'F');
    pdf.setDrawColor(colors.borderSubtle.rgb[0], colors.borderSubtle.rgb[1], colors.borderSubtle.rgb[2]);
    pdf.line(margin, y + 5, margin + cardW, y + 5);
    pdf.line(rightCardX, y + 5, rightCardX + cardW, y + 5);
  }

  // Row 1 - Left Card (Seller / Consignor)
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(6.4);
  pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
  pdf.text(t.config.sellerCardTitle, margin + 2.5, y + 3.5);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text(`STATE: ${t.consignorState.code}`, margin + cardW - 2.5, y + 3.5, { align: 'right' });

  let curSellerY = y + 8.2;
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  for (const line of sellerTitleLines) {
    pdf.text(line, margin + 2.5, curSellerY);
    curSellerY += 3.4;
  }

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(6.4);
  pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
  for (const line of sellerAddrLines) {
    pdf.text(line, margin + 2.5, curSellerY);
    curSellerY += 3.0;
  }

  if (t.sellerCity) {
    pdf.text(t.sellerCity, margin + 2.5, curSellerY);
    curSellerY += 3.0;
  }

  pdf.setFont(docFont, 'bold');
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text('GSTIN: ', margin + 2.5, curSellerY);
  pdf.setFont(docFont, 'normal');
  pdf.text(t.sellerGstin, margin + 11.5, curSellerY);
  curSellerY += 3.0;

  pdf.setFont(docFont, 'bold');
  pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
  pdf.text('Contact: ', margin + 2.5, curSellerY);
  pdf.setFont(docFont, 'normal');
  pdf.text(pdf.splitTextToSize(t.sellerContact, cardW - 16)[0], margin + 13.5, curSellerY);

  // Row 1 - Right Card (Buyer / Billed To)
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(6.4);
  pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
  pdf.text(t.config.buyerCardTitle, rightCardX + 2.5, y + 3.5);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text(`STATE: ${t.billedToState.code}`, rightCardX + cardW - 2.5, y + 3.5, { align: 'right' });

  let curBuyerY = y + 8.2;
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  for (const line of buyerTitleLines) {
    pdf.text(line, rightCardX + 2.5, curBuyerY);
    curBuyerY += 3.4;
  }

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(6.4);
  pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
  for (const line of buyerAddrLines) {
    pdf.text(line, rightCardX + 2.5, curBuyerY);
    curBuyerY += 3.0;
  }

  if (t.buyerCity) {
    pdf.text(t.buyerCity, rightCardX + 2.5, curBuyerY);
    curBuyerY += 3.0;
  }

  pdf.setFont(docFont, 'bold');
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text('GSTIN: ', rightCardX + 2.5, curBuyerY);
  pdf.setFont(docFont, 'normal');
  pdf.text(t.buyerGstin, rightCardX + 11.5, curBuyerY);
  curBuyerY += 3.0;

  pdf.setFont(docFont, 'bold');
  pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
  pdf.text('Place of Supply: ', rightCardX + 2.5, curBuyerY);
  pdf.setFont(docFont, 'normal');
  pdf.text(t.buyerPlaceOfSupply, rightCardX + 22, curBuyerY);

  y += row1H + 2.5;

  // ==========================================
  // 5. ROW 2: CONSIGNEE (SHIPPED TO) & TRANSPORT / LOGISTICS
  // ==========================================
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.5);
  const shipTitleLines = pdf.splitTextToSize(t.shipToTitle, cardW - 6);

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(6.4);
  const shipAddrLines = pdf.splitTextToSize(t.shipToAddr, cardW - 6);

  const shipNeededH = 7.5 + (shipTitleLines.length * 3.4) + (shipAddrLines.length * 3.0) + 3.0 + 3.0 + 3.0 + 3;
  const transportNeededH = 7.5 + (4 * 4.2) + 3;
  const row2H = Math.max(shipNeededH, transportNeededH, 29);

  if (layout === 'classic') {
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
    pdf.setLineWidth(0.4);
    pdf.rect(margin, y, cardW, row2H, 'FD');
    pdf.rect(rightCardX, y, cardW, row2H, 'FD');

    // Header bars
    pdf.setFillColor(colors.bgHeader.rgb[0], colors.bgHeader.rgb[1], colors.bgHeader.rgb[2]);
    pdf.rect(margin, y, cardW, 5, 'FD');
    pdf.rect(rightCardX, y, cardW, 5, 'FD');
  } else if (layout === 'minimalist') {
    pdf.setDrawColor(colors.borderSubtle.rgb[0], colors.borderSubtle.rgb[1], colors.borderSubtle.rgb[2]);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y + 5, margin + cardW, y + 5);
    pdf.line(rightCardX, y + 5, rightCardX + cardW, y + 5);
  } else {
    // Modern executive cards
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(colors.borderStandard.rgb[0], colors.borderStandard.rgb[1], colors.borderStandard.rgb[2]);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, y, cardW, row2H, 1.2, 1.2, 'FD');
    pdf.roundedRect(rightCardX, y, cardW, row2H, 1.2, 1.2, 'FD');

    // Header bars
    pdf.setFillColor(colors.bgLight.rgb[0], colors.bgLight.rgb[1], colors.bgLight.rgb[2]);
    pdf.rect(margin, y, cardW, 5, 'F');
    pdf.rect(rightCardX, y, cardW, 5, 'F');
    pdf.setDrawColor(colors.borderSubtle.rgb[0], colors.borderSubtle.rgb[1], colors.borderSubtle.rgb[2]);
    pdf.line(margin, y + 5, margin + cardW, y + 5);
    pdf.line(rightCardX, y + 5, rightCardX + cardW, y + 5);
  }

  // Row 2 - Left Card (Consignee / Shipped To - Large box)
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(6.4);
  pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
  pdf.text(t.config.shipToCardTitle, margin + 2.5, y + 3.5);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text(`STATE: ${t.shipToState.code}`, margin + cardW - 2.5, y + 3.5, { align: 'right' });

  let curShipY = y + 8.2;
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  for (const line of shipTitleLines) {
    pdf.text(line, margin + 2.5, curShipY);
    curShipY += 3.4;
  }

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(6.4);
  pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
  for (const line of shipAddrLines) {
    pdf.text(line, margin + 2.5, curShipY);
    curShipY += 3.0;
  }

  if (t.shipToCity) {
    pdf.text(t.shipToCity, margin + 2.5, curShipY);
    curShipY += 3.0;
  }

  pdf.setFont(docFont, 'bold');
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text('GSTIN: ', margin + 2.5, curShipY);
  pdf.setFont(docFont, 'normal');
  pdf.text(t.shipToGstin, margin + 11.5, curShipY);
  curShipY += 3.0;

  pdf.setFont(docFont, 'bold');
  pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
  pdf.text('Delivery State: ', margin + 2.5, curShipY);
  pdf.setFont(docFont, 'normal');
  pdf.text(t.shipToPlaceOfSupply, margin + 20, curShipY);

  // Row 2 - Right Card (Dispatch & Transport Logistics)
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(6.4);
  pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
  pdf.text(t.config.transportCardTitle, rightCardX + 2.5, y + 3.5);
  pdf.setFont(docFont, 'normal');
  pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.text(`PURPOSE: ${t.config.defaultPurpose}`, rightCardX + cardW - 2.5, y + 3.5, { align: 'right' });

  let curTransY = y + 8.8;

  // Trans Line 1: Transport Mode & Vehicle
  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(6.4);
  pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.text('Transport Mode: ', rightCardX + 2.5, curTransY);
  pdf.setFont(docFont, 'bold');
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text(t.transportMode, rightCardX + 22, curTransY);

  pdf.setFont(docFont, 'normal');
  pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.text('Vehicle: ', rightCardX + 48, curTransY);
  pdf.setFont(docFont, 'bold');
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text(doc.challanDetails?.vehicleNo || 'N/A', rightCardX + 59, curTransY);
  curTransY += 4.2;

  // Trans Line 2: Transporter / Note
  pdf.setFont(docFont, 'normal');
  pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.text('Transporter: ', rightCardX + 2.5, curTransY);
  pdf.setFont(docFont, 'bold');
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text(pdf.splitTextToSize(t.transporterName, cardW - 22)[0], rightCardX + 19, curTransY);
  curTransY += 4.2;

  // Trans Line 3: LR/GR No & Date
  pdf.setFont(docFont, 'normal');
  pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.text('LR/GR Tracking: ', rightCardX + 2.5, curTransY);
  pdf.setFont(docFont, 'bold');
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text(pdf.splitTextToSize(t.lrGrText, cardW - 25)[0], rightCardX + 23, curTransY);
  curTransY += 4.2;

  // Trans Line 4: Date & Handling
  pdf.setFont(docFont, 'normal');
  pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.text('Handling / Ref: ', rightCardX + 2.5, curTransY);
  pdf.setFont(docFont, 'bold');
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text(pdf.splitTextToSize(t.driverText, cardW - 24)[0], rightCardX + 21, curTransY);

  y += row2H + 2.5;

  // ==========================================
  // 6. LINE ITEMS TABLE (FROM SHARED BASE COLUMNS)
  // ==========================================
  const tableHeaderH = 6.5;
  let curX = margin;

  if (layout === 'classic') {
    pdf.setFillColor(colors.bgHeader.rgb[0], colors.bgHeader.rgb[1], colors.bgHeader.rgb[2]);
    pdf.setDrawColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
    pdf.setLineWidth(0.4);
    pdf.rect(margin, y, contentWidth, tableHeaderH, 'FD');
  } else if (layout === 'minimalist') {
    pdf.setDrawColor(colors.borderStandard.rgb[0], colors.borderStandard.rgb[1], colors.borderStandard.rgb[2]);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, margin + contentWidth, y);
    pdf.line(margin, y + tableHeaderH, margin + contentWidth, y + tableHeaderH);
  } else {
    pdf.setFillColor(colors.bgHeader.rgb[0], colors.bgHeader.rgb[1], colors.bgHeader.rgb[2]);
    pdf.setDrawColor(colors.borderStandard.rgb[0], colors.borderStandard.rgb[1], colors.borderStandard.rgb[2]);
    pdf.setLineWidth(0.3);
    pdf.rect(margin, y, contentWidth, tableHeaderH, 'FD');
  }

  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(6.4);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);

  t.tableColumns.forEach((col, idx) => {
    if (idx > 0 && layout !== 'minimalist') {
      pdf.line(curX, y, curX, y + tableHeaderH);
    }
    const textTargetX =
      col.align === 'center'
        ? curX + col.pdfWidthMm / 2
        : col.align === 'right'
        ? curX + col.pdfWidthMm - 2
        : curX + 2;

    const columnTitle =
      col.key === 'rate'
        ? `Rate (${t.pdfCurrencySymbol})`
        : col.key === 'taxval'
        ? `Taxable Val (${t.pdfCurrencySymbol})`
        : col.key === 'tax'
        ? `${col.title} (${t.pdfCurrencySymbol})`
        : col.key === 'total'
        ? `Total (${t.pdfCurrencySymbol})`
        : col.title;

    pdf.text(columnTitle, textTargetX, y + 4.3, { align: col.align as 'center' | 'right' | 'left' });
    curX += col.pdfWidthMm;
  });

  y += tableHeaderH;

  // Table Rows
  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(6.8);

  doc.items.forEach((item, index) => {
    const descLines = pdf.splitTextToSize(item.description || 'Item Description', 50);
    const rowH = Math.max(5.8, descLines.length * 3.2 + 2.5);

    if (index % 2 === 1 && layout !== 'minimalist') {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(margin, y, contentWidth, rowH, 'F');
    }

    pdf.setDrawColor(colors.borderSubtle.rgb[0], colors.borderSubtle.rgb[1], colors.borderSubtle.rgb[2]);
    pdf.setLineWidth(layout === 'minimalist' ? 0.2 : 0.25);
    pdf.line(margin, y + rowH, margin + contentWidth, y + rowH);

    let cellX = margin;
    t.tableColumns.forEach((col, idx) => {
      if (idx > 0 && layout !== 'minimalist') {
        pdf.line(cellX, y, cellX, y + rowH);
      }

      const cellCenter = cellX + col.pdfWidthMm / 2;
      const cellRight = cellX + col.pdfWidthMm - 2;
      const cellLeft = cellX + 2;

      pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);

      if (col.key === 'sno') {
        pdf.text(String(index + 1), cellCenter, y + 4.1, { align: 'center' });
      } else if (col.key === 'desc') {
        let descY = y + 4.1;
        pdf.setFont(docFont, 'bold');
        pdf.text(descLines[0] || '', cellLeft, descY);
        pdf.setFont(docFont, 'normal');
        for (let l = 1; l < descLines.length; l++) {
          descY += 3.1;
          pdf.text(descLines[l], cellLeft, descY);
        }
      } else if (col.key === 'hsn') {
        pdf.setFont(docFont, 'normal');
        pdf.text(item.hsnCode || '-', cellCenter, y + 4.1, { align: 'center' });
      } else if (col.key === 'qty') {
        pdf.setFont(docFont, 'bold');
        pdf.text(String(item.quantity || 1), cellCenter, y + 4.1, { align: 'center' });
      } else if (col.key === 'uom') {
        pdf.setFont(docFont, 'normal');
        pdf.text(item.unit || 'PCS', cellCenter, y + 4.1, { align: 'center' });
      } else if (col.key === 'rate') {
        pdf.text(item.unitPrice.toFixed(2), cellRight, y + 4.1, { align: 'right' });
      } else if (col.key === 'taxval') {
        pdf.setFont(docFont, 'bold');
        pdf.text(item.amount.toFixed(2), cellRight, y + 4.1, { align: 'right' });
      } else if (col.key === 'tax') {
        pdf.setFont(docFont, 'normal');
        pdf.text(`${item.taxAmount.toFixed(2)} (${item.taxRate}%)`, cellRight, y + 4.1, { align: 'right' });
      } else if (col.key === 'total') {
        pdf.setFont(docFont, 'bold');
        pdf.text(item.total.toFixed(2), cellRight, y + 4.1, { align: 'right' });
      }

      cellX += col.pdfWidthMm;
    });

    y += rowH;
  });

  // Table Subtotal Row
  const subtotalH = 5.8;
  const labelSpanW = 104;

  if (layout === 'classic') {
    pdf.setFillColor(colors.bgHeader.rgb[0], colors.bgHeader.rgb[1], colors.bgHeader.rgb[2]);
    pdf.rect(margin, y, contentWidth, subtotalH, 'FD');
  } else if (layout === 'minimalist') {
    pdf.setDrawColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, margin + contentWidth, y);
    pdf.line(margin, y + subtotalH, margin + contentWidth, y + subtotalH);
  } else {
    pdf.setFillColor(colors.bgLight.rgb[0], colors.bgLight.rgb[1], colors.bgLight.rgb[2]);
    pdf.rect(margin, y, contentWidth, subtotalH, 'F');
    pdf.setDrawColor(colors.borderStandard.rgb[0], colors.borderStandard.rgb[1], colors.borderStandard.rgb[2]);
    pdf.rect(margin, y, contentWidth, subtotalH, 'S');
  }

  // "Sub Total" label spanning col 1-5 (8 + 54 + 17 + 13 + 12 = 104mm)
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(6.8);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text('Sub Total', margin + labelSpanW - 4, y + 4, { align: 'right' });

  let subColX = margin + labelSpanW;
  if (layout !== 'minimalist') {
    pdf.line(subColX, y, subColX, y + subtotalH);
  }

  subColX += 19;
  if (layout !== 'minimalist') {
    pdf.line(subColX, y, subColX, y + subtotalH);
  }

  // Taxable Val Total
  pdf.text(doc.subtotal.toFixed(2), subColX + 21 - 2, y + 4, { align: 'right' });
  subColX += 21;
  if (layout !== 'minimalist') {
    pdf.line(subColX, y, subColX, y + subtotalH);
  }

  // Tax Total
  pdf.text(doc.taxAmount.toFixed(2), subColX + 18 - 2, y + 4, { align: 'right' });
  subColX += 18;
  if (layout !== 'minimalist') {
    pdf.line(subColX, y, subColX, y + subtotalH);
  }

  // Grand Total
  pdf.text(doc.grandTotal.toFixed(2), subColX + 28 - 2, y + 4, { align: 'right' });

  y += subtotalH + 2;

  // ==========================================
  // 7. TOTAL ITEMS & QUANTITY STRIP
  // ==========================================
  const summaryStripH = 5.5;

  if (layout === 'classic') {
    pdf.setFillColor(colors.bgLight.rgb[0], colors.bgLight.rgb[1], colors.bgLight.rgb[2]);
    pdf.setDrawColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
    pdf.setLineWidth(0.4);
    pdf.rect(margin, y, contentWidth, summaryStripH, 'FD');
  } else if (layout === 'minimalist') {
    pdf.setDrawColor(colors.borderSubtle.rgb[0], colors.borderSubtle.rgb[1], colors.borderSubtle.rgb[2]);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y + summaryStripH, margin + contentWidth, y + summaryStripH);
  } else {
    pdf.setFillColor(colors.bgLight.rgb[0], colors.bgLight.rgb[1], colors.bgLight.rgb[2]);
    pdf.setDrawColor(colors.borderStandard.rgb[0], colors.borderStandard.rgb[1], colors.borderStandard.rgb[2]);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, y, contentWidth, summaryStripH, 1, 1, 'FD');
  }

  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(6.4);
  pdf.setTextColor(colors.textBody.rgb[0], colors.textBody.rgb[1], colors.textBody.rgb[2]);
  const supplyTypeText = t.isInterState ? 'INTER-STATE SUPPLY (IGST)' : 'INTRA-STATE SUPPLY (CGST + SGST)';
  const summaryText = `TOTAL ITEMS: ${doc.items.length}      |      TOTAL QUANTITY: ${t.totalQuantity} ${doc.items[0]?.unit || 'PCS'}      |      ${supplyTypeText}`;
  pdf.text(summaryText, margin + 4, y + 3.8);

  y += summaryStripH + 2.5;

  // ==========================================
  // 8. TWO-COLUMN BREAKDOWN & BANK PARTICULARS
  // ==========================================
  const particularsH = 38;
  const splitLeftW = 104;
  const splitRightW = contentWidth - splitLeftW; // 86mm
  const splitX = margin + splitLeftW;

  if (layout === 'classic') {
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
    pdf.setLineWidth(0.4);
    pdf.rect(margin, y, contentWidth, particularsH, 'S');
    pdf.line(splitX, y, splitX, y + particularsH);
  } else if (layout === 'minimalist') {
    pdf.setDrawColor(colors.borderSubtle.rgb[0], colors.borderSubtle.rgb[1], colors.borderSubtle.rgb[2]);
    pdf.setLineWidth(0.2);
    pdf.line(splitX, y + 2, splitX, y + particularsH - 2);
    pdf.line(margin, y + particularsH, margin + contentWidth, y + particularsH);
  } else {
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(colors.borderStandard.rgb[0], colors.borderStandard.rgb[1], colors.borderStandard.rgb[2]);
    pdf.setLineWidth(0.3);
    pdf.rect(margin, y, contentWidth, particularsH, 'S');
    pdf.line(splitX, y, splitX, y + particularsH);
  }

  // --- LEFT SIDE: Amount in Words, Remarks, Bank Details ---
  let leftY = y + 4.5;
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(6.4);
  pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.text('AMOUNT CHARGEABLE IN WORDS:', margin + 3, leftY);
  leftY += 3.8;

  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.2);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  const wordsLines = pdf.splitTextToSize(t.amountInWords, splitLeftW - 6);
  wordsLines.slice(0, 2).forEach((wl: string) => {
    pdf.text(wl, margin + 3, leftY);
    leftY += 3.4;
  });

  leftY += 1;
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(6.4);
  pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.text('PURPOSE OF DISPATCH / REMARKS:', margin + 3, leftY);
  leftY += 3.4;

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(colors.textBody.rgb[0], colors.textBody.rgb[1], colors.textBody.rgb[2]);
  pdf.text(pdf.splitTextToSize(t.remarksText, splitLeftW - 6)[0], margin + 3, leftY);
  leftY += 4.5;

  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(6.4);
  pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.text('BANK ACCOUNT & PAYMENT DETAILS:', margin + 3, leftY);
  leftY += 3.4;

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(colors.textBody.rgb[0], colors.textBody.rgb[1], colors.textBody.rgb[2]);
  if (company.bankDetails?.bankName) {
    pdf.text(
      `Bank: ${company.bankDetails.bankName} (A/C: ${company.bankDetails.accountNumber || 'N/A'})`,
      margin + 3,
      leftY
    );
    leftY += 3.2;
    pdf.text(
      `IFSC: ${company.bankDetails.ifscSwift || 'N/A'}    |    Branch: ${company.bankDetails.branch || 'Mumbai'}${company.bankDetails.upiId ? `    |    UPI: ${company.bankDetails.upiId}` : ''}`,
      margin + 3,
      leftY
    );
  } else {
    pdf.text('Direct Electronic Wire / NEFT / RTGS / UPI Transfer Available', margin + 3, leftY);
  }

  // --- RIGHT SIDE: Financial Totals Breakdown ---
  let rightY = y + 4.5;
  const rightLabelX = splitX + 3.5;
  const rightValX = margin + contentWidth - 3.5;

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(7.2);
  pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);

  pdf.text('Total Taxable Value:', rightLabelX, rightY);
  pdf.setFont(docFont, 'bold');
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text(`${t.pdfCurrencySymbol} ${doc.subtotal.toFixed(2)}`, rightValX, rightY, { align: 'right' });
  rightY += 4.5;

  pdf.setFont(docFont, 'normal');
  pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);

  if (t.isInterState) {
    pdf.text(`Total IGST (${doc.taxRate}%):`, rightLabelX, rightY);
    pdf.setFont(docFont, 'bold');
    pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
    pdf.text(`${t.pdfCurrencySymbol} ${doc.taxAmount.toFixed(2)}`, rightValX, rightY, { align: 'right' });
    rightY += 4.5;
  } else {
    pdf.text(`Total CGST (${t.halfRate}%):`, rightLabelX, rightY);
    pdf.setFont(docFont, 'bold');
    pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
    pdf.text(`${t.pdfCurrencySymbol} ${t.cgstVal.toFixed(2)}`, rightValX, rightY, { align: 'right' });
    rightY += 4;

    pdf.setFont(docFont, 'normal');
    pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
    pdf.text(`Total SGST (${t.halfRate}%):`, rightLabelX, rightY);
    pdf.setFont(docFont, 'bold');
    pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
    pdf.text(`${t.pdfCurrencySymbol} ${t.sgstVal.toFixed(2)}`, rightValX, rightY, { align: 'right' });
    rightY += 4.5;
  }

  if (doc.shippingCharges > 0) {
    pdf.setFont(docFont, 'normal');
    pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
    pdf.text('Shipping & Handling:', rightLabelX, rightY);
    pdf.setFont(docFont, 'bold');
    pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
    pdf.text(`${t.pdfCurrencySymbol} ${doc.shippingCharges.toFixed(2)}`, rightValX, rightY, { align: 'right' });
    rightY += 4.5;
  }

  // Grand Total Highlight
  if (layout === 'classic') {
    pdf.setFillColor(colors.bgHeader.rgb[0], colors.bgHeader.rgb[1], colors.bgHeader.rgb[2]);
    pdf.rect(splitX, rightY - 1, splitRightW, 7, 'F');
    pdf.setDrawColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
    pdf.setLineWidth(0.4);
    pdf.line(splitX, rightY - 1, margin + contentWidth, rightY - 1);
    pdf.line(splitX, rightY + 6, margin + contentWidth, rightY + 6);
    pdf.line(splitX, rightY + 7, margin + contentWidth, rightY + 7);
  } else if (layout === 'minimalist') {
    pdf.setDrawColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
    pdf.setLineWidth(0.3);
    pdf.line(splitX, rightY - 1, margin + contentWidth, rightY - 1);
  } else {
    pdf.setFillColor(colors.bgHeader.rgb[0], colors.bgHeader.rgb[1], colors.bgHeader.rgb[2]);
    pdf.rect(splitX, rightY - 1, splitRightW, 7, 'F');
    pdf.setDrawColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
    pdf.setLineWidth(0.4);
    pdf.line(splitX, rightY - 1, margin + contentWidth, rightY - 1);
    pdf.line(splitX, rightY + 6, margin + contentWidth, rightY + 6);
  }

  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text('Grand Total:', rightLabelX, rightY + 3.8);
  pdf.text(`${t.pdfCurrencySymbol} ${doc.grandTotal.toFixed(2)}`, rightValX, rightY + 3.8, { align: 'right' });
  rightY += 8.5;

  if (doc.paidAmount > 0) {
    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(16, 185, 129); // emerald-500
    pdf.text('Paid Amount:', rightLabelX, rightY);
    pdf.text(`${t.pdfCurrencySymbol} ${doc.paidAmount.toFixed(2)}`, rightValX, rightY, { align: 'right' });
    rightY += 3.5;

    const balanceDue = Math.max(0, doc.grandTotal - doc.paidAmount);
    pdf.setFont(docFont, 'bold');
    pdf.setTextColor(220, 38, 38); // red-600
    pdf.text('Balance Due:', rightLabelX, rightY);
    pdf.text(`${t.pdfCurrencySymbol} ${balanceDue.toFixed(2)}`, rightValX, rightY, { align: 'right' });
  }

  y += particularsH + 2.5;

  // ==========================================
  // 9. DECLARATIONS, TERMS & DUAL SIGNATURES
  // ==========================================
  const bottomBoxH = 26;

  if (layout === 'classic') {
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
    pdf.setLineWidth(0.4);
    pdf.rect(margin, y, contentWidth, bottomBoxH, 'S');
    pdf.line(splitX, y, splitX, y + bottomBoxH);
  } else if (layout === 'minimalist') {
    pdf.setDrawColor(colors.borderSubtle.rgb[0], colors.borderSubtle.rgb[1], colors.borderSubtle.rgb[2]);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, margin + contentWidth, y);
  } else {
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(colors.borderStandard.rgb[0], colors.borderStandard.rgb[1], colors.borderStandard.rgb[2]);
    pdf.setLineWidth(0.3);
    pdf.rect(margin, y, contentWidth, bottomBoxH, 'S');
    pdf.line(splitX, y, splitX, y + bottomBoxH);
  }

  // Left: Declaration & Terms
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(6.2);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text('DECLARATION & TERMS:', margin + 3, y + 4);

  pdf.setFont(docFont, 'italic');
  pdf.setFontSize(6);
  pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  const decLines = pdf.splitTextToSize(t.config.legalDeclaration, splitLeftW - 6);
  pdf.text(decLines.slice(0, 2), margin + 3, y + 7.5);

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(6);
  pdf.text(`• All matters are subject to ${company.city || 'Mumbai'} Jurisdiction`, margin + 3, y + 14);

  // Receiver's Signature line
  pdf.setDrawColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.line(margin + 5, y + 21, margin + 45, y + 21);
  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(6.2);
  pdf.setTextColor(colors.textSecondary.rgb[0], colors.textSecondary.rgb[1], colors.textSecondary.rgb[2]);
  pdf.text("Receiver's Signature", margin + 25, y + 24.5, { align: 'center' });

  // Right: Authorized Signatory
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(6.8);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  const forCompText = `FOR ${company.name || 'SUTRAA CREATIONS PRIVATE LIMITED'}`;
  pdf.text(forCompText, margin + contentWidth - 3, y + 4, { align: 'right' });

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(5.8);
  pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.text('Authorized Signatory', margin + contentWidth - 3, y + 7, { align: 'right' });

  // Stamp & Signature Images
  const stampUrl = doc.includeStamp !== false ? doc.stampUrl || company.stampUrl : null;
  const signatureUrl = doc.includeSignature !== false ? doc.signatureUrl || company.signatureUrl : null;

  if (stampUrl) {
    try {
      pdf.addImage(stampUrl, 'PNG', splitX + 6, y + 6, 14, 14);
    } catch {
      try {
        pdf.addImage(stampUrl, 'JPEG', splitX + 6, y + 6, 14, 14);
      } catch (e) {
        console.warn('Could not add stamp to PDF', e);
      }
    }
  }

  if (signatureUrl) {
    try {
      pdf.addImage(signatureUrl, 'PNG', margin + contentWidth - 38, y + 8, 28, 11);
    } catch {
      try {
        pdf.addImage(signatureUrl, 'JPEG', margin + contentWidth - 38, y + 8, 28, 11);
      } catch (e) {
        console.warn('Could not add signature to PDF', e);
      }
    }
  }

  // Signatory Line and Name
  pdf.setDrawColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.line(margin + contentWidth - 48, y + 21, margin + contentWidth - 4, y + 21);
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(6.4);
  pdf.setTextColor(colors.textMain.rgb[0], colors.textMain.rgb[1], colors.textMain.rgb[2]);
  pdf.text(t.signatoryName, margin + contentWidth - 26, y + 24.5, { align: 'center' });

  // ==========================================
  // 10. BOTTOM COMPUTER-GENERATED NOTICE
  // ==========================================
  pdf.setFont(docFont, 'italic');
  pdf.setFontSize(6);
  pdf.setTextColor(colors.textMuted.rgb[0], colors.textMuted.rgb[1], colors.textMuted.rgb[2]);
  pdf.text(t.config.footerNotice, pageWidth / 2, 292, { align: 'center' });

  return pdf;
}

export function downloadDocumentPdf(doc: Document, company: CompanyProfile, currencies: CurrencyConfig[] = []): void {
  const pdf = generateDocumentPdf(doc, company, currencies);
  const fileName = `${doc.documentNumber}_${doc.clientCompany || doc.clientName}`.replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';
  pdf.save(fileName);
}

export function generateDocumentPdfBlob(doc: Document, company: CompanyProfile, currencies: CurrencyConfig[] = []): Blob {
  const pdf = generateDocumentPdf(doc, company, currencies);
  return pdf.output('blob');
}
