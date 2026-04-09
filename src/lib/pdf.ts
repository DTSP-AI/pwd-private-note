import { jsPDF } from "jspdf";
import { fmt, fmtDate, sixMonthsOut, calcInterest } from "./shares";

interface PdfData {
  refNum: string;
  amount: number;
  shares: number;
  startDate: string;
  lateFee: string;
  county: string;
  lName: string;
  lAddr: string;
  lCity: string;
  lZip: string;
  lEmail: string;
  lPhone: string;
  lDate: string;
  bName: string;
  bAddr: string;
  bCity: string;
  bZip: string;
  bEmail: string;
  bPhone: string;
  bDate: string;
  lSigData: string;
  bSigData: string;
}

export function buildContractPDF(d: PdfData): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const ml = 16, mr = 16, mt = 18, W = 216, H = 279, cw = W - ml - mr;
  const col2 = ml + cw / 2 + 5;
  let y = mt;

  const P = d.amount;
  const interest = calcInterest(P);
  const total = P + interest;
  const county = d.county || "Pinellas";
  const lf = d.lateFee || "5";

  doc.setFont("times", "bold"); doc.setFontSize(14);
  doc.text("PERSONAL PROMISSORY NOTE AND STOCK PLEDGE AGREEMENT", W / 2, y, { align: "center" }); y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(130);
  doc.text(`Agreement No: ${d.refNum}   ·   State of Florida   ·   Borrower: Peter W Davidsmeier`, W / 2, y, { align: "center" }); y += 4;
  doc.setFont("helvetica", "italic"); doc.setFontSize(7); doc.setTextColor(150);
  doc.text("NOTE: DealWhisper Inc. is NOT a party to this Agreement and assumes no liability hereunder.", W / 2, y, { align: "center" });
  y += 5;
  doc.setTextColor(0); doc.setDrawColor(190); doc.line(ml, y, W - mr, y); y += 6;

  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("PARTIES", ml, y); y += 5;
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
  doc.text("LENDER", ml, y); doc.text("BORROWER", col2, y); y += 4;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
  const rows: [string, string][] = [
    [d.lName, d.bName],
    [d.lAddr, d.bAddr],
    [(d.lCity + ", FL " + d.lZip).trim(), (d.bCity + ", FL " + d.bZip).trim()],
    [d.lEmail, d.bEmail],
    [d.lPhone, d.bPhone],
  ];
  rows.forEach(([l, b]) => {
    if (l || b) { doc.text(l || "", ml, y); doc.text(b || "", col2, y); y += 3.8; }
  });

  y += 2; doc.line(ml, y, W - mr, y); y += 5;

  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("LOAN TERMS", ml, y); y += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
  const terms: [string, string][] = [
    ["Principal amount", fmt(P)],
    ["Annual interest rate", "5.00% per annum"],
    ["Agreement date", fmtDate(d.startDate)],
    ["Interest at 6 months (actual/365 × 182)", fmt(interest)],
    ["Total due at repayment", fmt(total)],
    ["Late fee", lf + "% of overdue amount"],
    ["Governing venue", county + " County, Florida"],
  ];
  terms.forEach(([k, val]) => {
    doc.setTextColor(120); doc.text(k, ml, y);
    doc.setTextColor(0); doc.text(val, ml + 75, y); y += 4.2;
  });

  y += 2; doc.line(ml, y, W - mr, y); y += 5;

  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("SHARE PLEDGE / COLLATERAL", ml, y); y += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
  const pledgeTerms: [string, string][] = [
    ["Company issuing shares", "DealWhisper Inc. (Florida C Corporation) — NOT a party hereto"],
    ["Pledgor (personal capacity)", d.bName || "Borrower"],
    ["Pledgor total personal ownership", "40,000 shares (40% of outstanding common stock)"],
    ["Shares pledged as collateral", d.shares.toLocaleString() + " shares of Common Stock"],
    ["Company obligation", "NONE — this is a personal obligation of Borrower only"],
    ["Lender recourse against company", "NONE — Lender's sole recourse is Borrower personally and the Pledged Shares"],
    ["Pledge condition", "Collateral only — no transfer absent written default notice to Borrower"],
  ];
  pledgeTerms.forEach(([k, val]) => {
    doc.setTextColor(120); doc.text(k, ml, y);
    doc.setTextColor(0);
    const lines = doc.splitTextToSize(val, cw - 65);
    doc.text(lines, ml + 65, y); y += Math.max(4.2, lines.length * 3.8);
  });

  y += 2; doc.line(ml, y, W - mr, y); y += 5;

  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("REPAYMENT TRIGGER", ml, y); y += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(0);
  const triggerText = `The entire unpaid principal balance and all accrued interest shall become due and payable in full on the earlier of: (a) the date that is six (6) months from the Agreement Date written above; or (b) the date on which Borrower receives and has access to the proceeds of a Qualified Financing (defined as any priced equity financing resulting in gross proceeds to DealWhisper Inc. of at least $500,000). Borrower shall provide written notice to Lender within five (5) business days of a Qualified Financing closing.`;
  const trigLines = doc.splitTextToSize(triggerText, cw);
  doc.text(trigLines, ml, y); y += trigLines.length * 3.5 + 3;

  doc.line(ml, y, W - mr, y); y += 5;

  if (y > 170) { doc.addPage(); y = mt; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("TERMS AND CONDITIONS", ml, y); y += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(55);
  const clauses = [
    `1. PERSONAL OBLIGATION. This Agreement is the personal, individual obligation of Borrower only. DealWhisper Inc. (the "Company") is not a party to this Agreement, has not guaranteed this obligation, and assumes no liability whatsoever hereunder. Lender acknowledges that this is a personal loan to Borrower in Borrower's individual capacity, not a loan to or investment in the Company.`,
    `2. DISBURSEMENT. Lender agrees to advance the Principal Amount directly to Borrower personally on or about the Agreement Date. Borrower acknowledges receipt and agrees to repay in full with interest per the Repayment Trigger above.`,
    `3. INTEREST. Interest accrues at 5.00% per annum on the outstanding principal balance, calculated on an actual/365-day basis from the Agreement Date until repayment in full. Pursuant to Florida Statute § 687.02, interest may not exceed 18% per annum; any excess shall be automatically reduced to the statutory maximum.`,
    `4. REPAYMENT TRIGGER. The entire unpaid principal and accrued interest shall be due and payable in full on the earlier of: (a) the date that is six (6) months from the Agreement Date; or (b) the date on which Borrower personally receives and has access to proceeds from a Qualified Financing — defined as a priced equity financing of the Company resulting in gross proceeds of at least $500,000. For the avoidance of doubt, this trigger refers to Borrower's personal receipt of compensation, distributions, or liquidity from such financing, not the Company's receipt of funds.`,
    `5. PREPAYMENT. Borrower may prepay this obligation in whole or in part at any time without penalty.`,
    `6. LATE PAYMENT. Any amount not paid within ten (10) days of its due date shall accrue a late fee of ${lf}% of the overdue amount, not to exceed Florida's usury limit.`,
    `7. STOCK PLEDGE. As security for Borrower's personal obligations hereunder, Borrower hereby pledges ${d.shares.toLocaleString()} shares of Common Stock of DealWhisper Inc. (the "Pledged Shares") standing in Borrower's name as collateral. The Pledged Shares shall remain registered in Borrower's name during the term. This pledge: (a) does not alter or impair Borrower's voting or economic rights in the shares; (b) does not give Lender any rights against the Company; (c) does not constitute a transfer of shares; and (d) does not appear on the Company's cap table as an encumbrance until an Event of Default is declared in writing. Lender agrees to keep the existence of this pledge confidential and shall not disclose it to the Company, its co-founders, investors, or any third party without Borrower's prior written consent.`,
    `8. DEFAULT & REMEDY. An Event of Default occurs if Borrower: (a) fails to repay within the 10-day grace period; (b) files for personal bankruptcy; or (c) fraudulently transfers the Pledged Shares. Upon default and written notice to Borrower, Lender may declare all sums immediately due and/or cause transfer of the Pledged Shares to Lender in satisfaction of the obligation. The Company has no obligation to recognize such transfer except as required by its governing documents.`,
    `9. NO COMPANY LIABILITY. Lender expressly acknowledges and agrees that: (i) DealWhisper Inc. is not a party hereto; (ii) Lender has no claim against the Company, its assets, its other shareholders, or its officers or directors by reason of this Agreement; (iii) this Agreement does not constitute an equity or debt investment in the Company; and (iv) the Pledged Shares represent collateral only and do not give Lender shareholder rights absent a completed transfer following an uncured Event of Default.`,
    `10. GOVERNING LAW. This Agreement is governed by Florida law. The parties consent to exclusive jurisdiction in ${county} County, Florida. Florida Statute § 95.11(5)(b) provides a five (5) year statute of limitations.`,
    `11. ENTIRE AGREEMENT. This instrument constitutes the entire agreement of the parties. Any amendment must be in writing signed by both parties.`,
    `12. SEVERABILITY. If any provision is unenforceable under Florida law, the remaining provisions remain in full force.`,
  ];
  clauses.forEach((c) => {
    const lines = doc.splitTextToSize(c, cw);
    if (y + lines.length * 3.4 > H - 50) { doc.addPage(); y = mt; }
    doc.text(lines, ml, y); y += lines.length * 3.4 + 2;
  });

  y += 3; doc.setDrawColor(190); doc.line(ml, y, W - mr, y); y += 5;
  if (y > H - 55) { doc.addPage(); y = mt; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(0);
  doc.text("SIGNATURES", ml, y); y += 4;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(80);
  doc.text("By signing below, each party acknowledges they have read and agree to all terms of this Agreement.", ml, y); y += 6;

  const sigW = cw / 2 - 5;
  try { doc.addImage(d.lSigData, "PNG", ml, y, sigW, 22); } catch {}
  try { doc.addImage(d.bSigData, "PNG", col2 - 5, y, sigW, 22); } catch {}
  y += 24;
  doc.setTextColor(0); doc.setFontSize(7.5);
  doc.text("LENDER: " + (d.lName || "___________________"), ml, y);
  doc.text("BORROWER: " + (d.bName || "___________________"), col2 - 5, y); y += 4;
  doc.setTextColor(120);
  doc.text("Date: " + fmtDate(d.lDate), ml, y);
  doc.text("Date: " + fmtDate(d.bDate), col2 - 5, y); y += 5;

  doc.line(ml, y, W - mr, y); y += 4;
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(80);
  doc.text("PAYMENT INSTRUCTIONS", ml, y); y += 4;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7);
  doc.text(`Option 1 — Zelle: Send ${fmt(P)} to 727-400-2225 (Pete / DealWhisper Borrower)`, ml, y); y += 3.5;
  doc.text(`Option 2 — Cash App: Send ${fmt(P)} to $jlkern58`, ml, y); y += 3.5;
  doc.text(`Memo: DealWhisper Loan ${d.refNum}`, ml, y); y += 3.5;
  doc.setTextColor(150);
  doc.text("This document is legally binding under Florida law. Retain a signed copy for your records.", ml, y);

  return doc;
}

export function buildCertificatePDF(d: PdfData): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
  const W = 279, H = 216;

  doc.setDrawColor(180, 155, 80);
  doc.setLineWidth(1.5);
  doc.rect(12, 10, W - 24, H - 20);
  doc.setLineWidth(0.4);
  doc.rect(15, 13, W - 30, H - 26);

  const corners: [number, number][] = [[15, 13], [W - 15, 13], [15, H - 13], [W - 15, H - 13]];
  doc.setLineWidth(0.3);
  corners.forEach(([x, y]) => {
    const dx = x < W / 2 ? 1 : -1;
    const dy = y < H / 2 ? 1 : -1;
    doc.line(x, y + dy * 8, x + dx * 8, y);
  });

  let y = 32;

  doc.setFont("times", "normal"); doc.setFontSize(11); doc.setTextColor(140, 120, 60);
  doc.text("DealWhisper Inc.", W / 2, y, { align: "center" }); y += 6;
  doc.setTextColor(100, 85, 45); doc.setFontSize(8);
  doc.text("A Florida C Corporation", W / 2, y, { align: "center" }); y += 12;

  doc.setFont("times", "bold"); doc.setFontSize(28); doc.setTextColor(50, 42, 20);
  doc.text("Stock Certificate", W / 2, y, { align: "center" }); y += 8;
  doc.setFont("times", "normal"); doc.setFontSize(10); doc.setTextColor(120, 100, 50);
  doc.text("Common Stock — Collateral Pledge", W / 2, y, { align: "center" }); y += 4;

  doc.setDrawColor(180, 155, 80); doc.setLineWidth(0.5);
  doc.line(W / 2 - 60, y, W / 2 + 60, y); y += 10;

  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(130);
  doc.text("Certificate No: " + d.refNum, W / 2, y, { align: "center" }); y += 10;

  doc.setFont("times", "bold"); doc.setFontSize(42); doc.setTextColor(40, 35, 15);
  doc.text(d.shares.toLocaleString(), W / 2, y, { align: "center" }); y += 7;
  doc.setFont("times", "normal"); doc.setFontSize(12); doc.setTextColor(100, 85, 45);
  doc.text("Shares of Common Stock", W / 2, y, { align: "center" }); y += 12;

  doc.setFont("times", "normal"); doc.setFontSize(10); doc.setTextColor(60);
  const body = `This certifies that ${d.lName || "___"} is entitled to ${d.shares.toLocaleString()} shares of Common Stock of DealWhisper Inc., pledged as collateral by ${d.bName} pursuant to the Personal Promissory Note and Stock Pledge Agreement (${d.refNum}) dated ${fmtDate(d.startDate)}. These shares are held as collateral only and do not transfer unless an Event of Default occurs per the terms of said agreement.`;
  const bodyLines = doc.splitTextToSize(body, W - 70);
  doc.text(bodyLines, W / 2, y, { align: "center", maxWidth: W - 70 }); y += bodyLines.length * 4.5 + 8;

  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100);
  doc.text(`Loan Principal: ${fmt(d.amount)}   |   Share Rate: 20%   |   Governed by Florida Law`, W / 2, y, { align: "center" }); y += 12;

  const sigY = y;
  const sigW = 70;
  const leftX = W / 2 - sigW - 20;
  const rightX = W / 2 + 20;

  doc.setDrawColor(160); doc.setLineWidth(0.3);
  doc.line(leftX, sigY, leftX + sigW, sigY);
  doc.line(rightX, sigY, rightX + sigW, sigY);

  try { doc.addImage(d.bSigData, "PNG", leftX, sigY - 18, sigW, 17); } catch {}
  try { doc.addImage(d.lSigData, "PNG", rightX, sigY - 18, sigW, 17); } catch {}

  doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(80);
  doc.text("ISSUER / BORROWER", leftX, sigY + 4);
  doc.text("HOLDER / LENDER", rightX, sigY + 4);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(40);
  doc.text(d.bName, leftX, sigY + 9);
  doc.text(d.lName || "___", rightX, sigY + 9);
  doc.setFontSize(7); doc.setTextColor(120);
  doc.text("Date: " + fmtDate(d.bDate), leftX, sigY + 13);
  doc.text("Date: " + fmtDate(d.lDate), rightX, sigY + 13);

  doc.setFont("helvetica", "italic"); doc.setFontSize(6.5); doc.setTextColor(160);
  doc.text("This certificate is issued as collateral documentation only. DealWhisper Inc. is not a party to this transaction.", W / 2, H - 18, { align: "center" });
  doc.text("Transfer of shares requires written default notice per the governing agreement. Consult a Florida-licensed attorney.", W / 2, H - 14, { align: "center" });

  return doc;
}
