"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import TiptapEditor from "@/components/TiptapEditor"; // Import your editor
import { 
  Loader2, 
  ChevronLeft, 
  Save, 
  Layout, 
  Mail, 
  Type,
  Eye
} from "lucide-react";
import { toast } from "react-toastify";

export default function EditCampaignPage() {
  const { id } = useParams();
  const router = useRouter();

  // Logic States
  const [campaignName, setCampaignName] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [content, setContent] = useState(""); // This holds the HTML
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (id) fetchCampaign();
  }, [id]);

  async function fetchCampaign() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/campaign/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const c = res.data.data;
        setCampaignName(c.campaignName || "");
        setEmailSubject(c.emailSubject || "");
        // If content is empty, provide a default paragraph so Tiptap doesn't crash
        setContent(c.content || "<p></p>"); 
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load campaign data");
    } finally {
      setLoading(false);
    }
  }

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
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-6 transition-all"
        >
          <ChevronLeft size={14} /> Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Editor Side */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
              <header className="mb-8 border-b border-slate-50 pb-6">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Edit <span className="text-indigo-600">Campaign</span>
                </h1>
                <p className="text-slate-400 text-sm font-medium mt-1">Modify your message and save changes instantly.</p>
              </header>

              <form onSubmit={handleUpdate} className="space-y-8">
                {/* Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Campaign Name</label>
                    <input
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      required
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-700 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Subject</label>
                    <input
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-700 transition-all"
                    />
                  </div>
                </div>

                {/* Rich Text Editor Section */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Content Editor</label>
                  <div className="rounded-[2rem] border border-slate-100 overflow-hidden bg-white shadow-inner min-h-[400px]">
                    <TiptapEditor 
                      content={content} 
                      onChange={(html) => setContent(html)} 
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full py-5 bg-slate-900 hover:bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3 disabled:bg-slate-300"
                >
                  {isUpdating ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Update All Changes</>}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Live Preview (X Version) */}
          <div className="lg:col-span-4 sticky top-10">
            <div className="bg-slate-900 rounded-[3.5rem] p-4 shadow-2xl border-[10px] border-slate-800 aspect-[9/19] max-w-[320px] mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-800 rounded-b-3xl z-20"></div>
                <div className="bg-white h-full w-full rounded-[2.5rem] overflow-hidden flex flex-col">
                    <div className="bg-slate-50 p-4 pt-10 text-center border-b border-slate-100">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl mx-auto flex items-center justify-center font-black mb-1">
                          {campaignName ? campaignName.charAt(0) : 'C'}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Preview</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 text-[11px] leading-relaxed text-slate-600">
                        <h4 className="font-black text-slate-800 mb-2">{emailSubject || "Subject Line..."}</h4>
                        {/* This part correctly renders the HTML for the preview */}
                        <div 
                          className="preview-content" 
                          dangerouslySetInnerHTML={{ __html: content }} 
                        />
                    </div>
                </div>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
               <Eye size={14} /> Real-time Simulation
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// "use client";

// import { useParams, useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import axios from "axios";

// export default function EditCampaignPage() {
//   const { id } = useParams();
//   const router = useRouter();

//   const [campaignName, setCampaignName] = useState("");
//   const [emailSubject, setEmailSubject] = useState("");
//   const [content, setContent] = useState("");
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (id) fetchCampaign();
//   }, [id]);

//   async function fetchCampaign() {
//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.get(`/api/campaign/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (res.data.success) {
//         const c = res.data.data;
//         setCampaignName(c.campaignName);
//         setEmailSubject(c.emailSubject || "");
//         setContent(c.content || "");
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Failed to load");
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleUpdate(e) {
//     e.preventDefault();

//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.put(
//         `/api/campaign/${id}`,
//         {
//           campaignName,
//           emailSubject,
//           content,
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       if (res.data.success) {
//         alert("Campaign Updated ✅");
//         router.push(`/campaigns/${id}`);
//       }
//     } catch (err) {
//       alert("Update Failed");
//     }
//   }

//   if (loading) return <p className="p-6">Loading...</p>;

//   return (
//     <div className="max-w-3xl mx-auto p-6 space-y-6">
//       <h1 className="text-xl font-bold">Edit Campaign</h1>

//       <form onSubmit={handleUpdate} className="space-y-4">
//         <div>
//           <label className="block font-semibold">Campaign Name</label>
//           <input
//             value={campaignName}
//             onChange={(e) => setCampaignName(e.target.value)}
//             className="w-full border p-3 rounded"
//           />
//         </div>

//         <div>
//           <label className="block font-semibold">Email Subject</label>
//           <input
//             value={emailSubject}
//             onChange={(e) => setEmailSubject(e.target.value)}
//             className="w-full border p-3 rounded"
//           />
//         </div>

//         <div>
//           <label className="block font-semibold">Content</label>
//           <textarea
//             rows={8}
//             value={content}
//             onChange={(e) => setContent(e.target.value)}
//             className="w-full border p-3 rounded"
//           />
//         </div>

//         <button className="bg-blue-600 text-white px-6 py-3 rounded">
//           Update Campaign
//         </button>
//       </form>
//     </div>
//   );
// }
