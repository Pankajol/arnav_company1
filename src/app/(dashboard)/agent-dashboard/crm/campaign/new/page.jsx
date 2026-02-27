"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import TiptapEditor from "@/components/TiptapEditor";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

import {
  Paperclip, X, CheckCircle, UploadCloud, FileSpreadsheet,
  MessageCircle, Mail, List, Download, Calendar, 
  ChevronRight, Layout, Settings, Users, Smartphone, Loader2
} from "lucide-react";

export default function CampaignPage() {
  const router = useRouter();
  const excelInputRef = useRef(null);

  // --- ALL YOUR ORIGINAL LOGIC STATES PRESERVED ---
  const [statusMessage, setStatusMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState("email"); 
  const [campaignName, setCampaignName] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [sender, setSender] = useState("Marketing Team");
  const [emailSubject, setEmailSubject] = useState("");
  const [ctaText, setCtaText] = useState("");


  const [emailContent, setEmailContent] = useState("<p></p>");
  const [whatsappContent, setWhatsappContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [attachments, setAttachments] = useState([]);
  const [recipientSource, setRecipientSource] = useState("segment"); 
  const [segments, setSegments] = useState([]); 
  const [selectedSegment, setSelectedSegment] = useState(""); 
  const [customersList, setCustomersList] = useState([]); 
  const [leadsList, setLeadsList] = useState([]); 
  const [selectedCustomerIds, setSelectedCustomerIds] = useState(new Set());
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());
  const [manualInput, setManualInput] = useState("");
  const [excelFile, setExcelFile] = useState(null);
  const [excelPreviewRows, setExcelPreviewRows] = useState([]); 
  const [excelValidCount, setExcelValidCount] = useState(0);
  const [excelInvalidCount, setExcelInvalidCount] = useState(0);
  const [excelSentCount, setExcelSentCount] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [emailMasters, setEmailMasters] = useState([]);
  const [selectedEmailMasterId, setSelectedEmailMasterId] = useState("");
  const [loadingSegments, setLoadingSegments] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);

  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  // --- ALL YOUR ORIGINAL EFFECTS PRESERVED ---
  useEffect(() => {
    const fetchInitial = async () => {
      setLoadingSegments(true);
      setLoadingTemplates(true);
      try {
        const token = getToken();
        if (!token) {
          setSegments([]); setTemplates([]); setEmailMasters([]);
          setLoadingSegments(false); setLoadingTemplates(false);
          return;
        }
        const [customersRes, leadsRes, templatesRes, emailMastersRes] = await Promise.all([
          fetch("/api/customers", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/lead", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/email-templates", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/email-masters", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const customersData = customersRes.ok ? await customersRes.json() : [];
        const leadsData = leadsRes.ok ? await leadsRes.json() : [];

        let templatesData = [];
        if (templatesRes.ok) {
          const parsed = await templatesRes.json();
          templatesData = Array.isArray(parsed) ? parsed : parsed?.data || [];
        }

        const emailMastersDataRaw = emailMastersRes.ok ? await emailMastersRes.json() : [];
        const emailMastersData = Array.isArray(emailMastersDataRaw) ? emailMastersDataRaw : emailMastersDataRaw?.data || [];

        const countOf = (d) => {
          if (!d) return 0;
          if (Array.isArray(d)) return d.length;
          if (d.data && Array.isArray(d.data)) return d.data.length;
          return 0;
        };

        setSegments([
          { id: "source_customers", label: "All Customers", count: countOf(customersData), desc: "Fetched from /api/customers" },
          { id: "source_leads", label: "New Leads", count: countOf(leadsData), desc: "Fetched from /api/lead" },
        ]);

        setTemplates(templatesData || []);
        setEmailMasters(emailMastersData || []);
      } catch (err) {
        console.error("fetch initial:", err);
        setSegments([{ id: "error", label: "Error loading", count: 0, desc: "Check API" }]);
      } finally {
        setLoadingSegments(false);
        setLoadingTemplates(false);
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    const fetchCustomersList = async () => {
      if (selectedSegment !== "source_customers") {
        setCustomersList([]); setSelectedCustomerIds(new Set()); return;
      }
      setLoadingCustomers(true);
      try {
        const token = getToken();
        const res = await fetch("/api/customers", { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        const arr = Array.isArray(json) ? json : json.data || [];
        setCustomersList(
  arr.map((c) => ({
    _id: c.name,
    name: c.customer_name || c.name || "—",
    email: c.email_id || "",
  }))
);
      } catch (err) { console.error(err); } finally { setLoadingCustomers(false); }
    };

    const fetchLeadsList = async () => {
      if (selectedSegment !== "source_leads") {
        setLeadsList([]); setSelectedLeadIds(new Set()); return;
      }
      setLoadingLeads(true);
      try {
        const token = getToken();
        const res = await fetch("/api/lead", { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        const arr = Array.isArray(json) ? json : json.data || [];
       setLeadsList(
  arr.map((l) => ({
    _id: l.name, // ERPNext document name is unique
    name: l.lead_name || l.name || "—",
    email: l.email_id || "", // ✅ CORRECT FIELD
  }))
);
      } catch (err) { console.error(err); } finally { setLoadingLeads(false); }
    };

    fetchCustomersList();
    fetchLeadsList();
  }, [selectedSegment]);

  useEffect(() => {
    if (!selectedEmailMasterId) return;
    const m = emailMasters.find((x) => x._id === selectedEmailMasterId || x.id === selectedEmailMasterId);
    if (!m) return;
    const html = m.contentHtml || m.content || m.html || "<p></p>";
    setEmailContent(html); setEmailSubject(m.subject || ""); setSender(m.fromName || m.sender || sender); setCtaText(m.ctaText || "");
    setWordCount(html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length);
  }, [selectedEmailMasterId, emailMasters]);

  useEffect(() => {
    if (!selectedTemplateId) return;
    const t = templates.find((x) => x._id === selectedTemplateId || x.id === selectedTemplateId);
    if (!t) return;
    const html = t.contentHtml || t.content || t.html || "<p></p>";
    const text = t.text || t.plain || html.replace(/<[^>]*>/g, " ");
    if (channel === "email") {
      setEmailContent(html); setEmailSubject(t.subject || ""); setSender(t.fromName || sender); setCtaText(t.ctaText || "");
      setWordCount(html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length);
    } else { setWhatsappContent(text); }
  }, [selectedTemplateId, templates, channel]);

  // --- ALL YOUR ORIGINAL HANDLERS PRESERVED ---
  const handleEmailEditorChange = (html) => {
    setEmailContent(html);
    const textOnly = html.replace(/<[^>]*>/g, " ").trim();
    setWordCount(textOnly ? textOnly.split(/\s+/).length : 0);
  };

  const handleAttachmentChange = (e) => {
    if (e.target.files) setAttachments((p) => [...p, ...Array.from(e.target.files)]);
  };
  const removeAttachment = (i) => setAttachments((p) => p.filter((_, idx) => idx !== i));

  const clearExcel = () => {
    setExcelFile(null); setExcelPreviewRows([]); setExcelValidCount(0); setExcelInvalidCount(0); setExcelSentCount(0);
    if (excelInputRef.current) excelInputRef.current.value = "";
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").toString().trim());
  // const isValidEmail = (email) => email?.toString().trim().replace(/,+$/, "").toLowerCase();

  const handleExcelChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const firstRowKeys = Object.keys(rows[0] || {});
        let emailKey = firstRowKeys[0];
        const preview = rows.map((r, idx) => {
          const rawEmail = isValidEmail(r[emailKey] ?? r.email ?? "");
          return { id: idx + 1, email: rawEmail || "", raw: r, valid: isValidEmail(rawEmail), isSent: false };
        });
        setExcelPreviewRows(preview);
        setExcelValidCount(preview.filter(p => p.valid).length);
        setExcelInvalidCount(preview.filter(p => !p.valid).length);
      } catch (err) { clearExcel(); }
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleCustomerSelect = (id) => {
    setSelectedCustomerIds((prev) => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };
  const selectAllCustomers = () => setSelectedCustomerIds(new Set(customersList.filter(c => isValidEmail(c.email)).map(c => c._id)));
  
  const toggleLeadSelect = (id) => {
    setSelectedLeadIds((prev) => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };
  const selectAllLeads = () => setSelectedLeadIds(new Set(leadsList.filter(c => isValidEmail(c.email)).map(c => c._id)));

  const downloadTemplate = () => {
    const blob = new Blob(["email\nexample@example.com\n"], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "template.csv"; a.click();
  };

  const parsedManualEmails = useCallback(() => {
  if (!manualInput) return [];

  return [
    ...new Set(
      manualInput
        .split(/[\n,]+/)
        .map((m) => m.trim().toLowerCase())
        .filter((m) => isValidEmail(m))
    )
  ];
}, [manualInput]);

 const handleFormSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setStatusMessage(null);

  try {
    // ================= ATTACHMENTS =================
    const attachmentBase64 = await Promise.all(
      attachments.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          })
      )
    );

    // ================= BUILD RECIPIENTS =================

let recipientListPayload = [];

if (recipientSource === "segment") {
  if (selectedSegment === "source_customers") {
    recipientListPayload =
      selectedCustomerIds.size > 0
        ? customersList
            .filter(c => selectedCustomerIds.has(c._id))
            .map(c => c.email)
        : customersList.map(c => c.email);
  }

  if (selectedSegment === "source_leads") {
    recipientListPayload =
      selectedLeadIds.size > 0
        ? leadsList
            .filter(l => selectedLeadIds.has(l._id))
            .map(l => l.email)
        : leadsList.map(l => l.email);
  }
}

if (recipientSource === "excel") {
  recipientListPayload = excelPreviewRows
    .filter(r => r.valid)
    .map(r => r.email);
}

if (recipientSource === "manual") {
  recipientListPayload = parsedManualEmails();
}

// remove duplicates + invalid
recipientListPayload = [
  ...new Set(
    recipientListPayload
      .map(e => e?.toString().trim().toLowerCase())
      .filter(e => isValidEmail(e))
  )
];

if (recipientListPayload.length === 0) {
  setStatusMessage({
    type: "error",
    html: "Please select at least one valid recipient."
  });
  setLoading(false);
  return;
}

const payload = {
  campaignName,
  scheduledTime,
  channel,
  sender: channel === "email" ? sender : "WhatsApp API",
  content: channel === "email" ? emailContent : whatsappContent,
  emailSubject,
  ctaText,

  recipientSource,
  recipientList: recipientSource === "segment" ? recipientListPayload : [],
  recipientExcelEmails: recipientSource === "excel" ? recipientListPayload : [],
  recipientManual: recipientSource === "manual" ? manualInput : null,

  attachments: attachmentBase64,
};

    console.log("FINAL PAYLOAD:", payload);

    // ================= API CALL =================
    const res = await fetch("/api/campaign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setStatusMessage({
        type: "success",
        html: "Campaign Scheduled Successfully!",
      });
      router.push("/agent-dashboard/crm/campaign");
    } else {
      const errData = await res.json();
      setStatusMessage({
        type: "error",
        html: errData?.error || "Something went wrong.",
      });
    }

  } catch (err) {
    setStatusMessage({
      type: "error",
      html: "Error: " + err.message,
    });
  } finally {
    setLoading(false);
  }
};

  function formatStringToAMPM(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, day: '2-digit', month: 'short' });
  }

  // --- NEW ADVANCED UI RENDER ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Campaign <span className="text-indigo-600">Studio</span></h1>
            <p className="text-slate-500 font-medium mt-1">Design and schedule your next big outreach</p>
          </div>
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
            <button type="button" onClick={() => setChannel("email")} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${channel === "email" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"}`}>
              <Mail size={18} /> Email
            </button>
            <button type="button" onClick={() => setChannel("whatsapp")} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${channel === "whatsapp" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"}`}>
              <MessageCircle size={18} /> WhatsApp
            </button>
          </div>
        </header>

        {statusMessage && (
          <div className={`p-4 mb-6 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${statusMessage.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
            {statusMessage.type === "success" ? <CheckCircle size={20} /> : <X size={20} />}
            <div dangerouslySetInnerHTML={{ __html: statusMessage.html }} className="text-sm font-bold" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Side */}
          <form onSubmit={handleFormSubmit} className="lg:col-span-8 space-y-8">
            
            {/* 1. Basic Details */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">1</div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Identity & Timing</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Campaign Name</label>
                  <input type="text" name="campaignName" required   value={campaignName}
  onChange={(e) => setCampaignName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-700" placeholder="Diwali Promo 2026" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Execution Time</label>
                  <input type="datetime-local" name="scheduledTime" required value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-700" />
                </div>
              </div>

              {channel === "email" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Sender Brand</label>
                    <input type="text" name="sender" value={sender} onChange={(e) => setSender(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-700" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Email Master Preset</label>
                    <select value={selectedEmailMasterId} onChange={(e) => setSelectedEmailMasterId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-700 appearance-none">
                      <option value="">Start from Scratch</option>
                      {emailMasters.map((m) => <option key={m._id || m.id} value={m._id || m.id}>{m.email || m.subject}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Audience */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">2</div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Target Audience</h2>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  {['segment', 'excel', 'manual'].map(src => (
                    <button key={src} type="button" onClick={() => setRecipientSource(src)} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${recipientSource === src ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}>
                      {src}
                    </button>
                  ))}

                </div>
              </div>

              {recipientSource === "segment" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {segments.map((s) => (
                    <div key={s.id} onClick={() => setSelectedSegment(s.id)} className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden ${selectedSegment === s.id ? "border-indigo-600 bg-indigo-50/30" : "border-slate-50 bg-slate-50 hover:border-slate-200"}`}>
                      <div className="flex justify-between items-start">
                        <span className="font-black text-slate-800 text-lg leading-tight">{s.label}</span>
                        {selectedSegment === s.id && <CheckCircle className="text-indigo-600" size={20} />}
                      </div>
                      <p className="text-xs text-slate-400 font-bold mt-1">{s.count} Contacts Found</p>
                      
                      {selectedSegment === s.id && (s.id === "source_customers" || s.id === "source_leads") && (
                        <div className="mt-4 pt-4 border-t border-indigo-100 space-y-3">
                          <div className="flex gap-2">
                             <button type="button" onClick={s.id === "source_customers" ? selectAllCustomers : selectAllLeads} className="px-3 py-1.5 bg-white text-[10px] font-black uppercase tracking-tighter rounded-lg border border-indigo-200">Select All</button>
                             <button type="button" onClick={() => s.id === "source_customers" ? setSelectedCustomerIds(new Set()) : setSelectedLeadIds(new Set())} className="px-3 py-1.5 bg-white text-[10px] font-black uppercase tracking-tighter rounded-lg border border-slate-200">Clear</button>
                          </div>
                          <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar space-y-1">
                            {(s.id === "source_customers" ? customersList : leadsList).map(item => (
                              <label key={item._id} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl transition-colors cursor-pointer group">
                                <input type="checkbox" checked={s.id === "source_customers" ? selectedCustomerIds.has(item._id) : selectedLeadIds.has(item._id)} onChange={() => s.id === "source_customers" ? toggleCustomerSelect(item._id) : toggleLeadSelect(item._id)} className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                <div className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-600 truncate">{item.name} <span className="text-slate-400 ml-1 font-normal">{item.email}</span></div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {recipientSource === "excel" && (
                <div className="space-y-4">
                  <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-12 text-center group hover:border-indigo-200 hover:bg-indigo-50/30 transition-all relative">
                    <UploadCloud className="mx-auto text-slate-300 mb-4 group-hover:text-indigo-500 transition-colors" size={48} />
                    <p className="text-slate-500 font-bold">Drop your Excel/CSV or click to browse</p>
                    <input type="file" ref={excelInputRef} onChange={handleExcelChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  {excelFile && (
                    <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl text-white">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="text-emerald-400" />
                        <span className="text-sm font-bold">{excelValidCount} Valid Emails Detects</span>
                      </div>
                      <button type="button" onClick={clearExcel} className="p-2 hover:bg-white/10 rounded-lg"><X size={18} /></button>
                    </div>
                  )}
                </div>
              )}

              {recipientSource === "manual" && (
                <div className="space-y-2">
                  <textarea rows="6" value={manualInput} onChange={(e) => setManualInput(e.target.value)} className="w-full px-5 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm leading-relaxed" placeholder="john@example.com, sara@test.com..." />
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">{parsedManualEmails().length} Emails Parsed</p>
                </div>
              )}
            </div>

            {/* 3. Content */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">3</div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Creative Content</h2>
                </div>
                <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Select a Template</option>
                  {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>

              {channel === "email" ? (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Subject Line</label>
                    <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800" placeholder="e.g., Don't miss your special gift!" />
                  </div>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 min-h-[400px]">
                    <TiptapEditor content={emailContent} onChange={handleEmailEditorChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={ctaText} onChange={(e) => setCtaText(e.target.value)} className="px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800" placeholder="CTA Button Text (Shop Now)" />
                    <div className="flex items-center justify-center gap-2 px-5 py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-400">
                        <Download size={14} /> {wordCount} Words Written
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                   <textarea rows="8" value={whatsappContent} onChange={(e) => setWhatsappContent(e.target.value)} className="w-full px-6 py-6 bg-emerald-50/30 border-2 border-emerald-100 rounded-[2rem] focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-700 leading-relaxed" placeholder="Write your WhatsApp blast here..." />
                   <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                      <span>Supports *bold* _italic_ ~strike~</span>
                      <span>{whatsappContent.length} Characters</span>
                   </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className={`w-full py-6 rounded-[2rem] text-white font-black text-xl tracking-tight shadow-xl shadow-indigo-200 transform transition active:scale-95 flex items-center justify-center gap-3 ${loading ? "bg-slate-400" : channel === "email" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
              {loading ? <Loader2 className="animate-spin" /> : <><Calendar size={24} /> Schedule {channel.toUpperCase()} Campaign</>}
            </button>
          </form>

          {/* Right Preview Side */}
          <div className="lg:col-span-4 sticky top-10 space-y-6">
            <div className="bg-slate-900 rounded-[3.5rem] p-4 shadow-2xl border-[12px] border-slate-800 relative aspect-[9/19] max-w-[340px] mx-auto overflow-hidden">
                {/* iPhone Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-800 rounded-b-3xl z-20"></div>
                
                <div className="bg-white h-full w-full rounded-[2.5rem] overflow-hidden flex flex-col relative">
                    {/* App Header */}
                    <div className="bg-slate-50 p-4 pt-10 text-center border-b border-slate-100">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center font-black text-xl mb-1 shadow-sm">
                            {sender.charAt(0)}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sender}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                        {channel === "email" ? (
                          <div className="animate-in fade-in zoom-in-95 duration-500">
                            <h4 className="font-black text-slate-800 text-base leading-tight mb-4">{emailSubject || "Your Subject Line Preview"}</h4>
                            <div className="text-[11px] text-slate-600 leading-relaxed preview-html" dangerouslySetInnerHTML={{ __html: emailContent }} />
                            {ctaText && (
                              <div className="mt-8 py-3 bg-indigo-600 text-white rounded-xl text-center text-xs font-black uppercase tracking-widest shadow-lg">
                                {ctaText}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-emerald-100/50 p-4 rounded-3xl rounded-tl-none shadow-sm border border-emerald-100 self-start max-w-[90%] animate-in slide-in-from-left-4">
                              <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">{whatsappContent || "Type a message to see the preview..."}</p>
                              <p className="text-[8px] text-right text-emerald-600 font-bold mt-2 uppercase">12:00 PM ✓✓</p>
                            </div>
                          </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Live Device Preview</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}


// "use client";

// import { useState, useEffect, useRef, useCallback } from "react";
// import TiptapEditor from "@/components/TiptapEditor";
// import * as XLSX from "xlsx";
// import { useRouter } from "next/navigation";

// import {
//   Paperclip,
//   X,
//   CheckCircle,
//   UploadCloud,
//   FileSpreadsheet,
//   MessageCircle,
//   Mail,
//   List,
//   Download,
// } from "lucide-react";

// export default function CampaignPage() {
//   const router = useRouter();
//   const excelInputRef = useRef(null);

//   // main state
//   const [statusMessage, setStatusMessage] = useState(null);
//   const [loading, setLoading] = useState(false);

//   // channel
//   const [channel, setChannel] = useState("email"); // 'email' | 'whatsapp'

//   // basic details
//   const [campaignName, setCampaignName] = useState("");
//   const [scheduledTime, setScheduledTime] = useState("");
//   const [sender, setSender] = useState("Marketing Team");
//   const [emailSubject, setEmailSubject] = useState("");
//   const [ctaText, setCtaText] = useState("");

//   // content
//   const [emailContent, setEmailContent] = useState("<p></p>");
//   const [whatsappContent, setWhatsappContent] = useState("");
//   const [wordCount, setWordCount] = useState(0);

//   // attachments
//   const [attachments, setAttachments] = useState([]);

//   // recipients
//   const [recipientSource, setRecipientSource] = useState("segment"); // 'segment'|'excel'|'manual'
//   const [segments, setSegments] = useState([]); // meta segments: {id,label,count,desc}
//   const [selectedSegment, setSelectedSegment] = useState(""); // single segment like original

//   // lists
//   const [customersList, setCustomersList] = useState([]); // normalized customers
//   const [leadsList, setLeadsList] = useState([]); // normalized leads

//   const [selectedCustomerIds, setSelectedCustomerIds] = useState(new Set());
//   const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());

//   // manual
//   const [manualInput, setManualInput] = useState("");

//   // excel
//   const [excelFile, setExcelFile] = useState(null);
//   const [excelPreviewRows, setExcelPreviewRows] = useState([]); // [{id,email,valid,isSent,raw}]
//   const [excelValidCount, setExcelValidCount] = useState(0);
//   const [excelInvalidCount, setExcelInvalidCount] = useState(0);
//   const [excelSentCount, setExcelSentCount] = useState(0);

//   // templates
//   const [templates, setTemplates] = useState([]);
//   const [selectedTemplateId, setSelectedTemplateId] = useState("");

//   // email masters
//   const [emailMasters, setEmailMasters] = useState([]);
//   const [selectedEmailMasterId, setSelectedEmailMasterId] = useState("");

//   // loading flags
//   const [loadingSegments, setLoadingSegments] = useState(true);
//   const [loadingTemplates, setLoadingTemplates] = useState(true);
//   const [loadingCustomers, setLoadingCustomers] = useState(false);
//   const [loadingLeads, setLoadingLeads] = useState(false);

//   // helper: token
//   const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

//   // -------------------------
//   // fetch segments (counts), customers list, templates, leads, email masters
//   // -------------------------
//   useEffect(() => {
//     const fetchInitial = async () => {
//       setLoadingSegments(true);
//       setLoadingTemplates(true);
//       try {
//         const token = getToken();
//         if (!token) {
//           setSegments([]);
//           setTemplates([]);
//           setEmailMasters([]);
//           setLoadingSegments(false);
//           setLoadingTemplates(false);
//           return;
//         }

//         const [customersRes, leadsRes, templatesRes, emailMastersRes] = await Promise.all([
//           fetch("/api/customers", { headers: { Authorization: `Bearer ${token}` } }),
//           fetch("/api/lead", { headers: { Authorization: `Bearer ${token}` } }),
//           fetch("/api/email-templates", { headers: { Authorization: `Bearer ${token}` } }),
//           fetch("/api/email-masters", { headers: { Authorization: `Bearer ${token}` } }),
//         ]);

//         const customersData = customersRes.ok ? await customersRes.json() : [];
//         const leadsData = leadsRes.ok ? await leadsRes.json() : [];

//         let templatesData = [];
//         if (templatesRes.ok) {
//           const parsed = await templatesRes.json();
//           templatesData = Array.isArray(parsed) ? parsed : parsed?.data || [];
//         }

//         const emailMastersDataRaw = emailMastersRes.ok ? await emailMastersRes.json() : [];
//         const emailMastersData = Array.isArray(emailMastersDataRaw) ? emailMastersDataRaw : emailMastersDataRaw?.data || [];

//         const countOf = (d) => {
//           if (!d) return 0;
//           if (Array.isArray(d)) return d.length;
//           if (d.data && Array.isArray(d.data)) return d.data.length;
//           return 0;
//         };

//         setSegments([
//           { id: "source_customers", label: "All Customers", count: countOf(customersData), desc: "Fetched from /api/customers" },
//           { id: "source_leads", label: "New Leads", count: countOf(leadsData), desc: "Fetched from /api/lead" },
//         ]);

//         setTemplates(templatesData || []);
//         setEmailMasters(emailMastersData || []);
//       } catch (err) {
//         console.error("fetch initial:", err);
//         setSegments([{ id: "error", label: "Error loading", count: 0, desc: "Check API" }]);
//       } finally {
//         setLoadingSegments(false);
//         setLoadingTemplates(false);
//       }
//     };

//     fetchInitial();
//   }, []);

//   // when user selects "All Customers" or "New Leads" segment, fetch full list to allow per-item select
//   useEffect(() => {
//     const fetchCustomersList = async () => {
//       if (selectedSegment !== "source_customers") {
//         setCustomersList([]);
//         setSelectedCustomerIds(new Set());
//         return;
//       }
//       setLoadingCustomers(true);
//       try {
//         const token = getToken();
//         if (!token) throw new Error("Unauthorized");
//         const res = await fetch("/api/customers", { headers: { Authorization: `Bearer ${token}` } });
//         const json = await res.json();
//         const arr = Array.isArray(json) ? json : json.data || [];
//         const normalized = arr.map((c) => ({
//           _id: c._id || c.id || c.emailId || Math.random().toString(36).slice(2, 9),
//           name: c.customerName || c.name || c.fullName || c.companyName || "—",
//           email: c.emailId || c.email || c.emailAddress || "",
//         }));
//         setCustomersList(normalized);
//       } catch (err) {
//         console.error("fetch customers list:", err);
//         setCustomersList([]);
//       } finally {
//         setLoadingCustomers(false);
//       }
//     };

//     const fetchLeadsList = async () => {
//       if (selectedSegment !== "source_leads") {
//         setLeadsList([]);
//         setSelectedLeadIds(new Set());
//         return;
//       }
//       setLoadingLeads(true);
//       try {
//         const token = getToken();
//         if (!token) throw new Error("Unauthorized");
//         const res = await fetch("/api/lead", { headers: { Authorization: `Bearer ${token}` } });
//         const json = await res.json();
//         const arr = Array.isArray(json) ? json : json.data || [];
//         const normalized = arr.map((l) => ({
//           _id: l._id || l.id || Math.random().toString(36).slice(2, 9),
//           name: l.leadName || l.name || l.fullName || l.companyName || "—",
//           email: l.email || l.emailId || l.emailAddress || "",
//         }));
//         setLeadsList(normalized);
//       } catch (err) {
//         console.error("fetch leads list:", err);
//         setLeadsList([]);
//       } finally {
//         setLoadingLeads(false);
//       }
//     };

//     fetchCustomersList();
//     fetchLeadsList();
//   }, [selectedSegment]);

//   // when email master selected, load into editor/fields
//   useEffect(() => {
//     if (!selectedEmailMasterId) return;
//     const m = emailMasters.find((x) => x._id === selectedEmailMasterId || x.id === selectedEmailMasterId);
//     if (!m) return;
//     const html = m.contentHtml || m.content || m.html || "<p></p>";
//     const subj = m.subject || m.title || "";
//     const from = m.fromName || m.sender || m.from || sender;
//     const cta = m.ctaText || m.cta || "";

//     setEmailContent(html);
//     setEmailSubject(subj);
//     setSender(from);
//     setCtaText(cta);
//     const textOnly = html.replace(/<[^>]*>/g, " ").trim();
//     setWordCount(textOnly ? textOnly.split(/\s+/).length : 0);
//   }, [selectedEmailMasterId, emailMasters]);

//   // when template selected, load into editor/whatsapp AND fill subject/sender/cta
//   useEffect(() => {
//     if (!selectedTemplateId) return;
//     const t = templates.find((x) => x._id === selectedTemplateId || x.id === selectedTemplateId);
//     if (!t) return;

//     const html = t.contentHtml || t.content || t.html || "<p></p>";
//     const text = t.text || t.plain || html.replace(/<[^>]*>/g, " ");
//     const subj = t.subject || t.title || "";
//     const from = t.fromName || t.sender || t.from || sender;
//     const cta = t.ctaText || t.cta || "";

//     if (channel === "email") {
//       setEmailContent(html);
//       setEmailSubject(subj);
//       setSender(from);
//       setCtaText(cta);
//       const textOnly = html.replace(/<[^>]*>/g, " ").trim();
//       setWordCount(textOnly ? textOnly.split(/\s+/).length : 0);
//     } else {
//       setWhatsappContent(text);
//     }
//   }, [selectedTemplateId, templates, channel]);

//   // editor change
//   const handleEmailEditorChange = (html) => {
//     setEmailContent(html);
//     const textOnly = html.replace(/<[^>]*>/g, " ").trim();
//     setWordCount(textOnly ? textOnly.split(/\s+/).length : 0);
//   };

//   // attachments
//   const handleAttachmentChange = (e) => {
//     if (e.target.files && e.target.files.length > 0) setAttachments((p) => [...p, ...Array.from(e.target.files)]);
//   };
//   const removeAttachment = (i) => setAttachments((p) => p.filter((_, idx) => idx !== i));

//   // ---------------------
//   // Excel parse -> build preview rows (valid/invalid/sent detection)
//   // ---------------------
//   const clearExcel = () => {
//     setExcelFile(null);
//     setExcelPreviewRows([]);
//     setExcelValidCount(0);
//     setExcelInvalidCount(0);
//     setExcelSentCount(0);
//     if (excelInputRef.current) excelInputRef.current.value = "";
//   };

//   const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").toString().trim());
//   const isValidEmail = (email) => email?.toString().trim().replace(/,+$/, "").toLowerCase();

//   const handleExcelChange = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setExcelFile(file);

//     const reader = new FileReader();
//     // use ArrayBuffer for more robust parsing
//     reader.onload = (evt) => {
//       try {
//         const data = evt.target.result;
//         const workbook = XLSX.read(data, { type: "array" });
//         const sheet = workbook.Sheets[workbook.SheetNames[0]];
//         const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
//         if (!rows || rows.length === 0) {
//           alert("Excel empty or not parseable");
//           clearExcel();
//           return;
//         }

//         // detect best email column (more candidates)
//         const firstRowKeys = Object.keys(rows[0] || {});
//         const lowered = firstRowKeys.map((k) => (k || "").toString().toLowerCase());
//         const possible = [
//           "email",
//           "e-mail",
//           "email address",
//           "emailaddress",
//           "emailid",
//           "email_id",
//           "e mail",
//           "contact",
//           "contact email",
//         ];
//         let emailKey = null;
//         for (let candidate of possible) {
//           const idx = lowered.findIndex((lk) => lk === candidate || lk.includes(candidate));
//           if (idx !== -1) {
//             emailKey = firstRowKeys[idx];
//             break;
//           }
//         }
//         if (!emailKey) {
//           // fallback: prefer a column that contains the word 'email' anywhere
//           const idxAny = lowered.findIndex((lk) => lk.includes("email"));
//           if (idxAny !== -1) emailKey = firstRowKeys[idxAny];
//         }
//         if (!emailKey) emailKey = firstRowKeys[0]; // final fallback

//         // detect sent/status column
//         let sentKey = null;
//         for (let i = 0; i < firstRowKeys.length; i++) {
//           const k = (firstRowKeys[i] || "").toString().toLowerCase();
//           if (["sent", "status", "is_sent", "mailed", "delivered"].includes(k) || k.includes("sent")) {
//             sentKey = firstRowKeys[i];
//             break;
//           }
//         }

//         const preview = rows.map((r, idx) => {
//           const raw = r;
//           const candidateValue = r[emailKey] ?? r.email ?? r.Email ?? "";
//           const rawEmail = isValidEmail(candidateValue);
//           const valid = isValidEmail(rawEmail);
//           const sentRaw = sentKey ? String(r[sentKey] ?? "").toLowerCase() : "";
//           const isSent = sentKey ? (["1", "true", "yes", "sent", "delivered"].includes(sentRaw) ? true : false) : false;
//           return { id: idx + 1, email: rawEmail || "", raw, valid, isSent };
//         });

//         const validCount = preview.filter((p) => p.valid).length;
//         const invalidCount = preview.filter((p) => !p.valid).length;
//         const sentCount = preview.filter((p) => p.isSent).length;

//         setExcelPreviewRows(preview);
//         setExcelValidCount(validCount);
//         setExcelInvalidCount(invalidCount);
//         setExcelSentCount(sentCount);

//         alert(`Excel parsed: ${validCount} valid, ${invalidCount} invalid, ${sentCount} already sent`);
//       } catch (err) {
//         console.error("Excel parse error", err);
//         alert("Failed to parse Excel file.");
//         clearExcel();
//       }
//     };

//     reader.readAsArrayBuffer(file);
//   };

//   // ---------------------
//   // Customers/Leads helpers
//   // ---------------------
//   const toggleCustomerSelect = (id) => {
//     setSelectedCustomerIds((prev) => {
//       const copy = new Set(prev);
//       if (copy.has(id)) copy.delete(id);
//       else copy.add(id);
//       return copy;
//     });
//   };
//   const selectAllCustomers = () => {
//     const all = new Set(customersList.filter((c) => c.email && isValidEmail(c.email)).map((c) => c._id));
//     setSelectedCustomerIds(all);
//   };
//   const clearAllCustomersSelection = () => setSelectedCustomerIds(new Set());

//   const toggleLeadSelect = (id) => {
//     setSelectedLeadIds((prev) => {
//       const copy = new Set(prev);
//       if (copy.has(id)) copy.delete(id);
//       else copy.add(id);
//       return copy;
//     });
//   };
//   const selectAllLeads = () => {
//     const all = new Set(leadsList.filter((c) => c.email && isValidEmail(c.email)).map((c) => c._id));
//     setSelectedLeadIds(all);
//   };
//   const clearAllLeadsSelection = () => setSelectedLeadIds(new Set());

//   // ---------------------
//   // download template CSV (one-column)
//   // ---------------------
//   const downloadTemplate = () => {
//     const csv = "email\nexample@example.com\n";
//     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "email_upload_template.csv";
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   // parse manual
//   const parsedManualEmails = useCallback(() => {
//     if (!manualInput) return [];
//     return [...new Set(manualInput.split(/[\n,]+/).map((m) => isValidEmail(m)).filter(Boolean))];
//   }, [manualInput]);

//   // ---------------------
//   // form submit
//   // ---------------------
//   const handleFormSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setStatusMessage(null);

//     // basic validation
//     if (channel === "email" && (!emailContent || emailContent === "<p></p>")) {
//       alert("Email body cannot be empty.");
//       setLoading(false);
//       return;
//     }
//     if (channel === "whatsapp" && !whatsappContent.trim()) {
//       alert("WhatsApp message cannot be empty.");
//       setLoading(false);
//       return;
//     }

//     if (recipientSource === "segment" && !selectedSegment) {
//       alert("Please select a segment.");
//       setLoading(false);
//       return;
//     }

//     if (recipientSource === "segment" && selectedSegment === "source_customers" && selectedCustomerIds.size === 0) {
//       if (!confirm("No customers selected inside All Customers. Do you want to send to all customers?")) {
//         setLoading(false);
//         return;
//       }
//     }

//     if (recipientSource === "segment" && selectedSegment === "source_leads" && selectedLeadIds.size === 0) {
//       if (!confirm("No leads selected inside New Leads. Do you want to send to all leads?")) {
//         setLoading(false);
//         return;
//       }
//     }

//     // If Excel source, ensure we have preview rows, derive valid emails
//     let excelEmailsToSend = [];
//     if (recipientSource === "excel") {
//       // derive from preview rows (if user uploaded)
//       if (excelPreviewRows && excelPreviewRows.length > 0) {
//         excelEmailsToSend = excelPreviewRows.filter((r) => r.valid).map((r) => r.email);
//       }

//       // if still empty, try to parse manualInput as fallback (rare)
//       if (!excelEmailsToSend.length) {
//         alert("Excel must contain at least one valid email.");
//         setLoading(false);
//         return;
//       }
//     }

//     if (recipientSource === "manual" && parsedManualEmails().length === 0) {
//       alert("Manual entry must have at least one valid email.");
//       setLoading(false);
//       return;
//     }

//     // attachments -> base64
//     const attachmentBase64 = await Promise.all(
//       attachments.map(
//         (file) =>
//           new Promise((resolve) => {
//             const reader = new FileReader();
//             reader.onload = () => resolve(reader.result);
//             reader.readAsDataURL(file);
//           })
//       )
//     );

//     // build recipient arrays:
//     let recipientListPayload;
//     if (recipientSource === "excel") {
//       recipientListPayload = excelEmailsToSend;
//     } else if (recipientSource === "manual") {
//       recipientListPayload = parsedManualEmails().filter((e) => isValidEmail(e));
//     } else {
//       // segment
//       if (selectedSegment === "source_customers") {
//         const sel = Array.from(selectedCustomerIds);
//         recipientListPayload = sel.length
//           ? customersList.filter((c) => sel.includes(c._id) && isValidEmail(c.email)).map((c) => c.email)
//           : "ALL_CUSTOMERS";
//       } else if (selectedSegment === "source_leads") {
//         const sel = Array.from(selectedLeadIds);
//         recipientListPayload = sel.length
//           ? leadsList.filter((c) => sel.includes(c._id) && isValidEmail(c.email)).map((c) => c.email)
//           : "ALL_LEADS";
//       } else {
//         recipientListPayload = selectedSegment;
//       }
//     }

//     // BUILD PAYLOAD — IMPORTANT: use recipientExcelEmails when excel source
//     const payload = {
//       campaignName: e.target.campaignName.value,
//       scheduledTime: e.target.scheduledTime.value || scheduledTime,
//       channel,
//       sender: channel === "email" ? e.target.sender.value : "WhatsApp API",
//       content: channel === "email" ? emailContent : whatsappContent,
//       emailSubject: channel === "email" ? e.target.emailSubject?.value || emailSubject : undefined,
//       ctaText: channel === "email" ? e.target.ctaText?.value || ctaText : undefined,
//       recipientSource,
//       recipientList: recipientSource === "segment" ? recipientListPayload : undefined,
//       recipientManual: recipientSource === "manual" ? (e.target.manual?.value || manualInput) : undefined,
//       recipientExcelEmails: recipientSource === "excel" ? recipientListPayload : undefined,
//       templateId: selectedTemplateId || undefined,
//       emailMasterId: selectedEmailMasterId || undefined,
//       attachments: attachmentBase64,
//     };

//     try {
//       const token = getToken();
//       if (!token) throw new Error("Unauthorized");

//       const res = await fetch("/api/campaign", {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify(payload),
//       });

//       const json = await res.json();
//       if (!res.ok) throw new Error(json?.error || "Server error");

//       setStatusMessage({ type: "success", html: `<p class="font-bold">Campaign Scheduled</p><p>ID: ${json.data?._id || "—"}</p>` });
//       // reset relevant states
//       e.target.reset();
//       setCampaignName("");
//       setScheduledTime("");
//       setSelectedSegment("");
//       setCustomersList([]);
//       setSelectedCustomerIds(new Set());
//       setLeadsList([]);
//       setSelectedLeadIds(new Set());
//       setManualInput("");
//       clearExcel();
//       setAttachments([]);
//       setEmailContent("<p></p>");
//       setWhatsappContent("");
//       setSelectedTemplateId("");
//       setSelectedEmailMasterId("");
//       setWordCount(0);

//       router.push("/agent-dashboard/crm/campaign");
//     } catch (err) {
//       console.error("submit error", err);
//       setStatusMessage({ type: "error", html: `<p class="font-bold">Error</p><p>${err.message}</p>` });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // helper format
//   function formatStringToAMPM(dateString) {
//     if (!dateString) return "";
//     const [date, timePart] = dateString.split("T");
//     if (!timePart) return dateString;
//     let [hour, minute] = timePart.split(":");
//     hour = parseInt(hour);
//     const ampm = hour >= 12 ? "PM" : "AM";
//     hour = hour % 12 || 12;
//     return `${date.split("-").reverse().join("/")} ${hour}:${minute} ${ampm}`;
//   }

//   // ---------------------
//   // Render
//   // ---------------------
//   return (
//     <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen font-inter">
//       <div className="max-w-6xl mx-auto">
//         {/* HEADER */}
//         <header className="mb-8 pb-4 border-b border-gray-200">
//           <h1 className="text-3xl font-extrabold text-gray-900">Create Campaign</h1>
//           <p className="text-gray-500 mt-1">Reach your audience via Email or WhatsApp. You can pick a saved Email Master (from <code>/api/email-masters</code>) and send using that configuration.</p>
//         </header>

//         {/* CHANNEL SELECTOR */}
//         <div className="grid grid-cols-2 gap-4 mb-8">
//           <button type="button" onClick={() => setChannel("email")} className={`flex items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all ${channel === "email" ? "border-blue-600 bg-white text-blue-700 shadow-md ring-1 ring-blue-200" : "border-gray-100 bg-white text-gray-600 hover:bg-gray-50"}`}>
//             <Mail className={`w-8 h-8 ${channel === "email" ? "text-blue-600" : "text-gray-400"}`} />
//             <div className="text-left">
//               <span className="block font-bold text-lg">Email Campaign</span>
//               <span className="text-xs opacity-80">Rich text, images, scheduled sends</span>
//             </div>
//           </button>

//           <button type="button" onClick={() => setChannel("whatsapp")} className={`flex items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all ${channel === "whatsapp" ? "border-green-600 bg-white text-green-700 shadow-md ring-1 ring-green-200" : "border-gray-100 bg-white text-gray-600 hover:bg-gray-50"}`}>
//             <MessageCircle className={`w-8 h-8 ${channel === "whatsapp" ? "text-green-600" : "text-gray-400"}`} />
//             <div className="text-left">
//               <span className="block font-bold text-lg">WhatsApp Blast</span>
//               <span className="text-xs opacity-80">High open rates, short messages</span>
//             </div>
//           </button>
//         </div>

//         {/* STATUS */}
//         {statusMessage && (
//           <div className={`p-4 mb-6 rounded-lg shadow-md ${statusMessage.type === "success" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`} dangerouslySetInnerHTML={{ __html: statusMessage.html }} />
//         )}

//         <form onSubmit={handleFormSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-xl border border-gray-100 space-y-8">
//           {/* SECTION 1: DETAILS */}
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
//               <span className="bg-gray-100 text-gray-600 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">1</span> Basic Details
//             </h2>

//             <div className="grid grid-cols-1 gap-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1 text-gray-600">Campaign Name</label>
//                 <input type="text" name="campaignName" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., Diwali Promo 2025" />
//               </div>

//               {channel === "email" && (
//                 <div>
//                   <label className="block text-sm font-medium mb-1 text-gray-600">Email Subject</label>
//                   <input type="text" name="emailSubject" required value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., Don't miss out!" />
//                 </div>
//               )}
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {channel === "email" && (
//                 <div>
//                   <label className="block text-sm font-medium mb-1 text-gray-600">Sender Name</label>
//                   <input type="text" name="sender" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={sender} onChange={(e) => setSender(e.target.value)} />
//                 </div>
//               )}

//               <div className={channel === "whatsapp" ? "col-span-2" : ""}>
//                 <label className="block text-sm font-medium mb-1 text-gray-600">Schedule Time</label>

//                 <input type="datetime-local" name="scheduledTime" required value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" />

//                 {scheduledTime && <p className="text-sm text-gray-600 mt-2">📅 Scheduled: <b>{formatStringToAMPM(scheduledTime)}</b></p>}
//               </div>
//             </div>

//             {/* NEW: Email Master selector */}
//             {channel === "email" && (
//               <div className="mt-2">
//                 <label className="block text-sm font-medium mb-1 text-gray-600">Use saved Email</label>
//                 <div className="flex gap-2 items-center">
//                   <select value={selectedEmailMasterId} onChange={(e) => setSelectedEmailMasterId(e.target.value)} className="p-2 border rounded w-full">
//                     <option value="">— Select saved email (email-master) —</option>
//                     {emailMasters.map((m) => (
//                       <option key={m._id || m.id} value={m._id || m.id}>{m.name || m.subject || m.from || m.title || (m.email || "Saved Email")}</option>
//                     ))}
//                   </select>

//                   <button type="button" onClick={() => { setSelectedEmailMasterId(""); setEmailSubject(""); setSender("Marketing Team"); setEmailContent("<p></p>"); setCtaText(""); }} className="px-3 py-2 text-sm bg-gray-100 rounded">Clear</button>
//                 </div>
//                 <p className="text-xs text-gray-500 mt-1">Selecting an Email Master will prefill subject, sender and html content.</p>
//               </div>
//             )}
//           </div>

//           {/* SECTION 2: AUDIENCE */}
//           <div className="space-y-4">
//             <div className="flex items-center justify-between border-b pb-2 mb-4">
//               <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
//                 <span className="bg-gray-100 text-gray-600 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">2</span> Audience
//               </h2>

//               <div className="flex bg-gray-100 p-1 rounded-lg">
//                 <button type="button" onClick={() => setRecipientSource("segment")} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${recipientSource === "segment" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Segment</button>
//                 <button type="button" onClick={() => setRecipientSource("excel")} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${recipientSource === "excel" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Upload Excel</button>
//                 <button type="button" onClick={() => setRecipientSource("manual")} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${recipientSource === "manual" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Manual Entry</button>
//               </div>
//             </div>

//             {/* SEGMENTS */}
//             {recipientSource === "segment" && (
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 {loadingSegments ? (
//                   <div className="col-span-2 py-8 text-center text-gray-400 animate-pulse">Fetching data from CRM...</div>
//                 ) : (
//                   segments.map((segment) => (
//                     <div key={segment.id} onClick={() => setSelectedSegment(segment.id)} className={`cursor-pointer p-4 rounded-xl border-2 relative transition-all ${selectedSegment === segment.id ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-blue-200"}`}>
//                       <div className="flex justify-between">
//                         <span className="font-bold text-gray-700">{segment.label}</span>
//                         {selectedSegment === segment.id && <CheckCircle className="w-5 h-5 text-blue-500" />}
//                       </div>
//                       <p className="text-xs text-gray-500 mt-1">{segment.desc}</p>
//                       <div className="mt-2 inline-block bg-white px-2 py-1 rounded border text-xs font-bold text-gray-600">{segment.count} Contacts</div>

//                       {/* Customers list */}
//                       {segment.id === "source_customers" && selectedSegment === "source_customers" && (
//                         <div className="mt-3 border-t pt-3">
//                           {loadingCustomers ? (
//                             <div className="text-sm text-gray-500">Loading customers...</div>
//                           ) : (
//                             <>
//                               <div className="flex gap-2 items-center mb-2">
//                                 <button type="button" onClick={selectAllCustomers} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">Select All</button>
//                                 <button type="button" onClick={clearAllCustomersSelection} className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded">Clear</button>
//                                 <div className="text-xs text-gray-500 ml-auto">{selectedCustomerIds.size} selected</div>
//                               </div>

//                               <div className="max-h-48 overflow-auto border rounded p-2 bg-white">
//                                 {customersList.length === 0 ? (
//                                   <div className="text-xs text-gray-500">No customers found</div>
//                                 ) : (
//                                   customersList.map((c) => (
//                                     <label key={c._id} className="flex items-center gap-2 text-sm py-1 border-b last:border-b-0">
//                                       <input type="checkbox" checked={selectedCustomerIds.has(c._id)} onChange={() => toggleCustomerSelect(c._id)} className="w-4 h-4" />
//                                       <div className="flex-1">
//                                         <div className="font-medium">{c.name || "—"}</div>
//                                         <div className="text-xs text-gray-500 font-mono">{c.email || "—"}</div>
//                                       </div>
//                                     </label>
//                                   ))
//                                 )}
//                               </div>
//                             </>
//                           )}
//                         </div>
//                       )}

//                       {/* Leads list */}
//                       {segment.id === "source_leads" && selectedSegment === "source_leads" && (
//                         <div className="mt-3 border-t pt-3">
//                           {loadingLeads ? (
//                             <div className="text-sm text-gray-500">Loading leads...</div>
//                           ) : (
//                             <>
//                               <div className="flex gap-2 items-center mb-2">
//                                 <button type="button" onClick={selectAllLeads} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">Select All</button>
//                                 <button type="button" onClick={clearAllLeadsSelection} className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded">Clear</button>
//                                 <div className="text-xs text-gray-500 ml-auto">{selectedLeadIds.size} selected</div>
//                               </div>

//                               <div className="max-h-48 overflow-auto border rounded p-2 bg-white">
//                                 {leadsList.length === 0 ? (
//                                   <div className="text-xs text-gray-500">No leads found</div>
//                                 ) : (
//                                   leadsList.map((c) => (
//                                     <label key={c._id} className="flex items-center gap-2 text-sm py-1 border-b last:border-b-0">
//                                       <input type="checkbox" checked={selectedLeadIds.has(c._id)} onChange={() => toggleLeadSelect(c._id)} className="w-4 h-4" />
//                                       <div className="flex-1">
//                                         <div className="font-medium">{c.name || "—"}</div>
//                                         <div className="text-xs text-gray-500 font-mono">{c.email || "—"}</div>
//                                       </div>
//                                     </label>
//                                   ))
//                                 )}
//                               </div>
//                             </>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   ))
//                 )}
//               </div>
//             )}

//             {/* EXCEL */}
//             {recipientSource === "excel" && (
//               <div className="space-y-3">
//                 <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50 hover:border-blue-400 transition relative">
//                   {excelFile ? (
//                     <div className="flex items-center justify-center gap-2 text-blue-600"><FileSpreadsheet /> {excelFile.name}</div>
//                   ) : (
//                     <div className="text-gray-400"><UploadCloud className="w-10 h-10 mx-auto mb-2" /><span className="text-sm">Upload .xlsx or .csv</span></div>
//                   )}

//                   <input type="file" accept=".xlsx,.csv" ref={excelInputRef} onChange={handleExcelChange} className="absolute inset-0 opacity-0 cursor-pointer" />
//                 </div>

//                 {excelFile && (
//                   <div className="flex justify-between items-center px-1">
//                     <p className="text-sm text-gray-500">{excelValidCount} valid emails detected • {excelInvalidCount} invalid • {excelSentCount} already sent</p>
//                     <div className="flex gap-2">
//                       <button type="button" onClick={downloadTemplate} className="px-3 py-2 text-sm bg-gray-100 rounded">Download template</button>
//                       <button type="button" onClick={clearExcel} className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded">Clear</button>
//                     </div>
//                   </div>
//                 )}

//                 {excelPreviewRows.length > 0 && (
//                   <div className="overflow-x-auto border rounded">
//                     <table className="w-full text-sm">
//                       <thead className="bg-gray-50 text-left">
//                         <tr><th className="p-2">#</th><th className="p-2">Email</th><th className="p-2">Status</th><th className="p-2">Raw</th></tr>
//                       </thead>
//                       <tbody>
//                         {excelPreviewRows.map((r) => (
//                           <tr key={r.id} className={`border-t ${r.valid ? "" : "bg-red-50"}`}>
//                             <td className="p-2">{r.id}</td>
//                             <td className="p-2 font-mono">{r.email || <span className="text-xs text-gray-400">—</span>}</td>
//                             <td className="p-2">{r.valid ? (r.isSent ? <span className="text-xs text-amber-700">Sent</span> : <span className="text-xs text-green-700">Valid</span>) : <span className="text-xs text-red-600">Invalid</span>}</td>
//                             <td className="p-2">{JSON.stringify(Object.fromEntries(Object.entries(r.raw).slice(0, 3)))}</td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* MANUAL */}
//             {recipientSource === "manual" && (
//               <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
//                 <label className="block text-sm font-bold text-gray-700 mb-2 items-center gap-2"><List className="w-4 h-4" />{channel === "email" ? "Enter Email Addresses" : "Enter Phone Numbers"}</label>
//                 <p className="text-xs text-gray-500 mb-2">Enter a single {channel === "email" ? "email" : "number"}, or paste a list separated by commas or new lines.</p>
//                 <textarea rows="5" name="manual" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" placeholder={channel === "email" ? "john@example.com, jane@test.com\nsupport@company.com" : "+919876543210\n+1234567890"} value={manualInput} onChange={(e) => setManualInput(e.target.value)}></textarea>
//                 <div className="text-right text-xs text-gray-500 mt-1">{manualInput.length > 0 ? `${manualInput.split(/[\n,]+/).filter((x) => x.trim()).length} Recipients detected` : "0 Recipients"}</div>
//               </div>
//             )}
//           </div>

//           {/* SECTION 3: CONTENT */}
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
//               <span className="bg-gray-100 text-gray-600 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">3</span>
//               {channel === "email" ? "Email Content" : "WhatsApp Message"}
//             </h2>

//             {channel === "email" && (
//               <div>
//                 <div className="min-h-[250px] border rounded p-2">
//                   <TiptapEditor
//                     key={`editor-${channel}-${selectedTemplateId || selectedEmailMasterId || "manual"}`}
//                     content={emailContent}
//                     onChange={handleEmailEditorChange}
//                   />
//                 </div>

//                 <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
//                   <input name="ctaText" value={ctaText} onChange={(e) => setCtaText(e.target.value)} className="p-3 border rounded-lg" placeholder="CTA (Shop Now)" />
//                   <input name="emailSubject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="p-3 border rounded-lg" placeholder="Email subject" />
//                   <div className="flex items-center gap-2">
//                     <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="p-2 border rounded w-full">
//                       <option value="">— Select Template (optional) —</option>
//                       {templates.map((t) => <option key={t._id || t.id} value={t._id || t.id}>{t.name || t.subject || `Template ${t._id?.slice?.(0,6)}`}</option>)}
//                     </select>
//                     <button type="button" onClick={downloadTemplate} className="px-3 py-2 bg-gray-100 rounded"><Download className="w-4 h-4" /></button>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {channel === "whatsapp" && (
//               <div className="bg-green-50 p-4 rounded-xl border border-green-200">
//                 <label className="block text-sm font-bold text-green-800 mb-2">Message Template</label>
//                 <textarea rows="6" value={whatsappContent} onChange={(e) => setWhatsappContent(e.target.value)} className="w-full p-4 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm" placeholder="Hello {{name}}, our Diwali sale is live! Get 50% off now."></textarea>
//                 <div className="flex justify-between text-xs text-green-700 mt-2"><span>Supports: *bold*, _italic_, ~strike~</span><span>{whatsappContent.length} chars</span></div>

//                 {/* also show template selector for whatsapp */}
//                 <div className="mt-3 flex gap-2 items-center">
//                   <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="p-2 border rounded w-full">
//                     <option value="">— Select Template (optional) —</option>
//                     {templates.map((t) => <option key={t._id || t.id} value={t._id || t.id}>{t.name || t.title}</option>)}
//                   </select>
//                   <button type="button" onClick={downloadTemplate} className="px-3 py-2 bg-gray-100 rounded"><Download className="w-4 h-4" /></button>
//                 </div>
//               </div>
//             )}

//             <div className="mt-4">
//               <div className="relative inline-block">
//                 <input type="file" id="file-upload" multiple className="hidden" onChange={handleAttachmentChange} />
//                 <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-1 text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded hover:bg-gray-200 transition"><Paperclip className="w-4 h-4" /> Attach Files</label>
//               </div>
//               {attachments.length > 0 && (
//                 <div className="mt-2 flex flex-wrap gap-2">
//                   {attachments.map((f, i) => (<span key={i} className="text-xs bg-gray-200 px-2 py-1 rounded flex items-center gap-1">{f.name} <X className="w-3 h-3 cursor-pointer" onClick={() => removeAttachment(i)} /></span>))}
//                 </div>
//               )}
//             </div>
//           </div>

//           <button type="submit" disabled={loading} className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transform transition hover:-translate-y-1 ${loading ? "bg-gray-400" : channel === "email" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}>
//             {loading ? "Scheduling..." : `Schedule ${channel === "email" ? "Email" : "WhatsApp"} Campaign`}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }


