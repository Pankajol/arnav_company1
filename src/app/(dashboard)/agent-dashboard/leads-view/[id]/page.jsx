"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  ArrowLeft, 
  Edit3, 
  Globe, 
  ShieldCheck, 
  Loader2,
  Calendar,
  Briefcase
} from "lucide-react";
import { toast } from "react-toastify";

const ViewLeadPage = ({ params: paramsPromise }) => {
  // ✅ Next.js 15: Unwrap the params promise
  const params = use(paramsPromise);
  const id = params.id;

  const router = useRouter();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("User not authenticated.");
          setLoading(false);
          return;
        }

        const response = await axios.get(`/api/lead/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Handle nested data if your API returns { success: true, data: ... }
        setLead(response.data?.data || response.data);
      } catch (err) {
        console.error("Error fetching lead:", err);
        setError(err.response?.data?.message || "Failed to load lead details.");
        toast.error("Lead not found");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchLead();
  }, [id]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
      <div className="text-center">
        <Loader2 className="animate-spin text-blue-600 mb-4 mx-auto" size={40} />
        <p className="text-slate-500 font-medium tracking-wide">Loading Profile...</p>
      </div>
    </div>
  );

  if (error || !lead) return (
    <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center max-w-sm">
        <p className="text-red-500 font-bold mb-4">{error || "No data found."}</p>
        <button onClick={() => router.push("/agent-dashboard/leads-view")} className="flex items-center gap-2 text-blue-600 font-bold mx-auto">
          <ArrowLeft size={18} /> Back to Pipeline
        </button>
      </div>
    </div>
  );

  // Reusable component for detail rows
  const DetailItem = ({ icon: Icon, label, value, color = "text-slate-400" }) => (
    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
      <div className={`p-2 bg-white border border-slate-100 rounded-lg shadow-sm ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-slate-700 font-semibold">{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans">
      {/* Top Action Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push("/agent-dashboard/leads-view")} 
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-all"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <button 
            onClick={() => router.push(`/agent-dashboard/LeadDetailsFormMaster/${id}`)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Edit3 size={18} /> Edit Lead
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Profile Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm text-center sticky top-24">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-100 mb-6">
                {lead.firstName?.[0]}
              </div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                {lead.firstName} {lead.lastName}
              </h1>
              <p className="text-blue-600 font-bold text-sm mt-1 uppercase tracking-widest">
                {lead.jobTitle || "Potential Client"}
              </p>
              
              <div className="mt-6">
                <span className="px-4 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-black uppercase tracking-widest">
                  {lead.status || "Lead"}
                </span>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                 <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <Mail size={16} className="text-blue-500" />
                    <span className="text-xs font-bold truncate">{lead.email || "No Email"}</span>
                 </div>
                 <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <Phone size={16} className="text-green-500" />
                    <span className="text-xs font-bold">{lead.mobileNo || "No Phone"}</span>
                 </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Detailed Specs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card: Business Info */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
                <Briefcase size={20} className="text-blue-600" />
                <h2 className="font-black text-slate-800 text-sm uppercase tracking-[0.2em]">Company Profile</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-6">
                <DetailItem icon={Building2} label="Organization" value={lead.organizationName} color="text-indigo-500" />
                <DetailItem icon={Globe} label="Website" value={lead.website} color="text-sky-500" />
                <DetailItem icon={ShieldCheck} label="Lead Owner" value={lead.leadOwner} color="text-emerald-500" />
                <DetailItem icon={Calendar} label="Last Updated" value={lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : "N/A"} color="text-amber-500" />
              </div>
            </div>

            {/* Card: Location & Industry */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
                <MapPin size={20} className="text-red-500" />
                <h2 className="font-black text-slate-800 text-sm uppercase tracking-[0.2em]">Geography & Market</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-6">
                <DetailItem icon={MapPin} label="City" value={lead.city} color="text-red-400" />
                <DetailItem icon={MapPin} label="State" value={lead.state} color="text-rose-400" />
                <DetailItem icon={Globe} label="Industry" value={lead.industry} color="text-violet-400" />
                <DetailItem icon={User} label="Source" value={lead.source} color="text-slate-400" />
              </div>
            </div>

            {/* Additional Custom Fields (If Any) */}
            {lead.customFields && Object.keys(lead.customFields).length > 0 && (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
                  <h2 className="font-black text-slate-800 text-sm uppercase tracking-[0.2em]">Custom Field Data</h2>
                </div>
                <div className="p-8 grid grid-cols-2 gap-4">
                  {Object.entries(lead.customFields).map(([key, val]) => (
                    <div key={key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{key}</p>
                      <p className="text-sm font-bold text-slate-700">{val || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewLeadPage;