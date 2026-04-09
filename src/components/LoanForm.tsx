"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import SignatureCanvas, { type SignatureCanvasHandle } from "./SignatureCanvas";
import { TIERS, CUSTOM_OPTIONS, calcShares, calcInterest, fmt, fmtDate, sixMonthsOut, ZELLE_PHONE } from "@/lib/shares";
import { buildContractPDF, buildCertificatePDF } from "@/lib/pdf";

const STORE_KEY = "dw_loan_v3";
const STEP_LABELS = [
  "Step 1 of 5 — Select investment tier",
  "Step 2 of 5 — Loan terms",
  "Step 3 of 5 — Lender information",
  "Step 4 of 5 — Borrower information",
  "Step 5 of 5 — Review & execute",
];

function genRef() {
  return "DW-" + Math.random().toString(36).substr(2, 8).toUpperCase();
}

const today = new Date().toISOString().slice(0, 10);

interface FormData {
  startDate: string;
  lateFee: string;
  county: string;
  lName: string; lAddr: string; lCity: string; lZip: string; lEmail: string; lPhone: string; lDate: string;
  bName: string; bAddr: string; bCity: string; bZip: string; bEmail: string; bPhone: string; bDate: string;
}

const defaultForm: FormData = {
  startDate: today, lateFee: "5", county: "",
  lName: "", lAddr: "", lCity: "", lZip: "", lEmail: "", lPhone: "", lDate: today,
  bName: "Peter W Davidsmeier", bAddr: "2574 37th Ave N", bCity: "St Petersburg",
  bZip: "33713", bEmail: "pete@dealwhisper.com", bPhone: "(727) 400-2225", bDate: today,
};

export default function LoanForm() {
  const [step, setStep] = useState(0);
  const [selTier, setSelTier] = useState(-1);
  const [customAmt, setCustomAmt] = useState(0);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [refNum, setRefNum] = useState("");
  const [restored, setRestored] = useState<boolean | null>(null);

  const lSigRef = useRef<SignatureCanvasHandle>(null);
  const bSigRef = useRef<SignatureCanvasHandle>(null);

  // Generate ref on client only
  useEffect(() => {
    setRefNum(genRef());
  }, []);

  // Check localStorage for saved session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.refNum) setRestored(false); // show banner
      }
    } catch {}
  }, []);

  const save = useCallback(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ refNum, selTier, customAmt, ...form }));
    } catch {}
  }, [refNum, selTier, customAmt, form]);

  useEffect(() => { if (refNum) save(); }, [save, refNum]);

  const restoreSession = () => {
    try {
      const d = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      if (d.refNum) setRefNum(d.refNum);
      if (d.selTier !== undefined) setSelTier(d.selTier);
      if (d.customAmt) setCustomAmt(d.customAmt);
      const f = { ...defaultForm };
      (Object.keys(defaultForm) as (keyof FormData)[]).forEach((k) => {
        if (d[k] !== undefined) f[k] = d[k];
      });
      setForm(f);
    } catch {}
    setRestored(true);
  };

  const clearSession = () => {
    localStorage.removeItem(STORE_KEY);
    setRestored(true);
  };

  const updateField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const amount = selTier >= 0 && selTier < 3 ? TIERS[selTier].amount : customAmt;
  const shares = selTier >= 0 && selTier < 3 ? TIERS[selTier].shares : calcShares(customAmt);
  const interest = calcInterest(amount);
  const total = amount + interest;

  const getPdfData = () => ({
    refNum, amount, shares,
    ...form,
    lSigData: lSigRef.current?.toDataURL() || "",
    bSigData: bSigRef.current?.toDataURL() || "",
  });

  const exportContract = () => {
    try { buildContractPDF(getPdfData()).save(`DealWhisper_Loan_${refNum}.pdf`); }
    catch { alert("PDF generation failed."); }
  };

  const exportCert = () => {
    try { buildCertificatePDF(getPdfData()).save(`DealWhisper_StockCertificate_${refNum}.pdf`); }
    catch { alert("Certificate generation failed."); }
  };

  const goTo = (n: number) => {
    setStep(n);
    window.scrollTo(0, 0);
  };

  // Shared input classes
  const inputCls = "w-full text-[15px] px-3.5 py-3 border border-[rgba(255,255,255,0.07)] rounded-xl bg-[#141720] text-[#f0ede8] font-[family-name:var(--font-dm-sans)] focus:outline-none focus:border-[#c9a84c] focus:ring-3 focus:ring-[rgba(201,168,76,0.25)] transition-colors placeholder:text-[#5a5e78]";
  const selectCls = inputCls + " cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%278%27%20viewBox=%270%200%2012%208%27%3E%3Cpath%20d=%27M1%201l5%205%205-5%27%20stroke=%27%238b8fa8%27%20stroke-width=%271.5%27%20fill=%27none%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_14px_center]";
  const labelCls = "block text-[11px] font-medium tracking-[0.06em] uppercase text-text2 mb-1.5";

  return (
    <>
      {/* HEADER */}
      <div className="px-5 pt-6 pb-4 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-lg bg-gradient-to-br from-gold to-[#8a6020] flex items-center justify-center text-base shrink-0">
            🤫
          </div>
          <div>
            <div className="font-[family-name:var(--font-cormorant)] text-[17px] font-semibold tracking-[0.04em]">
              Peter W Davidsmeier
            </div>
            <div className="text-[10px] text-text2 tracking-[0.1em] uppercase mt-px">
              Personal Promissory Note & Stock Pledge
            </div>
          </div>
        </div>
        <div className="font-[family-name:var(--font-dm-mono)] text-[10px] text-text3 bg-bg3 border border-border rounded-md px-2 py-1 mt-0.5">
          {refNum || "\u2014"}
        </div>
      </div>

      {/* RESTORE BANNER */}
      {restored === false && (
        <div className="mx-5 mb-3 bg-bg3 border border-border2 rounded-xl px-3.5 py-2.5 flex justify-between items-center text-xs text-text2 animate-[fadeIn_0.3s_ease]">
          <span>Saved session found. Restore your data?</span>
          <div className="flex gap-2">
            <button onClick={restoreSession} className="text-xs font-semibold px-2.5 py-1 rounded-md bg-gold text-[#0d0f14]">Restore</button>
            <button onClick={clearSession} className="text-xs font-semibold px-2.5 py-1 rounded-md bg-bg2 text-text2 border border-border">Start fresh</button>
          </div>
        </div>
      )}

      {/* PROGRESS */}
      <div className="mx-5 mb-6 grid grid-cols-5 gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-[3px] rounded-sm transition-colors ${i < step ? "bg-gold" : i === step ? "bg-gold2" : "bg-bg3"}`} />
        ))}
      </div>
      <div className="text-center text-[11px] text-text2 tracking-[0.04em] mb-5 mx-5">
        {STEP_LABELS[step]}
      </div>

      {/* STEP 1: TIER SELECTION */}
      {step === 0 && (
        <div className="px-5 animate-[fadeIn_0.25s_ease]">
          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gold-dim border border-border2 text-[11px] font-semibold text-gold mb-3">1</div>
          <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] font-semibold leading-tight tracking-[-0.3px] mb-1.5">
            Select Investment<br />Tier
          </h2>
          <p className="text-[13px] text-text2 mb-6 leading-relaxed">
            This is a <strong className="text-text">personal promissory note</strong> — Pete personally borrows from a private lender. DealWhisper Inc. is <em>not</em> a party and has no obligation under this agreement. Shares from Pete&apos;s personal allocation are pledged as collateral only. Repayment is due 6 months from signing or upon Pete receiving proceeds from a VC financing — whichever comes first.
          </p>

          <div className="grid gap-2.5 mb-5">
            {TIERS.map((tier, idx) => (
              <div
                key={idx}
                className={`border rounded-2xl p-4 cursor-pointer bg-bg2 transition-all relative overflow-hidden ${
                  selTier === idx ? "border-gold bg-bg3" : "border-border hover:border-border2 hover:-translate-y-px"
                }`}
              >
                <div onClick={() => { if (idx < 3) { setSelTier(idx); setCustomAmt(0); } else { setSelTier(3); } }}>
                  <div className="flex justify-between items-start">
                    <div>
                      {tier.tag && (
                        <span className="inline-block text-[9px] font-semibold tracking-[0.12em] uppercase bg-gold text-[#0d0f14] rounded px-1.5 py-0.5 mb-1.5">
                          {tier.tag}
                        </span>
                      )}
                      <div className="font-[family-name:var(--font-cormorant)] text-[32px] font-bold text-gold2 leading-none">
                        {idx < 3 ? tier.label : (customAmt > 0 ? fmt(customAmt) : "Custom")}
                      </div>
                      <div className="text-[13px] text-text2 mt-1">
                        {idx < 3 ? (
                          <>Pledged: <strong className="text-text font-medium">{tier.shares.toLocaleString()} shares</strong></>
                        ) : (
                          customAmt > 0 ? <>Pledged: <strong className="text-text font-medium">{calcShares(customAmt).toLocaleString()} shares</strong></> : "Select amount below"
                        )}
                      </div>
                      <div className="font-[family-name:var(--font-dm-mono)] text-[10px] text-text3 mt-1">20% share rate</div>
                    </div>
                    <div className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      selTier === idx ? "bg-gold border-gold" : "border-text3"
                    }`}>
                      <svg width="12" height="10" viewBox="0 0 12 10" className={selTier === idx ? "opacity-100" : "opacity-0"}>
                        <path d="M1 5l3.5 3.5L11 1" stroke="#0d0f14" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Custom dropdown - OUTSIDE the click handler div */}
                {idx === 3 && selTier === 3 && (
                  <div className="mt-3">
                    <div className="text-[11px] text-gold italic mb-2">20% share rate — choose your loan amount</div>
                    <div>
                      <label className={labelCls}>Loan Amount ($)</label>
                      <select
                        className={selectCls}
                        value={customAmt}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 0;
                          setCustomAmt(v);
                        }}
                      >
                        <option value={0}>--- Select amount ---</option>
                        {CUSTOM_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label} — {opt.shares.toLocaleString()} shares
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {selTier >= 0 && (
            <div className="bg-bg3 border border-border2 rounded-xl p-3.5 mb-5">
              <div className="text-[11px] font-semibold text-gold uppercase tracking-[0.1em] mb-2">Summary</div>
              <div className="flex justify-between text-[13px] py-1"><span className="text-text2">Loan amount</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">{amount > 0 ? fmt(amount) : "\u2014"}</span></div>
              <div className="flex justify-between text-[13px] py-1"><span className="text-text2">Shares pledged as collateral</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">{shares > 0 ? shares.toLocaleString() + " shares" : "\u2014"}</span></div>
              <div className="flex justify-between text-[13px] py-1"><span className="text-text2">Pete&apos;s personal ownership</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">40% (40,000 shares)</span></div>
              <div className="flex justify-between text-[13px] py-1"><span className="text-text2">Company obligation</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium text-danger">None — personal note only</span></div>
              <div className="border-t border-border my-2" />
              <div className="flex justify-between text-[13px] py-1"><span className="text-text2">Interest rate</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">5% per annum</span></div>
              <div className="flex justify-between text-[13px] py-1"><span className="text-text2">Repayment trigger</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">6 months or VC close</span></div>
            </div>
          )}

          <div className="mt-7">
            <button onClick={() => goTo(1)} className="w-full py-4 rounded-xl text-[15px] font-semibold bg-gradient-to-br from-gold to-[#a87828] text-[#0d0f14] shadow-[0_4px_20px_rgba(201,168,76,0.3)] hover:shadow-[0_6px_28px_rgba(201,168,76,0.45)] active:scale-[0.97] transition-all">
              Continue — Loan Terms
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: LOAN TERMS */}
      {step === 1 && (
        <div className="px-5 animate-[fadeIn_0.25s_ease]">
          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gold-dim border border-border2 text-[11px] font-semibold text-gold mb-3">2</div>
          <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] font-semibold leading-tight mb-1.5">Loan Terms</h2>
          <p className="text-[13px] text-text2 mb-6 leading-relaxed">These terms are auto-filled based on your tier. Adjust the start date and confirm details.</p>

          <div className="mb-3.5">
            <label className={labelCls}>Agreement date</label>
            <input type="date" className={inputCls} value={form.startDate} onChange={(e) => updateField("startDate", e.target.value)} />
          </div>

          <div className="bg-bg3 border border-border2 rounded-xl p-3.5 mb-5">
            <div className="text-[11px] font-semibold text-gold uppercase tracking-[0.1em] mb-2">Loan Details</div>
            <div className="flex justify-between text-[13px] py-1"><span className="text-text2">Principal</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">{amount > 0 ? fmt(amount) : "\u2014"}</span></div>
            <div className="flex justify-between text-[13px] py-1"><span className="text-text2">Annual interest rate</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">5.00%</span></div>
            <div className="flex justify-between text-[13px] py-1"><span className="text-text2">Accrued interest at 6 months</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">{amount > 0 ? fmt(interest) : "\u2014"}</span></div>
            <div className="border-t border-border my-2" />
            <div className="flex justify-between text-[13px] py-1"><span className="text-text2">Total due at repayment</span><span className="font-[family-name:var(--font-dm-mono)] text-sm font-medium text-gold2">{amount > 0 ? fmt(total) : "\u2014"}</span></div>
          </div>

          <div className="bg-bg3 border border-border2 rounded-xl p-3.5 mb-5">
            <div className="text-[11px] font-semibold text-gold uppercase tracking-[0.1em] mb-2">Repayment Trigger</div>
            <p className="text-xs text-text2 leading-relaxed">Full repayment is due on the <strong className="text-text">earlier of:</strong> (a) six months from the Agreement date, or (b) the date Borrower receives proceeds from a priced equity financing of $500,000 or more.</p>
          </div>

          <div className="bg-bg3 border border-border2 rounded-xl p-3.5 mb-5">
            <div className="text-[11px] font-semibold text-gold uppercase tracking-[0.1em] mb-2">Share Pledge (Collateral Only)</div>
            <div className="flex justify-between text-[13px] py-1"><span className="text-text2">Pledged shares</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">{shares > 0 ? shares.toLocaleString() + " shares" : "\u2014"}</span></div>
            <div className="flex justify-between text-[13px] py-1"><span className="text-text2">Issuing company</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">DealWhisper Inc.</span></div>
            <div className="flex justify-between text-[13px] py-1"><span className="text-text2">Share class</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">Common Stock</span></div>
            <div className="flex justify-between text-[13px] py-1"><span className="text-text2">Company is a party?</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium text-danger">No — personal obligation only</span></div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="mb-3.5"><label className={labelCls}>Late fee (%)</label><input type="number" className={inputCls} value={form.lateFee} onChange={(e) => updateField("lateFee", e.target.value)} /></div>
            <div className="mb-3.5"><label className={labelCls}>Florida county</label><input type="text" className={inputCls} placeholder="Pinellas" value={form.county} onChange={(e) => updateField("county", e.target.value)} /></div>
          </div>

          <div className="flex gap-2.5 mt-7">
            <button onClick={() => goTo(0)} className="flex-1 py-4 rounded-xl text-[15px] font-semibold bg-bg2 text-text2 border border-border hover:text-text hover:border-border2 transition-all">Back</button>
            <button onClick={() => goTo(2)} className="flex-1 py-4 rounded-xl text-[15px] font-semibold bg-gradient-to-br from-gold to-[#a87828] text-[#0d0f14] shadow-[0_4px_20px_rgba(201,168,76,0.3)] active:scale-[0.97] transition-all">Continue — Lender</button>
          </div>
        </div>
      )}

      {/* STEP 3: LENDER */}
      {step === 2 && (
        <div className="px-5 animate-[fadeIn_0.25s_ease]">
          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gold-dim border border-border2 text-[11px] font-semibold text-gold mb-3">3</div>
          <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] font-semibold leading-tight mb-1.5">Lender Information</h2>
          <p className="text-[13px] text-text2 mb-6 leading-relaxed">The person <em>providing</em> the loan completes this step.</p>

          <div className="mb-3.5"><label className={labelCls}>Full legal name</label><input type="text" className={inputCls} placeholder="Jane Smith" value={form.lName} onChange={(e) => updateField("lName", e.target.value)} /></div>
          <div className="mb-3.5"><label className={labelCls}>Street address</label><input type="text" className={inputCls} placeholder="123 Main St" value={form.lAddr} onChange={(e) => updateField("lAddr", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="mb-3.5"><label className={labelCls}>City</label><input type="text" className={inputCls} placeholder="Tampa" value={form.lCity} onChange={(e) => updateField("lCity", e.target.value)} /></div>
            <div className="mb-3.5"><label className={labelCls}>ZIP</label><input type="text" className={inputCls} placeholder="33601" inputMode="numeric" value={form.lZip} onChange={(e) => updateField("lZip", e.target.value)} /></div>
          </div>
          <div className="mb-3.5"><label className={labelCls}>Email</label><input type="email" className={inputCls} placeholder="jane@example.com" inputMode="email" value={form.lEmail} onChange={(e) => updateField("lEmail", e.target.value)} /></div>
          <div className="mb-3.5"><label className={labelCls}>Phone</label><input type="tel" className={inputCls} placeholder="(813) 555-0100" inputMode="tel" value={form.lPhone} onChange={(e) => updateField("lPhone", e.target.value)} /></div>

          <SignatureCanvas ref={lSigRef} label="Lender signature — draw below" id="lSig" />
          <div className="mb-3.5"><label className={labelCls}>Date signed</label><input type="date" className={inputCls} value={form.lDate} onChange={(e) => updateField("lDate", e.target.value)} /></div>

          <div className="flex gap-2.5 mt-7">
            <button onClick={() => goTo(1)} className="flex-1 py-4 rounded-xl text-[15px] font-semibold bg-bg2 text-text2 border border-border hover:text-text hover:border-border2 transition-all">Back</button>
            <button onClick={() => goTo(3)} className="flex-1 py-4 rounded-xl text-[15px] font-semibold bg-gradient-to-br from-gold to-[#a87828] text-[#0d0f14] shadow-[0_4px_20px_rgba(201,168,76,0.3)] active:scale-[0.97] transition-all">Continue — Borrower</button>
          </div>
        </div>
      )}

      {/* STEP 4: BORROWER */}
      {step === 3 && (
        <div className="px-5 animate-[fadeIn_0.25s_ease]">
          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gold-dim border border-border2 text-[11px] font-semibold text-gold mb-3">4</div>
          <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] font-semibold leading-tight mb-1.5">Borrower Information</h2>
          <p className="text-[13px] text-text2 mb-6 leading-relaxed">Borrower details are pre-filled. Verify and sign below.</p>

          <div className="mb-3.5"><label className={labelCls}>Full legal name</label><input type="text" className={inputCls} value={form.bName} onChange={(e) => updateField("bName", e.target.value)} /></div>
          <div className="mb-3.5"><label className={labelCls}>Street address</label><input type="text" className={inputCls} value={form.bAddr} onChange={(e) => updateField("bAddr", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="mb-3.5"><label className={labelCls}>City</label><input type="text" className={inputCls} value={form.bCity} onChange={(e) => updateField("bCity", e.target.value)} /></div>
            <div className="mb-3.5"><label className={labelCls}>ZIP</label><input type="text" className={inputCls} inputMode="numeric" value={form.bZip} onChange={(e) => updateField("bZip", e.target.value)} /></div>
          </div>
          <div className="mb-3.5"><label className={labelCls}>Email</label><input type="email" className={inputCls} inputMode="email" value={form.bEmail} onChange={(e) => updateField("bEmail", e.target.value)} /></div>
          <div className="mb-3.5"><label className={labelCls}>Phone</label><input type="tel" className={inputCls} inputMode="tel" value={form.bPhone} onChange={(e) => updateField("bPhone", e.target.value)} /></div>

          <SignatureCanvas ref={bSigRef} label="Borrower signature — draw below" id="bSig" />
          <div className="mb-3.5"><label className={labelCls}>Date signed</label><input type="date" className={inputCls} value={form.bDate} onChange={(e) => updateField("bDate", e.target.value)} /></div>

          <div className="flex gap-2.5 mt-7">
            <button onClick={() => goTo(2)} className="flex-1 py-4 rounded-xl text-[15px] font-semibold bg-bg2 text-text2 border border-border hover:text-text hover:border-border2 transition-all">Back</button>
            <button onClick={() => goTo(4)} className="flex-1 py-4 rounded-xl text-[15px] font-semibold bg-gradient-to-br from-gold to-[#a87828] text-[#0d0f14] shadow-[0_4px_20px_rgba(201,168,76,0.3)] active:scale-[0.97] transition-all">Review Agreement</button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW */}
      {step === 4 && (
        <div className="px-5 animate-[fadeIn_0.25s_ease]">
          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gold-dim border border-border2 text-[11px] font-semibold text-gold mb-3">5</div>
          <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] font-semibold leading-tight mb-1.5">Review & Execute</h2>
          <p className="text-[13px] text-text2 mb-6 leading-relaxed">Confirm all details are correct. Both signatures must be present to send payment.</p>

          {/* Investment Tier */}
          <div className="mb-6">
            <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-gold pb-2 mb-2.5 border-b border-border2">Investment Tier</div>
            <div className="flex justify-between text-[13px] py-1 gap-3"><span className="text-text2">Principal loan amount</span><span className="font-[family-name:var(--font-dm-mono)] text-sm font-medium text-gold2">{fmt(amount)}</span></div>
            <div className="flex justify-between text-[13px] py-1 gap-3"><span className="text-text2">Shares pledged</span><span className="font-[family-name:var(--font-dm-mono)] text-sm font-medium text-gold2">{shares.toLocaleString()} shares</span></div>
            <div className="flex justify-between text-[13px] py-1 gap-3"><span className="text-text2">Company</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">DealWhisper Inc.</span></div>
            <div className="flex justify-between text-[13px] py-1 gap-3"><span className="text-text2">Share class</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">Common Stock</span></div>
          </div>

          {/* Repayment */}
          <div className="mb-6">
            <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-gold pb-2 mb-2.5 border-b border-border2">Repayment</div>
            <div className="flex justify-between text-[13px] py-1 gap-3"><span className="text-text2">Interest rate</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">5.00% per annum</span></div>
            <div className="flex justify-between text-[13px] py-1 gap-3"><span className="text-text2">Interest at 6 months</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">{fmt(interest)}</span></div>
            <div className="flex justify-between text-[13px] py-1 gap-3"><span className="text-text2">Total due</span><span className="font-[family-name:var(--font-dm-mono)] text-sm font-medium text-gold2">{fmt(total)}</span></div>
            <div className="flex justify-between text-[13px] py-1 gap-3"><span className="text-text2">6-month deadline</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">{sixMonthsOut(form.startDate)}</span></div>
            <div className="flex justify-between text-[13px] py-1 gap-3"><span className="text-text2">VC trigger</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">$500,000 raise</span></div>
          </div>

          {/* Lender */}
          <div className="mb-6">
            <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-gold pb-2 mb-2.5 border-b border-border2">Lender</div>
            <div className="flex justify-between text-[13px] py-1 gap-3"><span className="text-text2">Name</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">{form.lName || "\u2014"}</span></div>
            <div className="flex justify-between text-[13px] py-1 gap-3"><span className="text-text2">Address</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium text-right">{form.lAddr || "\u2014"}{form.lCity ? ", " + form.lCity : ""}{form.lZip ? " " + form.lZip : ""}</span></div>
            <div className="flex justify-between text-[13px] py-1 gap-3"><span className="text-text2">Email</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">{form.lEmail || "\u2014"}</span></div>
          </div>

          {/* Borrower */}
          <div className="mb-6">
            <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-gold pb-2 mb-2.5 border-b border-border2">Borrower</div>
            <div className="flex justify-between text-[13px] py-1 gap-3"><span className="text-text2">Name</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">{form.bName || "\u2014"}</span></div>
            <div className="flex justify-between text-[13px] py-1 gap-3"><span className="text-text2">Address</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium text-right">{form.bAddr || "\u2014"}{form.bCity ? ", " + form.bCity : ""}{form.bZip ? " " + form.bZip : ""}</span></div>
            <div className="flex justify-between text-[13px] py-1 gap-3"><span className="text-text2">Email</span><span className="font-[family-name:var(--font-dm-mono)] text-xs font-medium">{form.bEmail || "\u2014"}</span></div>
          </div>

          {/* Zelle */}
          <div className="bg-gradient-to-br from-[#5c1f78] to-[#3d1852] border border-[rgba(130,70,180,0.4)] rounded-2xl p-5 mb-5 relative overflow-hidden">
            <div className="absolute -top-[30px] -right-[30px] w-[100px] h-[100px] rounded-full bg-[rgba(130,70,180,0.2)]" />
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center font-black text-sm text-[#6d1a9b] shrink-0 tracking-tighter">Z</div>
              <div>
                <div className="text-base font-semibold text-white">Send via Zelle</div>
                <div className="text-xs text-white/60 mt-0.5">Agreement is fully executed — send funds now</div>
              </div>
            </div>
            <div className="font-[family-name:var(--font-cormorant)] text-4xl font-bold text-white mb-1">{fmt(amount)}</div>
            <div className="text-xs text-white/60 mb-4">To: Pete (DealWhisper Borrower)</div>
            <div
              className="font-[family-name:var(--font-dm-mono)] text-base text-[#d4a0ff] bg-white/[0.08] rounded-lg px-3 py-2 inline-block mb-3.5 cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText("727-400-2225").catch(() => {});
              }}
            >
              📱 727-400-2225
            </div>
            <button
              onClick={() => {
                const msg = `To send via Zelle:\n\n1. Open your Zelle app or bank\n2. Send to: 727-400-2225\n3. Amount: ${fmt(amount)}\n4. Memo: DealWhisper Loan ${refNum}`;
                alert(msg);
              }}
              className="w-full py-3.5 bg-gradient-to-br from-[#6d1a9b] to-[#9b3dd4] text-white rounded-[10px] text-[15px] font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(109,26,155,0.5)] hover:-translate-y-px active:scale-[0.97] transition-all"
            >
              Open Zelle
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
            <div className="text-[11px] text-white/50 text-center mt-2.5">Or open Zelle manually and send to <strong>727-400-2225</strong></div>
          </div>

          {/* Cash App */}
          <div className="bg-gradient-to-br from-[#00D632] to-[#00a828] border border-[rgba(0,214,50,0.4)] rounded-2xl p-5 mb-5 relative overflow-hidden">
            <div className="absolute -top-[30px] -right-[30px] w-[100px] h-[100px] rounded-full bg-[rgba(255,255,255,0.1)]" />
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center font-black text-sm text-[#00D632] shrink-0">$</div>
              <div>
                <div className="text-base font-semibold text-white">Send via Cash App</div>
                <div className="text-xs text-white/60 mt-0.5">Agreement is fully executed — send funds now</div>
              </div>
            </div>
            <div className="font-[family-name:var(--font-cormorant)] text-4xl font-bold text-white mb-1">{fmt(amount)}</div>
            <div className="text-xs text-white/60 mb-4">To: Pete (DealWhisper Borrower)</div>
            <div
              className="font-[family-name:var(--font-dm-mono)] text-base text-white bg-white/[0.15] rounded-lg px-3 py-2 inline-block mb-3.5 cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText("$jlkern58").catch(() => {});
              }}
            >
              💲 $jlkern58
            </div>
            <button
              onClick={() => {
                window.location.href = `https://cash.app/$jlkern58/${amount}`;
              }}
              className="w-full py-3.5 bg-[rgba(0,0,0,0.25)] text-white rounded-[10px] text-[15px] font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,214,50,0.3)] hover:-translate-y-px active:scale-[0.97] transition-all"
            >
              Open Cash App
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
            <div className="text-[11px] text-white/50 text-center mt-2.5">Or open Cash App manually and send to <strong>$jlkern58</strong></div>
          </div>

          {/* Export buttons */}
          <div className="flex flex-col gap-2.5 mt-2">
            <button onClick={exportContract} className="w-full py-4 rounded-xl text-[15px] font-semibold bg-gradient-to-br from-gold to-[#a87828] text-[#0d0f14] shadow-[0_4px_20px_rgba(201,168,76,0.3)] active:scale-[0.97] transition-all">
              Download Signed Contract PDF
            </button>
            <button onClick={exportCert} className="w-full py-4 rounded-xl text-[15px] font-semibold bg-gradient-to-br from-[#2a6041] to-[#1a4030] text-text shadow-[0_4px_20px_rgba(90,184,138,0.3)] active:scale-[0.97] transition-all">
              Download Stock Certificate PDF
            </button>
          </div>

          <div className="text-xs text-text2 text-center mt-2 leading-relaxed">Keep a copy of the signed PDF for your records. This agreement is governed by Florida law.</div>

          <div className="flex gap-2.5 mt-7">
            <button onClick={() => goTo(3)} className="flex-1 py-4 rounded-xl text-[15px] font-semibold bg-bg2 text-text2 border border-border hover:text-text hover:border-border2 transition-all">Back</button>
            <button onClick={() => { if (confirm("Start a new agreement? All data will be cleared.")) { localStorage.removeItem(STORE_KEY); window.location.reload(); } }} className="flex-1 py-4 rounded-xl text-[15px] font-semibold bg-bg2 text-text2 border border-border hover:text-text hover:border-border2 transition-all">Start Over</button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="text-center text-[10px] text-text3 px-5 pt-6 pb-4 leading-relaxed">
        Personal Promissory Note · State of Florida · Between individuals only<br />
        DealWhisper Inc. is <strong>not</strong> a party and assumes no obligation under this instrument.<br />
        Consult a Florida-licensed attorney before executing · § 687.02 · § 95.11(5)(b)
      </div>
    </>
  );
}
