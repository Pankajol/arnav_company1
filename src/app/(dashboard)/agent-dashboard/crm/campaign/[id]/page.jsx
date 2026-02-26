"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import TiptapEditor from "@/components/TiptapEditor"; 
import { 
  Loader2, ChevronLeft, Save, Layout, Mail, Type, 
  Eye, Users, CheckCircle, Smartphone, UserCheck, Info
} from "lucide-react";
import { toast } from "react-toastify";

export default function EditCampaignPage() {
  const { id } = useParams();
  const router = useRouter();

  // Logic States
  const [campaignName, setCampaignName] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [content, setContent] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Audience Data (Self-contained)
  const [recipientSource, setRecipientSource] = useState("segment");
  const [recipientList, setRecipientList] = useState([]); 

  useEffect(() => {
    if (id) fetchCampaign();
  }, [id]);

  async function fetchCampaign() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch ONLY the campaign data
      const res = await axios.get(`/api/campaign/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (res.data.success) {
        const c = res.data.data;
        setCampaignName(c.campaignName || "");
        setEmailSubject(c.emailSubject || "");
        setContent(c.content || "<p></p>"); 
        setRecipientSource(c.recipientSource || "segment");
        
        // Use either recipientList, recipientExcelEmails, or manual string
        const list = c.recipientList || c.recipientExcelEmails || [];
        setRecipientList(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load campaign data");
    } finally {
      setLoading(false);
    }
  }

  // --- SELF-CONTAINED VIEW LOGIC ---
  // This extracts info from the raw list without needing /api/customers
  const displayRecipients = useMemo(() => {
    return recipientList.map((item, index) => {
      const isEmail = String(item).includes("@");
      return {
        id: index,
        val: item,
        type: isEmail ? "Email" : "Phone",
        initial: String(item).charAt(0).toUpperCase()
      };
    });
  }, [recipientList]);

  async function handleUpdate(e) {
    e.preventDefault();
    if (isUpdating) return; 

    try {
      setIsUpdating(true);
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `/api/campaign/${id}`,
        { campaignName, emailSubject, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success("Campaign Updated ✅");
        router.push(`/agent-dashboard/crm/campaign`);
      }
    } catch (err) {
      toast.error("Update Failed");
    } finally {
      setIsUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
            <p className="text-slate-500 font-bold">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-10 font-sans">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-[0.2em] transition-all"
            >
                <ChevronLeft size={14} /> Back to Dashboard
            </button>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                Campaign ID: <span className="text-indigo-600">{id?.slice(-8)}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* EDITOR SIDE */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
              <header className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                  Edit <span className="text-indigo-600">Campaign</span>
                </h1>
                <p className="text-slate-400 font-medium mt-2">Update your messaging and identity settings.</p>
              </header>

              <form onSubmit={handleUpdate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-2 block">Campaign Name</label>
                    <input
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      required
                      className="w-full px-8 py-5 bg-slate-50 border-none rounded-[2rem] focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all"
                    />
                  </div>

                  <div className="group">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-2 block">Email Subject</label>
                    <input
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-8 py-5 bg-slate-50 border-none rounded-[2rem] focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-2 block">Visual Content</label>
                  <div className="rounded-[2.5rem] border border-slate-100 overflow-hidden bg-white shadow-inner min-h-[450px]">
                    <TiptapEditor content={content} onChange={setContent} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full py-6 bg-slate-900 hover:bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-3 disabled:bg-slate-300"
                >
                  {isUpdating ? <Loader2 className="animate-spin" /> : <><Save size={24} /> Save Campaign Changes</>}
                </button>
              </form>
            </div>
          </div>

          {/* PREVIEW SIDE */}
          <div className="lg:col-span-5 space-y-8 sticky top-10">
            
            {/* Live Visual Preview */}
            <div className="bg-slate-900 rounded-[3.5rem] p-4 shadow-2xl border-[10px] border-slate-800 aspect-[9/16] max-w-[340px] mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-800 rounded-b-3xl z-20"></div>
                <div className="bg-white h-full w-full rounded-[2.5rem] overflow-hidden flex flex-col">
                    <div className="bg-slate-50 p-6 pt-10 text-center border-b border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Live View</p>
                        <h4 className="font-black text-slate-800 text-sm truncate px-4">{emailSubject || "No Subject"}</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 text-[11px] leading-relaxed text-slate-600 custom-scrollbar">
                        <div dangerouslySetInnerHTML={{ __html: content }} />
                    </div>
                </div>
            </div>

            {/* RECIPIENT VIEW (The "Self-Contained" version you asked for) */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Users size={18} />
                        </div>
                        <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Active Audience</h3>
                    </div>
                    <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-bold">
                        {displayRecipients.length} Records
                    </span>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        <UserCheck size={14} className="text-emerald-500" /> 
                        Source: <span className="text-indigo-600 font-black">{recipientSource.toUpperCase()}</span>
                    </div>

                    {/* Scrollable Recipient List (Built from campaign data only) */}
                    <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {displayRecipients.length > 0 ? (
                            displayRecipients.map((rec) => (
                                <div key={rec.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-xs font-black text-indigo-600 border border-slate-100">
                                            {rec.initial}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-slate-800 truncate max-w-[180px]">{rec.val}</p>
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${rec.type === 'Email' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                                {rec.type}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-loose">
                                    No recipient data<br/>found in campaign
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                        <div className="flex gap-3">
                            <Info size={16} className="text-indigo-600 shrink-0" />
                            <p className="text-[9px] font-bold text-indigo-700/70 leading-relaxed uppercase tracking-wider">
                                This list reflects the snapshots saved during campaign creation. 
                                Updates to CRM profiles will not appear here.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}


// "use client";

// import { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
// import Link from "next/link";
// import axios from "axios";

// export default function CampaignViewPage() {
//   const { id } = useParams();
//   const [campaign, setCampaign] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (id) loadCampaign();
//   }, [id]);

//   const loadCampaign = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.get(`/api/campaign/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (res.data.success) setCampaign(res.data.data);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to load campaign");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <p className="p-6">Loading...</p>;
//   if (!campaign) return <p className="p-6">Campaign not found</p>;

//   return (
//     <div className="max-w-5xl mx-auto p-6 space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold">{campaign.campaignName}</h1>
//         <div className="space-x-3">
//           <Link
//             href={`/campaign/${id}/edit`}
//             className="px-4 py-2 bg-green-600 text-white rounded"
//           >
//             Edit
//           </Link>

//           <Link
//             href={`/campaigns/${id}/report`}
//             className="px-4 py-2 bg-purple-600 text-white rounded"
//           >
//             View Report
//           </Link>
//         </div>
//       </div>

//       <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded shadow">
//         <p><b>Channel:</b> {campaign.channel}</p>
//         <p><b>Status:</b> {campaign.status}</p>
//         <p><b>Scheduled:</b> {new Date(campaign.scheduledTime).toLocaleString()}</p>
//         <p><b>Audience:</b> {campaign.recipientSource}</p>
//       </div>

//       {campaign.channel === "email" && (
//         <>
//           <h2 className="font-bold">Subject</h2>
//           <div className="p-3 border rounded bg-white">
//             {campaign.emailSubject}
//           </div>
//         </>
//       )}

//       <h2 className="font-bold">
//         {campaign.channel === "email" ? "Email Content" : "WhatsApp Message"}
//       </h2>

//       {campaign.channel === "email" ? (
//         <div
//           className="border rounded p-4 bg-white"
//           dangerouslySetInnerHTML={{ __html: campaign.content }}
//         />
//       ) : (
//         <div className="border rounded p-4 bg-green-50 whitespace-pre-line">
//           {campaign.content}
//         </div>
//       )}
//     </div>
//   );
// }
